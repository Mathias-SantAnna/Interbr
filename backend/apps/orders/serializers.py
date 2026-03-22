from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Order, OrderItem
from apps.catalog.serializers import ProductListSerializer
from apps.accounts.serializers import CompanyLightSerializer, UserSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ("id", "product", "quantity", "unit_price", "line_total")


class OrderItemCreateSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.Serializer):
    """Accepts both Track A (salesman) and Track B (client) order creation."""
    # Track A only — salesman specifies which company to order for
    company_id = serializers.UUIDField(required=False)

    items = OrderItemCreateSerializer(many=True)
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices)

    # Discount — salesman only, validated server-side against tier cap
    discount_pct = serializers.DecimalField(
        max_digits=4, decimal_places=1, default=0, min_value=0, max_value=20
    )
    discount_note = serializers.CharField(max_length=200, required=False, allow_blank=True)

    # Promo code — client self-serve (requires login)
    promo_code = serializers.CharField(max_length=30, required=False, allow_blank=True)

    # Delivery
    delivery_cep = serializers.CharField(max_length=9)
    delivery_street = serializers.CharField(max_length=255)
    delivery_number = serializers.CharField(max_length=20)
    delivery_complement = serializers.CharField(max_length=100, required=False, allow_blank=True)
    delivery_neighborhood = serializers.CharField(max_length=100, required=False, allow_blank=True)
    delivery_city = serializers.CharField(max_length=100)
    delivery_state = serializers.CharField(max_length=2)

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("O pedido precisa ter ao menos um item.")
        return value


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    on_behalf_of = CompanyLightSerializer(read_only=True)
    placed_by = UserSerializer(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    payment_method_display = serializers.CharField(
        source="get_payment_method_display", read_only=True
    )
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    discount_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Order
        fields = (
            "id", "order_number", "status", "status_display",
            "placed_by", "on_behalf_of",
            "items", "subtotal",
            "discount_pct", "discount_note", "discount_amount",
            "promo_code", "promo_discount_amount",
            "freight_cost", "total",
            "payment_method", "payment_method_display",
            "payment_link", "paid_at",
            "delivery_cep", "delivery_city", "delivery_state",
            "nfe_key", "nfe_pdf_url", "nfe_status",
            "tracking_code", "shipped_at", "delivered_at",
            "created_at",
        )
        read_only_fields = fields


class PromoCodeValidateSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=30)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2)
