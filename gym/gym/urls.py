from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import *
router = DefaultRouter()
router.register(r'gyms', GymViewSet, basename='gym')

# Place custom/non-router paths before the router include so they are not
# shadowed by the router's detail routes (e.g. 'gyms/<lookup>/').
urlpatterns = [
    path('gyms/my-activity/', MyActivityView.as_view(), name='my-activity'),
    path('gyms/my-workouts/', MyWorkoutHistoryView.as_view(), name='my-workouts'),
    # Checkout without id: will checkout all active activities for authenticated user
    path('gym/check-out/', CheckoutView.as_view(), name='gym-checkout-all'),
    path('gym/check-out/<int:session_id>/', CheckoutView.as_view(), name='gym-checkout'),
    path('', include(router.urls)),
]

