"""Utility helpers for the gym app.

Put common, reusable functions here so views and other modules can call them.
"""
from typing import Any


def has_active_membership_or_owner_or_staff(user: Any, gym: Any) -> bool:
    """Return True if the `user` is allowed to check in to `gym`.

    Allowed if the user is staff, the gym owner, or has an active Membership
    for the gym. Supports both new Member-based and legacy User-based architecture.
    """
    if user.is_staff:
        return True
    if getattr(gym, 'owner', None) == user:
        return True

    # Lazy import to avoid importing models at package import time
    from .models import Membership, Member

    # New architecture: Check via Member
    member = Member.objects.filter(user=user, gym=gym).first()
    if member:
        if Membership.objects.filter(member=member, is_active=True).exists():
            return True

    # Legacy architecture: Check direct user-gym relationship
    if Membership.objects.filter(user=user, gym=gym, is_active=True).exists():
        return True

    return False


def get_active_member(user: Any, gym: Any):
    """Get the active Member record for a user in a gym.
    
    Returns the Member instance if exists and has active membership, else None.
    """
    from .models import Member, Membership
    
    member = Member.objects.filter(user=user, gym=gym).first()
    if member:
        if Membership.objects.filter(member=member, is_active=True).exists():
            return member
    return None


def get_user_gym(user: Any):
    """Get the gym where user has active membership.
    
    Returns the first gym with active membership, or None.
    Supports both Member-based and legacy architecture.
    """
    from .models import Member, Membership
    
    # Try Member-based first
    member = Member.objects.filter(
        user=user,
        memberships__is_active=True
    ).select_related('gym').first()
    if member:
        return member.gym
    
    # Legacy: direct user-gym
    membership = Membership.objects.filter(
        user=user,
        is_active=True
    ).select_related('gym').first()
    if membership:
        return membership.gym
    
    return None


def parse_slot_param(date_obj, slot_param):
    """Parse a slot query parameter into a start/end datetime pair in UTC.

    slot_param: 'current', 'next', 'next_to_next'

    Slots are 1 hour, with 'current' based on pivot 30 min earlier, rounded to nearest 30 min.
    """
    from datetime import datetime, timedelta, timezone
    from django.utils import timezone as django_timezone

    utc = timezone.utc

    now = django_timezone.localtime(django_timezone.now())
    # pivot 30 minutes earlier
    pivot = now - timedelta(minutes=30)
    # round down to 30 min
    minute = pivot.minute
    rounded_minute = 30 if minute >= 30 else 0
    current_start = pivot.replace(minute=rounded_minute, second=0, microsecond=0)
    current_end = current_start + timedelta(hours=1)

    if slot_param == 'current':
        slot_start = current_start
        slot_end = current_end
    elif slot_param == 'next':
        slot_start = current_start + timedelta(minutes=30)
        slot_end = slot_start + timedelta(hours=1)
    elif slot_param == 'next_to_next':
        slot_start = current_start + timedelta(hours=1)
        slot_end = slot_start + timedelta(hours=1)
    else:
        return None, None

    # Set the date to the target date.  We compute start/end relative to the
    # *local* pivot time above, but simply replacing the date can accidentally
    # move the end time backwards when the slot crosses midnight.  For example
    # a local slot_start of 23:30 with slot_end 00:30 (next day) would both be
    # stamped with the same calendar day, making end < start.  That in turn
    # makes range queries behave incorrectly (an activity that started at
    # 23:32 would not satisfy started_at < slot_end because slot_end is
    # earlier than slot_start).
    #
    # To fix this we perform the replace then, if necessary, bump the end by a
    # day to preserve the one‑hour duration.
    slot_start = slot_start.replace(year=date_obj.year, month=date_obj.month, day=date_obj.day)
    slot_end = slot_end.replace(year=date_obj.year, month=date_obj.month, day=date_obj.day)

    if slot_end <= slot_start:
        # crossed midnight, add one day
        from datetime import timedelta

        slot_end = slot_end + timedelta(days=1)

    # Convert to UTC for DB queries
    slot_start_utc = slot_start.astimezone(utc)
    slot_end_utc = slot_end.astimezone(utc)

    return slot_start_utc, slot_end_utc


def diff_body_part_counts(current_counts, prev_counts):
    """Return a dict mapping body part to change (current - previous).

    Includes negative values if a body part was higher previously, and zero
    for unchanged parts. Missing keys are treated as zero.
    """
    diff = {}
    for bp in set(current_counts.keys()) | set(prev_counts.keys()):
        diff[bp] = current_counts.get(bp, 0) - prev_counts.get(bp, 0)
    return diff
