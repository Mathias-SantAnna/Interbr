from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Order
from .serializers import OrderSerializer, OrderCreateSerializer, PromoCodeValidateSerializer
from .services import create_order
from apps.accounts.models import Company
from apps.pricing.models import PromoCode


class IsAdminOrSalesman(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("admin", "salesman")


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Order.objects.select_related(
            "placed_by", "on_behalf_of", "promo_code"
        ).prefetch_related("items__product")

        company_id = self.request.query_params.get("company_id")

        if user.is_admin:
            base = qs.all()
            if company_id:
                base = base.filter(on_behalf_of_id=company_id)
            return base
        if user.is_salesman:
            client_ids = user.assigned_companies.values_list("id", flat=True)
            base = qs.filter(on_behalf_of_id__in=client_ids)
            if company_id:
                base = base.filter(on_behalf_of_id=company_id)
            return base
        # Client sees only their company's orders
        if user.company:
            return qs.filter(on_behalf_of=user.company)
        return Order.objects.none()

    @action(detail=False, methods=["post"])
    def create_order(self, request):
        """
        POST /api/v1/orders/create_order/
        Handles both Track A (salesman) and Track B (client self-serve).
        """
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = request.user

        # Resolve company
        if user.is_salesman or user.is_admin:
            company_id = data.get("company_id")
            if not company_id:
                return Response(
                    {"company_id": "Vendedores devem especificar o cliente."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            try:
                company = Company.objects.get(pk=company_id, is_active=True)
            except Company.DoesNotExist:
                return Response(
                    {"company_id": "Cliente não encontrado."},
                    status=status.HTTP_404_NOT_FOUND
                )
            # Verify salesman is assigned to this company
            if user.is_salesman and not user.assigned_companies.filter(id=company_id).exists():
                return Response(
                    {"company_id": "Este cliente não está em sua carteira."},
                    status=status.HTTP_403_FORBIDDEN
                )
        else:
            # Client self-serve — company is their own
            if not user.company:
                return Response(
                    {"detail": "Usuário sem empresa vinculada."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            company = user.company

        delivery_address = {
            "delivery_cep": data["delivery_cep"],
            "delivery_street": data["delivery_street"],
            "delivery_number": data["delivery_number"],
            "delivery_complement": data.get("delivery_complement", ""),
            "delivery_neighborhood": data.get("delivery_neighborhood", ""),
            "delivery_city": data["delivery_city"],
            "delivery_state": data["delivery_state"],
        }

        try:
            order = create_order(
                placed_by=user,
                company=company,
                cart_items=[
                    {"product_id": str(i["product_id"]), "quantity": i["quantity"]}
                    for i in data["items"]
                ],
                payment_method=data["payment_method"],
                delivery_address=delivery_address,
                discount_pct=float(data.get("discount_pct", 0)),
                discount_note=data.get("discount_note", ""),
                promo_code_str=data.get("promo_code", ""),
            )
        except Exception as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        # Kick off Mercado Pago preference creation async
        from apps.orders.tasks import create_mp_preference
        create_mp_preference.delay(str(order.id))

        return Response(
            OrderSerializer(order, context={"request": request}).data,
            status=status.HTTP_201_CREATED
        )


class ValidatePromoCodeView(generics.GenericAPIView):
    """POST /api/v1/orders/validate-promo/ — check promo code validity + discount amount."""
    serializer_class = PromoCodeValidateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data["code"].upper()
        subtotal = serializer.validated_data["subtotal"]

        try:
            promo = PromoCode.objects.get(code=code)
        except PromoCode.DoesNotExist:
            return Response({"valid": False, "detail": "Código não encontrado."})

        if not promo.is_valid:
            return Response({"valid": False, "detail": "Código inválido ou expirado."})

        if subtotal < promo.min_order_value:
            return Response({
                "valid": False,
                "detail": f"Pedido mínimo para este código: R$ {promo.min_order_value:,.2f}"
            })

        discount = promo.calculate_discount(subtotal)
        return Response({
            "valid": True,
            "code": promo.code,
            "discount_type": promo.discount_type,
            "discount_amount": discount,
            "description": promo.description,
        })


from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def simulate_payment(request, order_id):
    """
    DEMO ONLY — simulates a successful Mercado Pago payment.
    Only available when DEBUG=True. Marks order as PAID and triggers NF-e.
    """
    if not settings.DEBUG:
        return Response({"detail": "Not available in production."}, status=403)

    from apps.orders.models import Order
    from apps.fiscal.tasks import emit_nfe
    from apps.notifications.tasks import send_order_confirmation

    try:
        order = Order.objects.get(pk=order_id, placed_by=request.user) if not request.user.is_staff else Order.objects.get(pk=order_id)
    except Order.DoesNotExist:
        return Response({"detail": "Order not found."}, status=404)

    if order.status != Order.Status.PENDING_PAYMENT:
        return Response({"detail": f"Order is already '{order.status}', cannot simulate payment."}, status=400)

    order.status = Order.Status.PAID
    order.paid_at = timezone.now()
    order.mp_payment_id = f"DEMO-{order.order_number}"
    order.save(update_fields=["status", "paid_at", "mp_payment_id"])

    send_order_confirmation.delay(str(order.id))
    emit_nfe.delay(str(order.id))

    return Response({"detail": "Payment simulated. NF-e generation queued.", "order_id": str(order.id)})
