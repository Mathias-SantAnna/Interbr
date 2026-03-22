from django.urls import path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status as http_status


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def nfe_status(request, order_id):
    """GET /api/v1/fiscal/nfe/<order_id>/ — NF-e status + download links."""
    from apps.orders.models import Order
    try:
        order = Order.objects.get(pk=order_id)
    except Order.DoesNotExist:
        return Response({"detail": "Pedido não encontrado."}, status=404)

    # Permission check
    user = request.user
    if not user.is_admin and not user.is_salesman:
        if not user.company or order.on_behalf_of != user.company:
            return Response({"detail": "Sem permissão."}, status=403)

    return Response({
        "order_number": order.order_number,
        "nfe_status": order.nfe_status,
        "nfe_key": order.nfe_key,
        "nfe_pdf_url": order.nfe_pdf_url,
        "nfe_xml_url": order.nfe_xml_url,
        "nfe_emitted_at": order.nfe_emitted_at,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reemit_nfe(request, order_id):
    """POST /api/v1/fiscal/nfe/<order_id>/reemit/ — admin retries NF-e emission."""
    if not request.user.is_admin:
        return Response({"detail": "Apenas administradores."}, status=403)
    from apps.fiscal.tasks import emit_nfe
    emit_nfe.delay(order_id)
    return Response({"detail": "Reemissão solicitada."})


urlpatterns = [
    path("nfe/<uuid:order_id>/", nfe_status, name="nfe_status"),
    path("nfe/<uuid:order_id>/reemit/", reemit_nfe, name="nfe_reemit"),
]
