from rest_framework import serializers
from .models import Gym, Membership
from .models import GymActivity
from django.utils import timezone


class GymSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    # Expose lat/lng as plain floats — keeps the API contract unchanged while
    # the underlying storage is a PostGIS PointField.
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)

    class Meta:
        model = Gym
        fields = (
            'id', 'owner', 'owner_username', 'name', 'address', 'latitude', 'longitude',
            'opening_time', 'closing_time', 'max_capacity', 'gym_type', 'verified',
            'created_at', 'updated_at',
        )
        read_only_fields = ('owner', 'verified', 'created_at', 'updated_at')

    # --- read: extract x/y from Point ---
    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['latitude'] = float(instance.location.y) if instance.location else None
        rep['longitude'] = float(instance.location.x) if instance.location else None
        return rep

    # --- write: pack lat/lng into a Point before hitting the DB ---
    def validate(self, data):
        from django.contrib.gis.geos import Point
        lat = data.pop('latitude', None)
        lng = data.pop('longitude', None)
        if lat is not None and lng is not None:
            data['location'] = Point(float(lng), float(lat), srid=4326)
        elif lat is not None or lng is not None:
            raise serializers.ValidationError(
                'Both latitude and longitude must be supplied together.'
            )
        return data

    def validate_max_capacity(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError('max_capacity must be non-negative')
        return value


class MembershipSerializer(serializers.ModelSerializer):
    """Serializer for gym membership/member management."""
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    gym_name = serializers.CharField(source='gym.name', read_only=True)

    class Meta:
        model = Membership
        fields = (
            'id', 'user', 'user_username', 'user_email', 'gym', 'gym_name',
            'duration_months', 'start_date', 'end_date', 'is_active',
            'created_at',
        )
        read_only_fields = ('gym', 'start_date', 'end_date', 'created_at')


class SubscribeSerializer(serializers.Serializer):
    """Serializer for requesting subscription to a gym."""
    duration_months = serializers.IntegerField(
        min_value=1,
        max_value=24,
        help_text='Subscription duration in months (1-24)'
    )


class ActivateMemberSerializer(serializers.Serializer):
    """Serializer for activating/deactivating a member."""
    is_active = serializers.BooleanField(help_text='Set to true to activate the member')


class CheckInSerializer(serializers.Serializer):
    body_parts = serializers.ListField(
        child=serializers.CharField(),
        allow_empty=False,
        help_text='List of BodyPart.name codes (e.g. CHEST, BACK)'
    )

    def validate_body_parts(self, value):
        from .models import BodyPart

        missing = []
        valid = []
        for code in value:
            try:
                bp = BodyPart.objects.get(name=code)
                valid.append(bp)
            except BodyPart.DoesNotExist:
                missing.append(code)

        if missing:
            raise serializers.ValidationError(f'Unknown body parts: {",".join(missing)}')

        # Replace list of codes with actual BodyPart instances for the view
        return valid


class GymLoadSerializer(serializers.Serializer):
    gym_id = serializers.IntegerField()
    capacity = serializers.IntegerField()
    currently_in = serializers.IntegerField()
    available = serializers.IntegerField()
    body_part_breakdown = serializers.DictField(child=serializers.IntegerField())


class CurrentActivitySerializer(serializers.Serializer):
    gym_id = serializers.IntegerField()
    gym_name = serializers.CharField()
    started_at = serializers.DateTimeField()
    body_parts = serializers.ListField(child=serializers.CharField())
    activity_ids = serializers.ListField(child=serializers.IntegerField())


class ActivityHistorySerializer(serializers.Serializer):
    """Serializer for returning a user's past gym activity entries.

    Each record corresponds to a single GymActivity row. The response is
    ordered from newest to oldest by ``started_at``.

    Fields match the frontend requirements: date, body_part, started_at,
    ended_at and total_time (in seconds).
    """
    date = serializers.DateField()
    body_part = serializers.CharField()
    started_at = serializers.DateTimeField()
    ended_at = serializers.DateTimeField(allow_null=True)
    total_time = serializers.IntegerField(allow_null=True)
