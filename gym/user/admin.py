from django.contrib import admin
from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'gender', 'dob', 'fitness_goal', 'preferred_time', 'created_at')
    list_filter = ('gender', 'fitness_goal', 'preferred_time', 'married')
    search_fields = ('user__username', 'user__email', 'name', 'profession')
    date_hierarchy = 'created_at'


