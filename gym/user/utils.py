from rest_framework.views import exception_handler
from rest_framework.exceptions import ValidationError


def custom_exception_handler(exc, context):
    """Custom DRF exception handler that flattens ValidationError messages.

    If a ValidationError with a dict of field errors is raised, the response data
    will be converted into a single string under the `error` key. This makes it
    easier for clients to display or log without iterating over nested objects.

    Other exceptions are handled by DRF's default handler and returned unchanged.
    """
    response = exception_handler(exc, context)

    if response is not None and isinstance(exc, ValidationError):
        detail = exc.detail
        if isinstance(detail, dict):
            pieces = []
            for field, msgs in detail.items():
                if isinstance(msgs, (list, tuple)):
                    pieces.append(f"{field} - {', '.join(str(m) for m in msgs)}")
                else:
                    pieces.append(f"{field} - {msgs}")
            response.data = {'error': '; '.join(pieces)}
    return response
