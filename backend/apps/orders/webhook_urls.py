from django.urls import path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from apps.orders.tasks import handle_mp_webhook


@api_view(["POST"])
@permission_classes([AllowAny])
def mp_webhook(request):
    """
    Mercado Pago IPN webhook.
    MP sends: {"action": "payment.updated", "data": {"id": "12345"}}
    """
    action = request.data.get("action", "")
    if action in ("payment.created", "payment.updated"):
        payment_id = str(request.data.get("data", {}).get("id", ""))
        if payment_id:
            handle_mp_webhook.delay(payment_id)
    return Response({"status": "ok"})


urlpatterns = [path("", mp_webhook, name="mp_webhook")]
