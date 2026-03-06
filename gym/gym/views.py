from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from django.db import models
from collections import defaultdict
from django.db.models import Q
import logging

# module logger
logger = logging.getLogger(__name__)

from .models import Gym, Membership, GymActivity, BodyPart
from .serializers import GymSerializer, MembershipSerializer, SubscribeSerializer, ActivateMemberSerializer
from .serializers import CheckInSerializer, GymLoadSerializer
from .serializers import CurrentActivitySerializer
from .utils import has_active_membership_or_owner_or_staff
from django.utils import timezone
from datetime import timedelta, datetime
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

User = get_user_model()


class IsOwnerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        # Allow read-only for unauthenticated users; writes require auth
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        # owners or staff can modify
        return request.user.is_staff or getattr(obj, 'owner', None) == request.user


class GymViewSet(viewsets.ModelViewSet):
    queryset = Gym.objects.all().order_by('-created_at')
    serializer_class = GymSerializer
    permission_classes = (IsOwnerOrAdmin,)

    def perform_create(self, serializer):
        # set the requesting user as owner
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        # prevent non-staff from toggling `verified`
        if not self.request.user.is_staff:
            # ensure `verified` stays unchanged by excluding it from save
            validated = dict(serializer.validated_data)
            validated.pop('verified', None)
            serializer.save(**validated)
            return
        serializer.save()

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny], url_path='search')
    def search(self, request):
        """Search gyms by name. Query param `q` is used for case-insensitive partial match.

        Returns a small list of gyms (id, name, address, owner_username) for dropdowns.
        Minimum query length is 2 characters and results capped at 5 items.
        Example: GET /api/gyms/search/?q=fit
        """
        q = request.query_params.get('q', '').strip()
        if len(q) < 2:
            return Response([], status=status.HTTP_200_OK)

        qs = self.queryset.filter(name__icontains=q)[:5]
        data = []
        for g in qs:
            data.append({
                'id': g.id,
                'name': g.name,
                'address': g.address,
                'owner_username': g.owner.username if g.owner else None,
            })
        return Response(data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def register(self, request, pk=None):
        """Alias action: owner claims/registers the gym (set owner to requester).

        Example: POST /api/gyms/{pk}/register/ will set the authenticated user
        as the owner if the gym currently has no owner.
        """
        gym = self.get_object()
        if gym.owner is not None and gym.owner != request.user and not request.user.is_staff:
            return Response({'detail': 'Gym already has an owner.'}, status=status.HTTP_400_BAD_REQUEST)
        gym.owner = request.user
        gym.save()
        return Response(self.get_serializer(gym).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def checkin(self, request, pk=None):
        """Check a user into a gym and create GymActivity rows for each body part.

        Request body: {"body_parts": ["CHEST", "TRICEPS"]}

        Creates one GymActivity row per body part with started_at = now.
        Returns the computed slot and list of created activities.
        """
        gym = self.get_object()
       
        # Membership check: ensure user has active membership or is owner/staff
        if not has_active_membership_or_owner_or_staff(request.user, gym):
            return Response({'detail': 'Active membership required to check in.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = CheckInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        body_parts = serializer.validated_data['body_parts']  # list of BodyPart instances

        # Check for duplicate: user already has active activity for these body parts in current/last slot
        # determine current and previous slot windows for conflict detection
        from .utils import parse_slot_param
        now = timezone.localtime(timezone.now())
        today = now.date()
        current_slot_start, current_slot_end = parse_slot_param(today, 'current')
        # previous slot is one hour before current start
        prev_slot_start = current_slot_start - timedelta(hours=1)

        # Look for active activities started in current or previous slot window
        active_conflicts = GymActivity.objects.filter(
            user=request.user,
            gym=gym,
            # body_part__in=body_parts,
            ended_at__isnull=True,  # still active
        ).select_related('body_part')

        if active_conflicts.exists():
            conflict_parts = list(active_conflicts.values_list('body_part__name', flat=True))
            return Response({
                'detail': 'You already have an active workout for these body parts.',
                'conflicting_body_parts': conflict_parts
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create GymActivity for each body part
        activities = []
        for bp in body_parts:
            activity = GymActivity.objects.create(user=request.user, gym=gym, body_part=bp)
            activities.append(activity)

        # Compute slot from first activity
        # compute slot using current local time
        now = timezone.localtime(timezone.now())
        # slot string no longer returned; frontend can compute if needed
        # slot_start, slot_end = GymActivity.compute_slot(now)
        # slot_str = f"{slot_start.strftime('%H:%M')} - {slot_end.strftime('%H:%M')}"

        data = {
            'gym_id': gym.id,
            'gym_name': gym.name,
            # send ISO formatted with timezone offset so frontend sees local time
            'started_at': now.isoformat(),
            'body_parts': [bp.name for bp in body_parts],
            'activity_ids': [a.id for a in activities],
        }

        return Response(data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def verify(self, request, pk=None):
        """Admin endpoint to set the `verified` status of a gym.

        POST body must include: {"verified": true|false}.
        """
        gym = self.get_object()
        if 'verified' not in request.data:
            return Response({'error': 'Field "verified" is required.'}, status=status.HTTP_400_BAD_REQUEST)

        gym.verified = bool(request.data.get('verified'))
        gym.save()
        return Response(True)

    # ==================== Member Management Endpoints ====================

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated], url_path='members-list')
    def members(self, request, pk=None):
        """List all members of a gym. Only gym owner or staff can view."""
        gym = self.get_object()
        if not (request.user.is_staff or gym.owner == request.user):
            return Response({'detail': 'You do not have permission to view members.'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        memberships = Membership.objects.filter(gym=gym).select_related('user').order_by('-created_at')
        
        # Optional filter by is_active status
        is_active_filter = request.query_params.get('is_active')
        if is_active_filter is not None:
            memberships = memberships.filter(is_active=is_active_filter.lower() == 'true')
        
        serializer = MembershipSerializer(memberships, many=True)
        return Response(serializer.data)

   
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def subscribe(self, request, pk=None):
        """Request to subscribe/join a gym. Any authenticated user can request.
        
        The membership will have is_active=False initially and must be activated by the gym owner.
        Start and end dates are set automatically when the gym owner activates the membership.
        
        Request body:
        {
            "duration_months": 3  // 1, 3, 6, 12 or custom (1-24)
        }
        """
        gym = self.get_object()
        user = request.user
        
        serializer = SubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check if membership already exists for this user and gym
        existing = Membership.objects.filter(user=user, gym=gym).first()
        if existing:
            return Response({'detail': 'You already have a membership request for this gym.'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        membership = Membership.objects.create(
            user=user,
            gym=gym,
            duration_months=serializer.validated_data['duration_months'],
            is_active=False  # Initially inactive until gym owner activates
        )
        
        return Response(MembershipSerializer(membership).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated], 
            url_path='activate-member/(?P<membership_id>[^/.]+)')
    def activate_member(self, request, pk=None, membership_id=None):
        """Activate a member's membership. Only gym owner or staff can do this.
        
        When activated, start_date is set to today and end_date is calculated based on duration_months.
        
        POST /api/gyms/{gym_id}/activate-member/{membership_id}/
        
        Request body:
        {
            "is_active": true  // true to activate, false to deactivate
        }
        """
        gym = self.get_object()
        if not (request.user.is_staff or gym.owner == request.user):
            return Response({'detail': 'You do not have permission to activate members.'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        try:
            membership = Membership.objects.get(id=membership_id, gym=gym)
        except Membership.DoesNotExist:
            return Response({'detail': 'Membership not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = ActivateMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        if serializer.validated_data['is_active']:
            # Use model's activate method to set dates
            membership.activate()
        else:
            membership.is_active = False
            membership.save()
        
        return Response(MembershipSerializer(membership).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated],
            url_path='activate-members')
    def activate_members(self, request, pk=None):
        """Activate multiple members by username. Only gym owner or staff can call.

        Request body: {"usernames": ["rahul", "sneha"]}
        """
        gym = self.get_object()
        if not (request.user.is_staff or gym.owner == request.user):
            return Response({'detail': 'You do not have permission to activate members.'},
                            status=status.HTTP_403_FORBIDDEN)

        usernames = request.data.get('usernames')
        if not isinstance(usernames, list) or not usernames:
            return Response({'detail': 'Field "usernames" must be a non-empty list.'}, status=status.HTTP_400_BAD_REQUEST)

        results = []
        for uname in usernames:
            try:
                user = User.objects.get(username=uname)
            except User.DoesNotExist:
                results.append({'username': uname, 'status': 'user_not_found'})
                continue

            try:
                membership = Membership.objects.get(user=user, gym=gym)
            except Membership.DoesNotExist:
                results.append({'username': uname, 'status': 'membership_not_found'})
                continue

            if membership.is_active:
                results.append({'username': uname, 'status': 'already_active', 'membership_id': membership.id})
                continue

            # activate membership (sets dates)
            membership.activate()
            results.append({
                'username': uname,
                'status': 'activated',
                'membership_id': membership.id,
                'start_date': str(membership.start_date),
                'end_date': str(membership.end_date),
            })

        return Response({'results': results})

    @action(detail=True, methods=['delete'], permission_classes=[permissions.IsAuthenticated],
            url_path='remove-member/(?P<membership_id>[^/.]+)')
    def remove_member(self, request, pk=None, membership_id=None):
        """Remove a member from the gym (deactivate membership). Only gym owner or staff can remove.
        
        DELETE /api/gyms/{gym_id}/remove-member/{membership_id}/
        """
        gym = self.get_object()
        if not (request.user.is_staff or gym.owner == request.user):
            return Response({'detail': 'You do not have permission to remove members.'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        try:
            membership = Membership.objects.get(id=membership_id, gym=gym)
        except Membership.DoesNotExist:
            return Response({'detail': 'Membership not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        membership.is_active = False
        membership.save()
        
        return Response({'detail': 'Member removed successfully.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated],
            url_path='rush-data')
    def rush_data(self, request, pk=None):
        """Get gym rush data for a specific date and slot.

        GET /api/gyms/{id}/rush-data/?date=2026-02-26&slot=current

        slot: current, next, next_to_next

        Returns:
        {
            "date": "2026-02-26",
            "time_slot": [
                {
                    "start": "13:30",
                    "end": "14:30",
                    "body_part_breakdown": {
                        "BACK": 1,
                        "LEGS": 1
                    },
                    "change": {
                        "LEGS": 0,
                        "BACK": 0
                    }
                }
            ]
        }
        """
        from collections import defaultdict
        from datetime import datetime, timedelta
        from django.utils import timezone
        logger.debug('rush_data called for gym %s', pk)
        gym = self.get_object()

        # Owner/staff only
        # if not (request.user.is_staff or gym.owner == request.user):
        #     return Response({'detail': 'You do not have permission to view rush data.'},
        #                     status=status.HTTP_403_FORBIDDEN)

        date_str = request.query_params.get('date')
        if not date_str:
            return Response({'detail': 'Query parameter "date" is required (YYYY-MM-DD).'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'detail': 'Invalid date format. Use YYYY-MM-DD.'},
                            status=status.HTTP_400_BAD_REQUEST)

        slot_param = request.query_params.get('slot')
        if slot_param not in ['current', 'next', 'next_to_next']:
            return Response({'detail': 'Query parameter "slot" must be one of: current, next, next_to_next.'},
                            status=status.HTTP_400_BAD_REQUEST)

        from .utils import parse_slot_param
        slot_start_utc, slot_end_utc = parse_slot_param(target_date, slot_param)
        print('##### slot_start_utc, slot_end_utc', slot_start_utc, slot_end_utc)
        if not slot_start_utc or not slot_end_utc:
            return Response({'detail': 'Invalid slot parameter.'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Current slot activities
        activities = GymActivity.objects.filter(
            gym=gym,
            started_at__gte=slot_start_utc,
            started_at__lt=slot_end_utc
        ).filter(
            Q(ended_at__isnull=True) | Q(ended_at__gte=slot_end_utc)
        ).select_related('body_part')
        
        print("##### activities count", activities.count())
        
        current_counts = defaultdict(int)
        for act in activities:
            body_part_name = act.body_part.name if act.body_part else 'UNKNOWN'
            current_counts[body_part_name] += 1

        # Previous slot for computing "change".  We want the slot immediately
        # before the one being requested, not an arbitrary 30‑minute window.
        #
        #   current        -> compare against the hour immediately before
        #   next           -> compare against the current slot
        #   next_to_next   -> compare against the next slot
        if slot_param == 'current':
            prev_slot_start_utc = slot_start_utc - timedelta(hours=1)
            prev_slot_end_utc = slot_start_utc
        elif slot_param == 'next':
            prev_slot_start_utc, prev_slot_end_utc = parse_slot_param(target_date, 'current')
        else:  # next_to_next
            prev_slot_start_utc, prev_slot_end_utc = parse_slot_param(target_date, 'next')

        prev_activities = GymActivity.objects.filter(
            gym=gym,
            started_at__gte=prev_slot_start_utc,
            started_at__lt=prev_slot_end_utc
        ).filter(
            Q(ended_at__isnull=True) | Q(ended_at__gte=prev_slot_end_utc)
        ).select_related('body_part')

        prev_counts = defaultdict(int)
        for act in prev_activities:
            body_part_name = act.body_part.name if act.body_part else 'UNKNOWN'
            prev_counts[body_part_name] += 1

        # Ensure we always include all known body parts in the response,
        # even if their count is zero for the requested slot.
        all_body_parts = BodyPart.objects.all()
        # Build full mappings that include zero-count parts
        full_current = {bp.name: current_counts.get(bp.name, 0) for bp in all_body_parts}
        full_prev = {bp.name: prev_counts.get(bp.name, 0) for bp in all_body_parts}

        from .utils import diff_body_part_counts
        change = diff_body_part_counts(full_current, full_prev)

        # Format start/end in local time
        slot_start_local = slot_start_utc.astimezone(timezone.get_current_timezone())
        slot_end_local = slot_end_utc.astimezone(timezone.get_current_timezone())
        start_str = slot_start_local.strftime('%H:%M')
        end_str = slot_end_local.strftime('%H:%M')

        # Sort body parts by descending count (include zero-count parts)
        sorted_breakdown = dict(sorted(full_current.items(), key=lambda x: x[1], reverse=True))

        time_slot = [{
            'start': start_str,
            'end': end_str,
            'body_part_breakdown': sorted_breakdown,
            'change': change
        }]

        return Response({
            'date': date_str,
            'time_slot': time_slot
        })

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated], url_path='active-activities')
    def active_activities(self, request, pk=None):
        """Return a list of currently active activities for a given body part.

        Primarily for gym owners; accepts ``date``, ``slot`` and optional
        ``body_part`` query parameters.  See implementation in comments.
        """
        from django.utils import timezone
        from datetime import datetime, timedelta

        gym = self.get_object()

        # only owner or staff allowed
        if not (request.user.is_staff or gym.owner == request.user):
            return Response({'detail': 'You do not have permission to view this data.'},
                            status=status.HTTP_403_FORBIDDEN)

        date_str = request.query_params.get('date')
        if not date_str:
            return Response({'detail': 'Query parameter "date" is required (YYYY-MM-DD).'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'detail': 'Invalid date format. Use YYYY-MM-DD.'},
                            status=status.HTTP_400_BAD_REQUEST)

        slot_param = request.query_params.get('slot')
        if slot_param not in ['current', 'next', 'next_to_next']:
            return Response({'detail': 'Query parameter "slot" must be one of: current, next, next_to_next.'},
                            status=status.HTTP_400_BAD_REQUEST)

        body_part_filter = request.query_params.get('body_part')

        from .utils import parse_slot_param
        slot_start_utc, slot_end_utc = parse_slot_param(target_date, slot_param)
        if not slot_start_utc or not slot_end_utc:
            return Response({'detail': 'Invalid slot parameter.'},
                            status=status.HTTP_400_BAD_REQUEST)

        qs = GymActivity.objects.filter(
            gym=gym,
            started_at__gte=slot_start_utc,
            started_at__lt=slot_end_utc,
        ).filter(
            Q(ended_at__isnull=True) | Q(ended_at__gte=slot_end_utc)
        ).select_related('user', 'body_part')

        if body_part_filter:
            qs = qs.filter(body_part__name=body_part_filter)

        results = []
        for act in qs:
            results.append({
                'activity_id': act.id,
                'user_id': act.user.id,
                'username': act.user.username,
                'avatar_url': getattr(act.user, 'avatar', None),
                'started_at': act.started_at.isoformat(),
                'body_part': act.body_part.name if act.body_part else None,
            })

        return Response(results)


class MyActivityView(APIView):
    """Return current active activities for the authenticated user.

    GET /api/my-activity/

    Response:
    {
      "activities": [
         {
           "gym_id": 1,
           "gym_name": "X",
           "started_at": "2025-01-01T10:00:00Z",
           "slot": "10:30 - 11:30",
           "body_parts": ["CHEST", "BACK"],
           "activity_ids": [12,13]
         }
      ]
    }
    """
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        user = request.user
        # fetch active (not ended) activities
        acts = GymActivity.objects.filter(user=user, ended_at__isnull=True).select_related('gym', 'body_part')

        grouped = {}
        for a in acts:
            gid = a.gym.id
            grp = grouped.setdefault(gid, {
                'gym_id': gid,
                'gym_name': a.gym.name,
                'started_at': a.started_at,
                'body_parts': [],
                'activity_ids': [],
            })
            # keep the earliest started_at among grouped activities
            if a.started_at < grp['started_at']:
                grp['started_at'] = a.started_at
            grp['body_parts'].append(a.body_part.name if a.body_part else 'UNKNOWN')
            grp['activity_ids'].append(a.id)

        # We expect at most one active grouped activity for a user.
        first = next(iter(grouped.values()), None)
        if not first:
            return Response({})

        serializer = CurrentActivitySerializer(first)
        return Response(serializer.data)


class CheckoutView(APIView):
    """Endpoint to checkout (end) a GymActivity session.

    POST /api/gym/check-out/{session_id}/

    Body: none

    Permission: authenticated user must own the activity or be staff.
    """
    permission_classes = (IsAuthenticated,)

    def post(self, request, session_id=None, *args, **kwargs):
        # If a specific session_id is provided, behave as before (checkout single activity)
        if session_id is not None:
            activity = get_object_or_404(GymActivity, id=session_id)

            # Permission: only owner or staff may check out this activity
            if activity.user != request.user and not request.user.is_staff:
                return Response({'detail': 'You do not have permission to check out this session.'}, status=status.HTTP_403_FORBIDDEN)

            # Use model helper to mark ended
            changed = activity.checkout()
            if not changed:
                return Response({'detail': 'Session already checked out.'}, status=status.HTTP_400_BAD_REQUEST)

            # success: return empty 200 (no body)
            return Response(status=status.HTTP_200_OK)

        # Otherwise, determine the user's current gym (most likely one active gym)
        # and checkout only activities for that gym. This avoids ending activities
        # across multiple gyms if the user somehow has active activities in more than one.
        active_qs = GymActivity.objects.filter(user=request.user, ended_at__isnull=True).select_related('gym')
        if not active_qs.exists():
            return Response({'detail': 'No active sessions found.'}, status=status.HTTP_400_BAD_REQUEST)

        # Group activities by gym id
        from collections import defaultdict
        groups = defaultdict(list)
        for a in active_qs:
            groups[a.gym.id].append(a)

        # Choose the gym with the most active activities (practical default)
        chosen_gym_id = max(groups.keys(), key=lambda k: len(groups[k]))
        chosen_activities = groups[chosen_gym_id]

        checked_out = []
        details = []
        for activity in chosen_activities:
            changed = activity.checkout()
            if changed:
                checked_out.append(activity.id)
                details.append({
                    'activity_id': activity.id,
                    'gym_id': activity.gym.id,
                    'gym_name': activity.gym.name,
                    'body_part': activity.body_part.name if activity.body_part else None,
                    'ended_at': timezone.localtime(activity.ended_at) if activity.ended_at else None,
                })

        # success: return empty 200 (no body)
        return Response(status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated],
            url_path='slot-load')
    def slot_load(self, request, pk=None):
        """Get gym load for a specific time slot (current, next, or next_to_next).

        GET /api/gyms/{id}/slot-load/?slot=current
        GET /api/gyms/{id}/slot-load/?slot=next
        GET /api/gyms/{id}/slot-load/?slot=next_to_next

        Available to gym owner/staff AND active members.

        Returns:
        {
          "gym_id": 1,
          "gym_name": "Mumbai Fitness Center",
          "slot": {"start": "08:00", "end": "09:00"},
          "total_active": 15,
          "body_part_breakdown": {"CHEST": 5, "BACK": 3, "LEGS": 7},
          "capacity": 50,
          "load_percent": 30.0
        }
        """
        from collections import defaultdict

        gym = self.get_object()

        # Check permission: owner/staff OR active member
        is_owner_or_staff = request.user.is_staff or gym.owner == request.user
        has_membership = Membership.objects.filter(user=request.user, gym=gym, is_active=True).exists()

        if not (is_owner_or_staff or has_membership):
            return Response({'detail': 'You must be gym owner/staff or an active member to view slot load.'},
                            status=status.HTTP_403_FORBIDDEN)

        # Parse slot parameter
        slot_param = request.query_params.get('slot', 'current').lower()
        if slot_param not in ('current', 'next', 'next_to_next'):
            return Response({'detail': 'Invalid slot. Use: current, next, or next_to_next.'},
                            status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        current_slot_start, current_slot_end = GymActivity.compute_slot(now)

        # Calculate target slot based on param
        if slot_param == 'current':
            slot_start, slot_end = current_slot_start, current_slot_end
        elif slot_param == 'next':
            slot_start = current_slot_end
            slot_end = slot_start + timedelta(hours=1)
        else:  # next_to_next
            slot_start = current_slot_end + timedelta(hours=1)
            slot_end = slot_start + timedelta(hours=1)

        # Query activities in this slot that are still active OR started in this slot
        # For current slot: include active workouts (ended_at is NULL) OR started in slot window
        # For future slots: there won't be data yet, but we can show if someone has pre-booked or is still active
        activities = GymActivity.objects.filter(
            gym=gym,
            started_at__lt=slot_end,  # started before slot ends
        ).filter(
            # Either still active OR ended within/after slot start
            models.Q(ended_at__isnull=True) | models.Q(ended_at__gte=slot_start)
        ).select_related('body_part')

        # If looking at current slot, also filter started_at >= prev slot start for relevance
        if slot_param == 'current':
            prev_slot_start = slot_start - timedelta(hours=1)
            activities = activities.filter(started_at__gte=prev_slot_start)

        # Count body parts
        body_part_counts = defaultdict(int)
        total_active = 0
        for act in activities:
            body_part_name = act.body_part.name if act.body_part else 'UNKNOWN'
            body_part_counts[body_part_name] += 1
            total_active += 1

        # Calculate load percentage
        capacity = gym.max_capacity or 50
        load_percent = round((total_active / capacity) * 100, 1) if capacity > 0 else 0

        return Response({
            'gym_id': gym.id,
            'gym_name': gym.name,
            'slot': {
                'start': slot_start.strftime('%H:%M'),
                'end': slot_end.strftime('%H:%M'),
            },
            'total_active': total_active,
            'body_part_breakdown': dict(body_part_counts),
            'capacity': capacity,
            'load_percent': load_percent,
        })


