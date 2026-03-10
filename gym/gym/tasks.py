"""Celery tasks for the gym app.

We'll add tasks here step by step.
"""
from celery import shared_task
from django.utils import timezone
from datetime import timedelta

from .models import GymActivity


@shared_task
def auto_logout(threshold_minutes: int = 1) -> int:
    """End any open GymActivity sessions that started before the threshold.

    Any activity with ``ended_at`` still ``NULL`` where the difference between
    the current time and ``started_at`` exceeds ``threshold_minutes`` will
    have ``ended_at`` set to now. The function returns the number of records
    updated, useful for logging or monitoring task effectiveness.

    This task can be scheduled via Celery Beat, e.g. every 15 minutes.
    """
    cutoff = timezone.now() - timedelta(minutes=threshold_minutes)
    # ``update`` is performed at the database level; it won't call model
    # ``save``/``checkout`` so we avoid signals. That's acceptable here since
    # we're only stamping an end time.
    print('task runnning for auto logout in a min')
    updated_count = GymActivity.objects.filter(
        ended_at__isnull=True,
        started_at__lt=cutoff,
    ).update(ended_at=timezone.now())
    return updated_count



