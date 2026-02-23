"""Celery configuration for gym_service project."""

import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gym_service.settings')

app = Celery('gym_service')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
