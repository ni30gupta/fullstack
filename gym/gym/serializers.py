from rest_framework import serializers
from .models import Gym, Membership, Member
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


class MemberSerializer(serializers.ModelSerializer):
    """Serializer for gym members."""
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True, allow_null=True)
    gym_name = serializers.CharField(source='gym.name', read_only=True)
    has_active_membership = serializers.SerializerMethodField()
    latest_membership = serializers.SerializerMethodField()

    class Meta:
        model = Member
        fields = (
            'id', 'gym', 'gym_name', 'user', 'user_username', 'user_email',
            'name', 'phone', 'email', 'has_active_membership', 'latest_membership',
            'created_at', 'updated_at',
        )
        read_only_fields = ('gym', 'user', 'created_at', 'updated_at')

    def get_has_active_membership(self, obj):
        return any(m.is_active for m in obj.memberships.all())

    def get_latest_membership(self, obj):
        memberships = list(obj.memberships.all())
        if not memberships:
            return None
        active = [m for m in memberships if m.is_active]
        ms = active[0] if active else sorted(memberships, key=lambda m: m.created_at, reverse=True)[0]
        return {
            'id': ms.id,
            'duration_months': ms.duration_months,
            'start_date': ms.start_date.isoformat() if ms.start_date else None,
            'end_date': ms.end_date.isoformat() if ms.end_date else None,
            'amount': str(ms.amount) if ms.amount is not None else None,
            'amount_paid': str(ms.amount_paid) if ms.amount_paid is not None else None,
            'is_active': ms.is_active,
        }


class MemberCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new members (by gym owner)."""
    
    class Meta:
        model = Member
        fields = ('name', 'phone', 'email')

    def validate_phone(self, value):
        """Validate phone is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError('Phone number is required.')
        return value.strip()


class MembershipSerializer(serializers.ModelSerializer):
    """Serializer for gym membership/member management."""
    # New member-based fields
    member_id = serializers.IntegerField(source='member.id', read_only=True, allow_null=True)
    member_name = serializers.CharField(source='member.name', read_only=True, allow_null=True)
    member_phone = serializers.CharField(source='member.phone', read_only=True, allow_null=True)
    
    # Legacy user-based fields (for backward compatibility)
    user_username = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    gym_name = serializers.SerializerMethodField()

    class Meta:
        model = Membership
        fields = (
            'id', 'member', 'member_id', 'member_name', 'member_phone',
            'user', 'user_username', 'user_email', 'gym', 'gym_name',
            'duration_months', 'start_date', 'end_date', 'is_active',
            'amount', 'amount_paid', 'created_at',
        )
        read_only_fields = ('gym', 'created_at', 'member')

    def get_user_username(self, obj):
        """Get username - prefer member.user, fallback to direct user."""
        user = obj.effective_user
        return user.username if user else None

    def get_user_email(self, obj):
        """Get email - prefer member.user, fallback to direct user."""
        user = obj.effective_user
        return user.email if user else None

    def get_gym_name(self, obj):
        """Get gym name - prefer member.gym, fallback to direct gym."""
        gym = obj.effective_gym
        return gym.name if gym else None


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


class EnrollMemberSerializer(serializers.Serializer):
    """Serializer for enrolling a new member with an immediate membership."""
    name = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
    duration_months = serializers.IntegerField(min_value=1, max_value=24)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    amount_paid = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    start_date = serializers.DateField(required=False, allow_null=True)
    is_active = serializers.BooleanField(default=True)

    def validate_phone(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Phone number is required.')
        return value.strip()


class UpdateMemberSerializer(serializers.Serializer):
    """Serializer for updating member details."""
    name = serializers.CharField(max_length=255, required=False)
    phone = serializers.CharField(max_length=20, required=False)
    email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)


class MembershipCreateForMemberSerializer(serializers.Serializer):
    """Serializer for adding a new membership period to an existing member."""
    duration_months = serializers.IntegerField(min_value=1, max_value=24)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    amount_paid = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    start_date = serializers.DateField(required=False, allow_null=True)
    is_active = serializers.BooleanField(default=True)


class MembershipUpdateSerializer(serializers.Serializer):
    """Serializer for updating membership details."""
    duration_months = serializers.IntegerField(min_value=1, max_value=24, required=False)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    amount_paid = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    start_date = serializers.DateField(required=False, allow_null=True)
    is_active = serializers.BooleanField(required=False)
