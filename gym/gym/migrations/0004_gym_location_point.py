"""
Replace separate latitude/longitude DecimalFields with a single PostGIS
PointField (geography=True, SRID 4326).

Steps:
  1. Enable the PostGIS extension on the database.
  2. Add the new `location` PointField (nullable).
  3. Data-migrate existing lat/lng rows into the Point.
  4. Drop the old `latitude` and `longitude` columns.
"""

import django.contrib.gis.db.models.fields
from django.db import migrations


def lat_lng_to_point(apps, schema_editor):
    """Populate `location` from existing latitude / longitude values."""
    from django.contrib.gis.geos import Point

    Gym = apps.get_model('gym', 'Gym')
    # Use a raw queryset that exposes the old columns (they still exist at this
    # point in the migration because RemoveField hasn't run yet).
    for gym in Gym.objects.exclude(latitude=None).exclude(longitude=None):
        try:
            gym.location = Point(float(gym.longitude), float(gym.latitude), srid=4326)
            gym.save(update_fields=['location'])
        except Exception:
            pass  # skip rows with bad data


class Migration(migrations.Migration):

    dependencies = [
        ('gym', '0003_gym_unique_owner_gym_name'),
    ]

    operations = [
        # 1. Enable PostGIS extension (idempotent)
        migrations.RunSQL(
            sql='CREATE EXTENSION IF NOT EXISTS postgis;',
            reverse_sql=migrations.RunSQL.noop,
        ),

        # 2. Add new PointField
        migrations.AddField(
            model_name='gym',
            name='location',
            field=django.contrib.gis.db.models.fields.PointField(
                blank=True,
                geography=True,
                null=True,
                srid=4326,
                help_text='Geographic point (longitude, latitude) in WGS84',
            ),
        ),

        # 3. Migrate existing data
        migrations.RunPython(lat_lng_to_point, migrations.RunPython.noop),

        # 4. Remove old scalar fields
        migrations.RemoveField(model_name='gym', name='latitude'),
        migrations.RemoveField(model_name='gym', name='longitude'),
    ]
