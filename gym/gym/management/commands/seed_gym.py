from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date

from gym.models import Gym, BodyPart, Membership, GymActivity, GymRushSnapshot

try:
    from dateutil.relativedelta import relativedelta
except Exception:
    relativedelta = None


class Command(BaseCommand):
    help = 'Seed the database with dummy gym data (for development only)'

    def handle(self, *args, **options):
        User = get_user_model()

        self.stdout.write('Seeding database...')

        # --- Users ---
        # NOTE: do NOT create a superadmin here; assume one already exists in development.
        # Create non-privileged demo users with Indian names.
        anita, _ = User.objects.get_or_create(username='anita', defaults={'email': 'anita.kumar@example.in'})
        anita.set_password('anitapass')
        anita.save()

        rahul, _ = User.objects.get_or_create(username='rahul', defaults={'email': 'rahul.singh@example.in'})
        rahul.set_password('rahulpass')
        rahul.save()

        ravi, _ = User.objects.get_or_create(username='ravi', defaults={'email': 'ravi.patel@example.in'})
        ravi.set_password('ravipass')
        ravi.save()

        sneha, _ = User.objects.get_or_create(username='sneha', defaults={'email': 'sneha.verma@example.in'})
        sneha.set_password('snehapass')
        sneha.save()

        self.stdout.write('Created users: anita, rahul, ravi, sneha')

        # --- BodyParts ---
        bp_names = ['CHEST', 'BACK', 'LEGS', 'SHOULDER', 'CARDIO', 'ARMS', 'BICEPS', 'TRICEPS', 'ABS', 'MIXED']
        body_parts = []
        for code in bp_names:
            bp, _ = BodyPart.objects.get_or_create(name=code)
            body_parts.append(bp)
        self.stdout.write(f'Created {len(body_parts)} body parts')

        # --- Gyms ---
        gym1, _ = Gym.objects.get_or_create(
            name='Mumbai Fitness Center',
            defaults={
                'address': '123 MG Road, Mumbai, Maharashtra',
                'opening_time': '06:00',
                'closing_time': '22:00',
                'max_capacity': 120,
                'gym_type': 'General Fitness',
                'owner': anita,
            }
        )

        gym2, _ = Gym.objects.get_or_create(
            name='Bengaluru CrossFit',
            defaults={
                'address': '456 Indiranagar, Bengaluru, Karnataka',
                'opening_time': '05:30',
                'closing_time': '21:30',
                'max_capacity': 60,
                'gym_type': 'CrossFit',
                'owner': None,
            }
        )

        self.stdout.write('Created gyms: Mumbai Fitness Center, Bengaluru CrossFit')

        # Make `ravi` the owner of gym2 (demo)
        gym2.owner = ravi
        gym2.save()
        self.stdout.write('Assigned ravi as owner of Bengaluru CrossFit')

        # --- Memberships ---
        # rahul requests subscription to gym1 (inactive)
        m1, created = Membership.objects.get_or_create(
            user=rahul,
            gym=gym1,
            defaults={
                'duration_months': 3,
                'is_active': False,
            }
        )

        # ravi (owner of gym2) gets an active membership at gym2
        m3, _ = Membership.objects.get_or_create(
            user=ravi,
            gym=gym2,
            defaults={
                'duration_months': 6,
                'is_active': False,
            }
        )
        if hasattr(m3, 'activate') and relativedelta is not None:
            m3.activate()
        else:
            m3.is_active = True
            m3.start_date = date.today()
            m3.end_date = m3.start_date
            m3.save()

        # sneha requests subscription to gym1 (inactive)
        m4, _ = Membership.objects.get_or_create(
            user=sneha,
            gym=gym1,
            defaults={
                'duration_months': 1,
                'is_active': False,
            }
        )

        # anita (owner) has an active membership at gym1 (activate manually)
        m2, _ = Membership.objects.get_or_create(
            user=anita,
            gym=gym1,
            defaults={
                'duration_months': 12,
                'is_active': False,
            }
        )

        # activate anita's membership now
        if hasattr(m2, 'activate') and relativedelta is not None:
            m2.activate()
        else:
            m2.is_active = True
            m2.start_date = date.today()
            m2.end_date = m2.start_date
            m2.save()

        self.stdout.write('Created sample memberships (one pending, one active)')

        # --- GymActivity (checkin simulation) ---
        # Create some activities for anita at gym1
        GymActivity.objects.create(gym=gym1, user=anita, body_part=body_parts[0])  # CHEST
        GymActivity.objects.create(gym=gym1, user=anita, body_part=body_parts[2])  # LEGS

        self.stdout.write('Created sample activities for anita at Mumbai Fitness Center')

        # --- GymRushSnapshot ---
        snap, _ = GymRushSnapshot.objects.get_or_create(
            gym=gym1,
            captured_at=timezone.now().replace(microsecond=0),
            defaults={
                'current_count': 12,
                'rush_percent': 12.0,
                'rush_level': 'LOW',
            }
        )

        self.stdout.write('Created one rush snapshot for Mumbai Fitness Center')

        self.stdout.write(self.style.SUCCESS('Seeding complete.'))
