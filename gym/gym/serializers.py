from rest_framework import serializers
from .models import Gym, Membership
from .models import GymActivity
from django.utils import timezone


class GymSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)

    class Meta:
        model = Gym
        fields = (
            'id', 'owner', 'owner_username', 'name', 'address', 'latitude', 'longitude',
            'opening_time', 'closing_time', 'max_capacity', 'gym_type', 'verified',
            'created_at', 'updated_at',
        )
        read_only_fields = ('owner', 'verified', 'created_at', 'updated_at')

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
