from django.contrib.auth import authenticate
from rest_framework import status, generics, permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, UserProfileSerializer
from gym.serializers import GymSerializer
from .models import UserProfile
from gym.models import Membership, Gym


class IsOwnerOrAdmin(permissions.BasePermission):
    """Object-level permission to only allow owners of an object or admins to edit it."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Staff users can do anything; owners can operate on their profile
        return request.user.is_staff or getattr(obj, 'user', None) == request.user


def get_tokens_for_user(user):
    """Generate JWT tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': tokens,
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        
        user = authenticate(username=username, password=password)
        
        if user is not None:
            tokens = get_tokens_for_user(user)
            # If the user is a gym owner, return gym details instead of membership info
            try:
                gym = Gym.objects.get(owner=user)
            except Gym.DoesNotExist:
                gym = None

            if gym is not None:
                gym_data = GymSerializer(gym).data
                return Response({
                    'user': UserSerializer(user).data,
                    'tokens': tokens,
                    'gym_details': gym_data,
                    'message': 'Login successful (owner)'
                }, status=status.HTTP_200_OK)

            # include only the active membership (user can be active in at most one gym)
            active_obj = Membership.objects.filter(user=user, is_active=True).select_related('gym').order_by('-created_at').first()
            if active_obj:
                active = {
                    'gym_id': active_obj.gym.id,
                    'gym_name': active_obj.gym.name,
                    'is_active': active_obj.is_active,
                    'start_date': active_obj.start_date.isoformat() if active_obj.start_date else None,
                    'end_date': active_obj.end_date.isoformat() if active_obj.end_date else None,
                }
            else:
                active = None

            return Response({
                'user': UserSerializer(user).data,
                'tokens': tokens,
                'active_membership': active,
                'message': 'Login successful'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        try:
            request.user.auth_token.delete()
            return Response({
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class UserProfileViewSet(viewsets.ModelViewSet):
    """ModelViewSet for `UserProfile` with owner/admin object permissions.

    - Admins can list/retrieve/update/delete any profile.
    - Regular users can retrieve/update/delete only their own profile.
    - A helper action `me` is provided at `/profiles/me/` for convenience.
    """
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = (IsOwnerOrAdmin,)

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            qs = super().get_queryset()
            # allow simple filtering via query params (e.g., ?user_id=)
            user_id = self.request.query_params.get('user_id')
            if user_id:
                qs = qs.filter(user_id=user_id)
            return qs
        # regular users only see their own profile in list views
        return self.queryset.filter(user=user)

    def perform_create(self, serializer):
        # ensure profile is associated with the requesting user
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get', 'patch', 'put'], url_path='me')
    def me(self, request):
        profile = UserProfile.get_or_create_for_user(request.user)
        if request.method == 'GET':
            serializer = self.get_serializer(profile)
            return Response(serializer.data)

        # PATCH/PUT: partial update allowed
        partial = request.method == 'PATCH'
        serializer = self.get_serializer(profile, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
