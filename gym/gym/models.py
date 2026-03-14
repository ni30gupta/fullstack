from django.db import models
from django.contrib.gis.db.models import PointField
from django.conf import settings


class Gym(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        db_column='owner_id',
        related_name='gyms',
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=255)
    address = models.TextField()
    location = PointField(
        null=True, blank=True, geography=True, srid=4326,
        help_text='Geographic point stored as (longitude, latitude) in WGS84'
    )
    opening_time = models.TimeField()
    closing_time = models.TimeField()
    max_capacity = models.IntegerField()
    gym_type = models.CharField(max_length=50, null=True, blank=True)  # e.g. "CrossFit", "Yoga", "General Fitness"
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    verified = models.BooleanField(default=False)  # For admin approval of new gyms


    class Meta:
        db_table = 'gym'
        constraints = [
            models.UniqueConstraint(fields=['owner', 'name'], name='unique_owner_gym_name')
        ]

    def __str__(self):
        return self.name


class Member(models.Model):
    """
    Domain model representing a person's membership record in a specific gym.
    
    Architecture: User → Member → Membership
    - User = authentication identity (always created, even by gym owner)
    - Member = a person's record in a gym (always linked to User)
    - Membership = membership period/history
    
    When gym owner adds a member, a User account is created automatically.
    The member can then login via OTP to access their account.
    """
    gym = models.ForeignKey(
        Gym,
        on_delete=models.CASCADE,
        db_column='gym_id',
        related_name='members'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column='user_id',
        related_name='gym_members',
        help_text='Linked user account. Always present.'
    )
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, db_index=True)
    email = models.EmailField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'member'
        indexes = [
            models.Index(fields=['gym', 'phone']),
            models.Index(fields=['phone']),
            models.Index(fields=['user']),
        ]
        constraints = [
            # Prevent duplicate users within the same gym
            models.UniqueConstraint(fields=['gym', 'user'], name='unique_gym_user'),
            # Prevent duplicate phone numbers within the same gym
            models.UniqueConstraint(
                fields=['gym', 'phone'],
                name='unique_gym_phone',
                condition=models.Q(phone__gt='')  # Only enforce when phone is not empty
            )
        ]

    def __str__(self):
        return f"{self.name} - {self.gym.name} ({self.user.username})"

    @classmethod
    def get_or_create_for_user(cls, user, gym, defaults=None):
        """
        Get or create a Member for the given user and gym.
        """
        defaults = defaults or {}
        
        # Try to find an existing member for this user+gym
        member = cls.objects.filter(user=user, gym=gym).first()
        if member:
            return member, False
        
        # Create new member
        phone = getattr(user, 'phone', '') or defaults.get('phone', '')
        name = defaults.get('name', getattr(user, 'username', ''))
        
        member = cls.objects.create(
            gym=gym,
            user=user,
            name=name,
            phone=phone,
            email=defaults.get('email', getattr(user, 'email', None))
        )
        return member, True


class Membership(models.Model):
    """
    Represents a membership period (subscription) for a Member.
    
    Architecture: Member → Membership (many memberships per member)
    This allows tracking membership history and renewals.
    """
    # New architecture: membership belongs to a Member
    member = models.ForeignKey(
        Member,
        on_delete=models.CASCADE,
        db_column='member_id',
        related_name='memberships',
        null=True,  # Temporarily nullable during migration
        blank=True
    )
    
    # Legacy fields - kept for backward compatibility during transition
    # TODO: Remove after full migration to Member-based architecture
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column='user_id',
        related_name='memberships',
        null=True,  # Now nullable
        blank=True
    )
    gym = models.ForeignKey(
        Gym,
        on_delete=models.CASCADE,
        db_column='gym_id',
        related_name='memberships',
        null=True,  # Now nullable (will get gym from member)
        blank=True
    )
    
    duration_months = models.PositiveSmallIntegerField(default=1)  # Duration in months (1-24)
    start_date = models.DateField(null=True, blank=True)  # Set when activated by gym owner
    end_date = models.DateField(null=True, blank=True)  # Calculated from start_date + duration
    is_active = models.BooleanField(default=False)  # Initially inactive until gym owner verifies
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # Total fee agreed
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # Amount collected so far
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'membership'
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['gym', 'is_active']),
            models.Index(fields=['member', 'is_active']),
            models.Index(fields=['member', 'end_date']),
        ]
    
    def __str__(self):
        if self.member:
            return f"{self.member.name} - {self.member.gym.name} ({self.duration_months} months)"
        elif self.user:
            return f"{self.user.username} - {self.gym.name} ({self.duration_months} months)"
        return f"Membership #{self.pk}"
    
    @property
    def effective_user(self):
        """Get user - prefer member.user, fallback to direct user."""
        if self.member and self.member.user:
            return self.member.user
        return self.user
    
    @property
    def effective_gym(self):
        """Get gym - prefer member.gym, fallback to direct gym."""
        if self.member:
            return self.member.gym
        return self.gym
    
    def activate(self):
        """Activate the membership and set start/end dates."""
        from datetime import date
        from dateutil.relativedelta import relativedelta
        
        self.is_active = True
        self.start_date = date.today()
        self.end_date = self.start_date + relativedelta(months=self.duration_months)
        self.save()
        return self
    
    def save(self, *args, **kwargs):
        """Ensure gym is synced from member if member is set."""
        if self.member and not self.gym:
            self.gym = self.member.gym
        super().save(*args, **kwargs)


# NOTE: GymVisit removed — using only GymActivity for tracking checkins and body parts.


class GymRushSnapshot(models.Model):
    """Track gym capacity and rush levels in real-time"""
    RUSH_LEVEL_CHOICES = (
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
    )
    
    gym = models.ForeignKey(
        Gym,
        on_delete=models.CASCADE,
        db_column='gym_id',
        related_name='rush_snapshots'
    )
    current_count = models.IntegerField()  # Number of people currently in gym
    rush_percent = models.DecimalField(max_digits=5, decimal_places=2)  # Percentage of capacity (0-100)
    rush_level = models.CharField(max_length=10, choices=RUSH_LEVEL_CHOICES)
    captured_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'gym_rush_snapshot'
        ordering = ['-captured_at']
        indexes = [
            models.Index(fields=['gym', 'captured_at']),
            models.Index(fields=['gym', 'rush_level']),
        ]
    
    def __str__(self):
        return f"{self.gym.name} - {self.rush_level} ({self.rush_percent}%) at {self.captured_at}"


class BodyPart(models.Model):
    """Master table for body parts/workout areas"""
    BODY_PART_CHOICES = (
        ('CHEST', 'Chest'),
        ('BACK', 'Back'),
        ('LEGS', 'Legs'),
        ('SHOULDER', 'Shoulder'),
        ('CARDIO', 'Cardio'),
        ('ARMS', 'Arms'),
        ('BICEPS', 'Biceps'),
        ('TRICEPS', 'Triceps'),
        ('ABS', 'Abs'),
        ('MIXED', 'Mixed'),
    )
    
    name = models.CharField(max_length=20, choices=BODY_PART_CHOICES, unique=True)
    
    class Meta:
        db_table = 'body_part'
        ordering = ['name']
    
    def __str__(self):
        return self.get_name_display()


class GymActivity(models.Model):
    """Track what body part each user is currently working on during a checkin."""
    gym = models.ForeignKey(
        Gym,
        on_delete=models.CASCADE,
        db_column='gym_id',
        related_name='activities'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column='user_id',
        related_name='gym_activities'
    )
    body_part = models.ForeignKey(
        BodyPart,
        on_delete=models.CASCADE,
        db_column='body_part_id',
        related_name='activities'
    )
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)  # NULL = still working
    
    class Meta:
        db_table = 'gym_activity'
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['gym', 'started_at']),
            models.Index(fields=['user', 'started_at']),
            models.Index(fields=['body_part', 'started_at']),
            models.Index(fields=['gym', 'body_part', 'ended_at']),  # For active workouts
        ]
    
    def __str__(self):
        status = "Active" if self.ended_at is None else "Completed"
        return f"{self.user.username} - {self.body_part.name} at {self.gym.name} ({status})"

    def checkout(self, ended_at=None):
        """Mark this activity as ended. Returns True if updated, False if already ended."""
        from django.utils import timezone

        if self.ended_at is not None:
            return False
        self.ended_at = ended_at or timezone.now()
        self.save(update_fields=['ended_at'])
        return True

'''
class MemberPoints(models.Model):
    """Aggregated leaderboard points for each member per gym."""
    membership = models.OneToOneField(
        Membership,
        on_delete=models.CASCADE,
        related_name='points'
    )
    total_points = models.IntegerField(default=0)
    streak_days = models.PositiveIntegerField(default=0)  # Consecutive days attended
    last_activity_date = models.DateField(null=True, blank=True)  # For streak tracking
    rank = models.PositiveIntegerField(null=True, blank=True)  # Cached rank (updated periodically)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'member_points'
        indexes = [
            models.Index(fields=['total_points']),
            models.Index(fields=['rank']),
        ]

    def __str__(self):
        return f"{self.membership.user.username} - {self.total_points} pts"

    def add_points(self, points, reason, description='', activity=None):
        """Add points and create a transaction record."""
        self.total_points += points
        self.save(update_fields=['total_points', 'updated_at'])
        
        return PointTransaction.objects.create(
            member_points=self,
            activity=activity,
            points=points,
            reason=reason,
            description=description
        )

    def update_streak(self, activity_date):
        """Update streak based on activity date."""
        from datetime import timedelta
        
        if self.last_activity_date is None:
            self.streak_days = 1
        elif activity_date == self.last_activity_date:
            # Same day, no change
            return
        elif activity_date == self.last_activity_date + timedelta(days=1):
            # Consecutive day
            self.streak_days += 1
        else:
            # Streak broken
            self.streak_days = 1
        
        self.last_activity_date = activity_date
        self.save(update_fields=['streak_days', 'last_activity_date', 'updated_at'])


class PointTransaction(models.Model):
    """Historical record of all point changes."""
    REASON_CHOICES = (
        ('CHECKIN', 'Daily Check-in'),
        ('PREFERRED_SLOT', 'Preferred Slot Bonus'),
        ('STREAK_7', '7-Day Streak Bonus'),
        ('STREAK_30', '30-Day Streak Bonus'),
        ('WEEKLY_CONSISTENCY', 'Weekly Consistency Bonus'),
        ('EXERCISE_VIOLATION', 'Exercise Violation Report'),
        ('VERIFIED_VIOLATION', 'Verified Exercise Violation'),
        ('MANUAL_ADJUSTMENT', 'Manual Adjustment'),
    )

    member_points = models.ForeignKey(
        MemberPoints,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    activity = models.ForeignKey(
        GymActivity,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='point_transactions'
    )
    points = models.IntegerField()  # Can be positive or negative
    reason = models.CharField(max_length=30, choices=REASON_CHOICES)
    description = models.TextField(blank=True)  # Optional details
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'point_transaction'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['member_points', 'created_at']),
            models.Index(fields=['reason']),
        ]

    def __str__(self):
        sign = '+' if self.points >= 0 else ''
        return f"{self.member_points.membership.user.username}: {sign}{self.points} ({self.reason})"
'''