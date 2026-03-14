from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date

from gym.models import Gym, BodyPart, Membership, GymActivity, GymRushSnapshot

try:
    from dateutil.relativedelta import relativedelta
except Exception:
    relativedelta = None


import random
from datetime import timedelta, date

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

from gym.models import Gym, BodyPart, Membership, GymActivity, GymRushSnapshot, Member


class Command(BaseCommand):
    help = 'Seed the database with dummy gym data (for development only)'

    def add_arguments(self, parser):
        parser.add_argument('--users', type=int, default=100, help='Number of users to create')
        parser.add_argument('--gyms', type=int, default=5, help='Number of gyms to create')
        parser.add_argument('--members-per-gym', type=int, default=50, help='Members to create per gym')

    def handle(self, *args, **options):
        User = get_user_model()
        num_users = options['users']
        num_gyms = options['gyms']
        members_per_gym = options['members_per_gym']

        self.stdout.write('Seeding database...')

        # --- Users ---
        users = []

        first_names = [
            'Aarav', 'Vivaan', 'Aditya', 'Sai', 'Arjun', 'Ishaan', 'Kabir', 'Krishna',
            'Rohan', 'Ritvik', 'Anaya', 'Aanya', 'Diya', 'Isha', 'Kavya', 'Mira',
            'Priya', 'Saanvi', 'Tara', 'Yara', 'Aryan', 'Karan', 'Varun', 'Siddharth',
            'Manav', 'Nikhil', 'Sameer', 'Rahul', 'Vikram', 'Sanjay', 'Mohit', 'Dev',
            'Tejas', 'Arnav', 'Yuvraj', 'Hrithik', 'Om', 'Shlok', 'Pranav', 'Puneet',
            'Shreya', 'Nisha', 'Riya', 'Meera', 'Shruti', 'Anika', 'Kiara', 'Zara',
            'Laila', 'Suhana', 'Bhavya', 'Esha', 'Nandini', 'Gargi', 'Radhika', 'Sanya',
            'Pallavi', 'Ragini', 'Shraddha', 'Aditi', 'Ritu', 'Jyoti', 'Geeta', 'Leela',
            'Sonam', 'Vani', 'Amrita', 'Kiran', 'Priyanka', 'Monika', 'Kamal', 'Anil',
            'Arvind', 'Suresh', 'Tarun', 'Adarsh', 'Gaurav', 'Prakash', 'Balaji', 'Vikas',
            'Abhinav', 'Akash', 'Deepak', 'Zubin', 'Farhan', 'Salman', 'Imran', 'Faizal',
            'Yusuf', 'Mustafa', 'Anushka', 'Seema', 'Bindu', 'Hema', 'Smita', 'Pooja',
            'Sakshi', 'Trisha', 'Vedant', 'Anirudh','Raghav', 'Kushal', 'Naveen', 'Samar', 'Vishal', 'Ashish', 'Gautam', 'Rishi',
        ]
        last_names = [
            'Sharma', 'Verma', 'Patel', 'Singh', 'Gupta', 'Kumar', 'Reddy',
            'Nair', 'Chopra', 'Mehta', 'Malhotra', 'Jain', 'Kapoor', 'Joshi',
            'Bhatia', 'Saxena', 'Agarwal', 'Chatterjee', 'Mukherjee', 'Ghosh'
        ]

        for i in range(1, num_users + 1):
            first = first_names[i]
            last = random.choice(last_names)
            full_name = f"{first} {last}"
            base_username = f"{first.lower()}.{last.lower()}"
            username = base_username
            suffix = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{suffix}"
                suffix += 1

            email = f"{username}@example.com"
            phone = f"9{700000000 + i}"

            user, created = User.objects.get_or_create(
                username=username,
                defaults={'email': email}
            )
            if created:
                user.set_password('password')
                setattr(user, 'phone', phone)  # assumes custom User model has phone
                # also set profile name if profile exists
                try:
                    profile = user.profile
                    profile.name = full_name
                    profile.save()
                except Exception:
                    pass
                user.save()

            users.append(user)

        self.stdout.write(f'Created {len(users)} users')

        # --- Body Parts ---
        bp_names = ['CHEST', 'BACK', 'LEGS', 'SHOULDER', 'CARDIO', 'ARMS', 'BICEPS', 'TRICEPS', 'ABS', 'MIXED']
        body_parts = []
        for code in bp_names:
            bp, _ = BodyPart.objects.get_or_create(name=code)
            body_parts.append(bp)
        self.stdout.write(f'Created {len(body_parts)} body parts')

        # --- Gyms ---
        gyms = []
        gym_templates = [
            ('Iron Temple', '1 Fitness Avenue, Mumbai, Maharashtra'),
            ('FitHub Central', '22 Residency Road, Bengaluru, Karnataka'),
            ('PowerHouse Gym', '5 BKC Lane, Mumbai, Maharashtra'),
            ('Zen Fitness Studio', '34 MG Road, Pune, Maharashtra'),
            ('Urban Strength', '12 Brigade Road, Bengaluru, Karnataka'),
            ('Athlete Arena', '88 Jayanagar, Bengaluru, Karnataka'),
            ('Wellness Warriors', '9 Andheri East, Mumbai, Maharashtra'),
            ('Pulse Fitness', '27 Koramangala, Bengaluru, Karnataka'),
            ('Core Strength Club', '65 Viman Nagar, Pune, Maharashtra'),
            ('Momentum Gym', '18 Colaba Causeway, Mumbai, Maharashtra'),
        ]

        for i in range(num_gyms):
            name, address = gym_templates[i % len(gym_templates)]
            opening = '06:00'
            closing = '22:00'
            max_capacity = 80 + i * 15
            gym_type = random.choice(['General Fitness', 'CrossFit', 'Yoga', 'Strength', 'Functional'])
            owner = users[i % len(users)]

            gym, _ = Gym.objects.get_or_create(
                name=name,
                defaults={
                    'address': address,
                    'opening_time': opening,
                    'closing_time': closing,
                    'max_capacity': max_capacity,
                    'gym_type': gym_type,
                    'owner': owner,
                }
            )
            gyms.append(gym)

        self.stdout.write(f'Created {len(gyms)} gyms')

        # --- Members + Memberships ---
        memberships_created = 0
        members_created = 0
        for gym in gyms:
            for j in range(members_per_gym):
                user = random.choice(users)
                # Ensure unique member per user/gym
                member, m_created = Member.objects.get_or_create(
                    gym=gym,
                    user=user,
                    defaults={
                        'name': user.username,
                        'phone': getattr(user, 'phone', f'9{random.randint(100000000, 999999999)}'),
                        'email': getattr(user, 'email', ''),
                    }
                )
                if m_created:
                    members_created += 1

                # create between 1 and 3 membership records for the member
                for k in range(random.randint(1, 3)):
                    start = date.today() - timedelta(days=random.randint(0, 365))
                    duration = random.choice([1, 3, 6, 12])
                    end = start + timedelta(days=duration * 30)
                    is_active = end >= date.today()

                    Membership.objects.create(
                        member=member,
                        user=user,
                        gym=gym,
                        duration_months=duration,
                        start_date=start,
                        end_date=end,
                        is_active=is_active,
                        amount=random.choice([999, 1499, 1999, 2499]),
                    )
                    memberships_created += 1

        self.stdout.write(f'Created {members_created} members and {memberships_created} memberships')

        # --- Activities ---
        activities_created = 0
        for gym in gyms:
            members = Member.objects.filter(gym=gym)
            for member in random.sample(list(members), min(20, members.count())):
                for _ in range(random.randint(1, 5)):
                    GymActivity.objects.create(
                        gym=gym,
                        user=member.user,
                        body_part=random.choice(body_parts),
                    )
                    activities_created += 1

        self.stdout.write(f'Created {activities_created} gym activities')

        # --- Rush snapshots ---
        for gym in gyms:
            GymRushSnapshot.objects.create(
                gym=gym,
                current_count=random.randint(0, gym.max_capacity),
                rush_percent=random.uniform(0, 100),
                rush_level=random.choice(['LOW', 'MEDIUM', 'HIGH']),
                captured_at=timezone.now(),
            )

        self.stdout.write(self.style.SUCCESS('Seeding complete.'))
