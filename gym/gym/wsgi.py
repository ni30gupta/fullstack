"""
WSGI config for gym project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

# Forward to gym_service settings to preserve compatibility during rename.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gym_service.settings')

application = get_wsgi_application()
