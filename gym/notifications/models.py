from django.conf import settings
from django.db import models

# Create your models here.
class Notification(models.Model):

    CATEGORY_CHOICES = [
        ("gym_update", "Gym Update"),
        ("leaderboard", "Leaderboard"),
        ("user_reminder", "User Reminder"),
    ]

    gym = models.ForeignKey(
        "gym.Gym",
        null=True,
        blank=True,
        on_delete=models.CASCADE
    )

    title = models.CharField(max_length=200)

    message = models.TextField()

    category = models.CharField(
        max_length=30,
        choices=CATEGORY_CHOICES
    )

    persistent = models.BooleanField(default=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )

    created_at = models.DateTimeField(auto_now_add=True)
    
class UserNotification(models.Model):

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    notification = models.ForeignKey(
        Notification,
        on_delete=models.CASCADE
    )

    is_read = models.BooleanField(default=False)
    
    read_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)