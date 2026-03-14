from firebase_admin import messaging

def send_topic_notification(topic, title, message, category=None):
    """Send a topic broadcast via FCM.

    The `data` payload includes `category` so clients can make decisions.
    """

    data_payload = {
        'category': category or 'gym_update',
        'title': title,
        'message': message,
    }

    msg = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=message,
        ),
        data=data_payload,
        topic=topic,
    )

    response = messaging.send(msg)
    return response