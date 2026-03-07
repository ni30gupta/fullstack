from django.db import models
from django.conf import settings


# Keep only UserProfile in the `user` app; gym-related models moved to the
# dedicated `gym` app.
class UserProfile(models.Model):
    GENDER_CHOICES = (
        ('MALE', 'Male'),
        ('FEMALE', 'Female'),
        ('OTHER', 'Other'),
    )
    
    FITNESS_GOAL_CHOICES = (
        ('WEIGHT_LOSS', 'Weight Loss'),
        ('MUSCLE_GAIN', 'Muscle Gain'),
        ('GENERAL_FITNESS', 'General Fitness'),
        ('ENDURANCE', 'Endurance'),
        ('FLEXIBILITY', 'Flexibility'),
    )
    
    TIME_PREFERENCE_CHOICES = (
        ('MORNING', 'Morning'),
        ('AFTERNOON', 'Afternoon'),
        ('EVENING', 'Evening'),
        ('NIGHT', 'Night'),
        ('ANYTIME', 'Anytime'),
    )
    DAY_PREFERENCE_CHOICES = (
        ('MON', 'Monday'),
        ('TUE', 'Tuesday'),
        ('WED', 'Wednesday'),
        ('THU', 'Thursday'),
        ('FRI', 'Friday'),
        ('SAT', 'Saturday'),
        ('SUN', 'Sunday'),
    )
    education = models.CharField(max_length=255, null=True, blank=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    dob = models.DateField(null=True, blank=True)
    married = models.BooleanField(default=False, null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)  # inches, optional
    weight = models.IntegerField(null=True, blank=True) #grams
    fitness_goal = models.CharField(max_length=20,null=True, blank=True, choices=FITNESS_GOAL_CHOICES)
    preferred_time = models.CharField(max_length=20, choices=TIME_PREFERENCE_CHOICES)
    preferred_days = models.CharField(max_length=50, choices=DAY_PREFERENCE_CHOICES)  # e.g. "Mon,Wed,Fri"
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    address = models.TextField(null=True, blank=True)
    profession = models.CharField(max_length=255, null=True, blank=True)
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    
    class Meta:
        db_table = 'user_profile'
    
    def __str__(self):
        return f"{self.user.username}'s Profile"

    @classmethod
    def get_or_create_for_user(cls, user):
        """Return existing profile for `user` or create a new one.

        Use this throughout the codebase to ensure a profile instance exists
        and to centralize creation logic.
        """
        profile, _ = cls.objects.get_or_create(user=user)
        return profile

    def update_from_dict(self, data, save=True):
        """Update fields from a dict containing allowed profile keys.

        This keeps update logic inside the model so it can be reused from
        management commands, REST views, or tests.
        """
        allowed = {
            'name', 'education', 'gender', 'dob', 'married', 'height', 'weight',
            'fitness_goal', 'preferred_time', 'preferred_days', 'address',
            'profession', 'profile_image',
        }

        changed = False
        for key, value in data.items():
            if key in allowed:
                setattr(self, key, value)
                changed = True

        if changed and save:
            self.save()

        return self
