"""Utility helpers for the gym app.

Put common, reusable functions here so views and other modules can call them.
"""
from typing import Any


def has_active_membership_or_owner_or_staff(user: Any, gym: Any) -> bool:
    """Return True if the `user` is allowed to check in to `gym`.

    Allowed if the user is staff, the gym owner, or has an active Membership
    for the gym. Importing `Membership` is done lazily to avoid circular
    imports during module load.
    """
    if user.is_staff:
        return True
    if getattr(gym, 'owner', None) == user:
        return True

    # Lazy import to avoid importing models at package import time
    from .models import Membership

    return Membership.objects.filter(user=user, gym=gym, is_active=True).exists()
