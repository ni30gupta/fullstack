from django.contrib import admin
from .models import Gym, Membership, GymRushSnapshot, BodyPart, GymActivity


@admin.register(Gym)
class GymAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'gym_type', 'max_capacity', 'created_at')
    list_filter = ('gym_type',)
    search_fields = ('name', 'address')


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'gym', 'duration_months', 'start_date', 'end_date', 'is_active', 'created_at')
    list_filter = ('duration_months', 'is_active', 'created_at')
    search_fields = ('user__username', 'gym__name')
    date_hierarchy = 'created_at'


@admin.register(GymRushSnapshot)
class GymRushSnapshotAdmin(admin.ModelAdmin):
    list_display = ('gym', 'current_count', 'rush_percent', 'rush_level', 'captured_at')
    list_filter = ('rush_level', 'captured_at', 'gym')
    search_fields = ('gym__name',)
    date_hierarchy = 'captured_at'


@admin.register(BodyPart)
class BodyPartAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(GymActivity)
class GymActivityAdmin(admin.ModelAdmin):
    list_display = ('user', 'gym', 'body_part', 'started_at', 'ended_at', 'get_status')
    list_filter = ('body_part', 'gym', 'started_at')
    search_fields = ('user__username', 'gym__name', 'body_part__name')
    date_hierarchy = 'started_at'
    
    def get_status(self, obj):
        return "Active" if obj.ended_at is None else "Completed"
    get_status.short_description = 'Status'
