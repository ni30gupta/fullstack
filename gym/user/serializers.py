from django.contrib.auth.models import User
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)
    gym_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        # only mobile username + passwords; extras like name/email are not collected here
        fields = ('username', 'password', 'password2', 'gym_name')
        extra_kwargs = {
            # no additional required fields
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    def create(self, validated_data):
        # gym_name is not stored on User; it may be used by view logic if needed
        validated_data.pop('gym_name', None)
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class RegisterGymSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    gym_name = serializers.CharField(required=True)
    gym_address = serializers.CharField(required=True)
    gym_type = serializers.CharField(required=True)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('password2'):
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def validate_username(self, value):
        # ensure username is unique before attempting DB insert
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("User with this username already exists.")
        return value

    def create(self, validated_data):
        # remove user-related fields so we can create gym separately
        password = validated_data.pop('password')
        validated_data.pop('password2')
        gym_name = validated_data.pop('gym_name')
        gym_address = validated_data.pop('gym_address')
        gym_type = validated_data.pop('gym_type')
        latitude = validated_data.pop('latitude', None)
        longitude = validated_data.pop('longitude', None)

        # create user with remaining data (username only)
        from django.db import IntegrityError
        try:
            user = User.objects.create_user(username=validated_data['username'], password=password)
        except IntegrityError:
            # this should rarely happen due to prior validation, but guard anyway
            raise serializers.ValidationError({
                'username': 'User with this username already exists.'
            })

        # create gym with defaults for required fields
        from gym.models import Gym
        from datetime import time

        gym = Gym.objects.create(
            owner=user,
            name=gym_name,
            address=gym_address,
            gym_type=gym_type,
            latitude=latitude,
            longitude=longitude,
            opening_time=time(6, 0),
            closing_time=time(22, 0),
            max_capacity=100,
            verified=False,
        )

        # return both, view will handle tokens/response
        return {'user': user, 'gym': gym}


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')


from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    # we override preferred_days to avoid DRF's choices validation
    # since the field stores a comma-separated string of codes
    preferred_days = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = UserProfile
        fields = (
            'name', 'education', 'gender', 'dob', 'married', 'height', 'weight',
            'fitness_goal', 'preferred_time', 'preferred_days', 'address',
            'profession', 'profile_image',
        )
        extra_kwargs = {
            'dob': {'required': False, 'allow_null': True},
            'education': {'required': False, 'allow_blank': True},
            'address': {'required': False, 'allow_blank': True},
            'profession': {'required': False, 'allow_blank': True},
            'name': {'required': False, 'allow_blank': True},
        }

    def validate_preferred_days(self, value):
        # allow comma-separated codes; ensure each code is a valid day
        if value:
            valid_codes = {choice[0] for choice in UserProfile.DAY_PREFERENCE_CHOICES}
            for day in value.split(','):
                if day and day not in valid_codes:
                    raise serializers.ValidationError(f"{day} is not a valid choice.")
        return value

    def update(self, instance, validated_data):
        instance.update_from_dict(validated_data, save=True)
        return instance


class AvatarUploadSerializer(serializers.ModelSerializer):
    """Handles only the profile_image field for upload/replace operations."""
    class Meta:
        model = UserProfile
        fields = ('profile_image',)
