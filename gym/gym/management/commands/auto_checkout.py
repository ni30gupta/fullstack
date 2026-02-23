"""
Management command for manual auto-checkout of expired gym activities.

This command can be run manually or via cron as a fallback to Celery Beat.
Usage: python manage.py auto_checkout [--slot-duration 60]
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta


class Command(BaseCommand):
    help = 'Auto-checkout gym members who have exceeded their slot duration. Usage: manage.py auto_checkout [--slot-duration 60]'

    def add_arguments(self, parser):
        parser.add_argument(
            '--slot-duration',
            type=int,
            default=60,
            help='Slot duration in minutes (default: 60)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be checked out without making changes'
        )

    def handle(self, *args, **options):
        from gym.models import GymActivity
        
        slot_duration = options['slot_duration']
        dry_run = options['dry_run']
        
        now = timezone.now()
        cutoff_time = now - timedelta(minutes=slot_duration)
        
        # Find expired activities
        expired_activities = GymActivity.objects.filter(
            ended_at__isnull=True,
            started_at__lte=cutoff_time
        ).select_related('user', 'gym', 'body_part')
        
        count = expired_activities.count()
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS(f'No expired activities found at {now}'))
            return
        
        self.stdout.write(f'Found {count} expired activities:')
        
        for activity in expired_activities:
            duration_mins = (now - activity.started_at).total_seconds() / 60
            self.stdout.write(
                f'  - ID {activity.id}: {activity.user.username} @ {activity.gym.name} '
                f'({activity.body_part.name}) - {duration_mins:.1f} mins'
            )
        
        if dry_run:
            self.stdout.write(self.style.WARNING(f'DRY RUN: Would checkout {count} activities'))
            return
        
        # Perform checkout
        expired_activities.update(ended_at=now)
        
        self.stdout.write(self.style.SUCCESS(f'Successfully checked out {count} activities at {now}'))
