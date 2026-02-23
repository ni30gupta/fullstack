import json
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

try:
    from rest_framework_simplejwt.tokens import RefreshToken
except Exception:
    RefreshToken = None


class Command(BaseCommand):
    help = 'Generate JWT access and refresh tokens for a user. Usage: manage.py gen_tokens --token <username>'

    def add_arguments(self, parser):
        parser.add_argument('--token', dest='username', required=True, help='Username to generate tokens for')

    def handle(self, *args, **options):
        username = options.get('username')
        User = get_user_model()

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stderr.write(f'User "{username}" not found.')
            return

        if RefreshToken is None:
            self.stderr.write('rest_framework_simplejwt is not installed or import failed.')
            return

        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)
        refresh_token = str(refresh)

        out = {
            'username': username,
            'access': access,
            'refresh': refresh_token,
        }

        self.stdout.write(json.dumps(out))
