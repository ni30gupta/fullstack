from django.db import models
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
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    opening_time = models.TimeField()
    closing_time = models.TimeField()
    max_capacity = models.IntegerField()
    gym_type = models.CharField(max_length=50, null=True, blank=True)  # e.g. "CrossFit", "Yoga", "General Fitness"
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    verified = models.BooleanField(default=False)  # For admin approval of new gyms


    class Meta:
        db_table = 'gym'

    def __str__(self):
        return self.name


class Membership(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, db_column='user_id', related_name='memberships')
    gym = models.ForeignKey(Gym, on_delete=models.CASCADE, db_column='gym_id', related_name='memberships')
    duration_months = models.PositiveSmallIntegerField(default=1)  # Duration in months (1-24)
    start_date = models.DateField(null=True, blank=True)  # Set when activated by gym owner
    end_date = models.DateField(null=True, blank=True)  # Calculated from start_date + duration
    is_active = models.BooleanField(default=False)  # Initially inactive until gym owner verifies
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'membership'
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['gym', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.gym.name} ({self.duration_months} months)"
    
    def activate(self):
        """Activate the membership and set start/end dates."""
        from datetime import date
        from dateutil.relativedelta import relativedelta
        
        self.is_active = True
        self.start_date = date.today()
        self.end_date = self.start_date + relativedelta(months=self.duration_months)
        self.save()
        return self


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
