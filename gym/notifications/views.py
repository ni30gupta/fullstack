from django.shortcuts import render

# Create your views here.
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .services import send_topic_notification
from .models import Notification


@api_view(["POST"])
def gym_update(request):

    gym_id = request.data["gym_id"]
    title = request.data["title"]
    message = request.data["message"]
    category = request.data.get("category", "gym_update")

    topic = f"gym_{gym_id}"

    Notification.objects.create(
        gym_id=gym_id,
        title=title,
        message=message,
        category=category
    )

    send_topic_notification(
        topic,
        title,
        message,
        category=category,
    )

    return Response({"status": "notification sent"})