from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import GymViewSet, MyActivityView

router = DefaultRouter()
router.register(r'gyms', GymViewSet, basename='gym')

# Place custom/non-router paths before the router include so they are not
# shadowed by the router's detail routes (e.g. 'gyms/<lookup>/').
urlpatterns = [
    path('gyms/my-activity/', MyActivityView.as_view(), name='my-activity'),
    path('', include(router.urls)),
]

