from django.urls import path

from .views import gym_update

urlpatterns = [
    # POST: { gym_id, title, message }
    path('gym-update/', gym_update, name='gym-update'),
]
