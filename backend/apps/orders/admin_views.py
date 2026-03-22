"""
Admin-only REST endpoints: order status updates, full order listing with filters.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Order
from .serializers import OrderSerializer


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin


class AdminOrderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET  /api/v1/admin/orders/         — all orders, filterable
    PATCH /api/v1/admin/orders/{id}/set_status/ — update status
    """
    serializer_class = OrderSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = Order.objects.select_related(
            "placed_by", "on_behalf_of", "promo_code"
        ).prefetch_related("items__product").order_by("-created_at")

        s = self.request.query_params.get("status")
        if s:
            qs = qs.filter(status=s)

        company = self.request.query_params.get("company_id")
        if company:
            qs = qs.filter(on_behalf_of_id=company)

        return qs

    @action(detail=True, methods=["patch"])
    def set_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get("status")
        if new_status not in dict(Order.Status.choices):
            return Response(
                {"status": f"Status inválido. Opções: {list(dict(Order.Status.choices).keys())}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        order.status = new_status
        order.save(update_fields=["status"])
        return Response(OrderSerializer(order).data)
