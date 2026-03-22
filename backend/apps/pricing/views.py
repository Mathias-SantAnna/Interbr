from rest_framework import viewsets, permissions
from rest_framework import serializers as drf_serializers
from .models import PromoCode, PriceList


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin


class PromoCodeSerializer(drf_serializers.ModelSerializer):
    is_valid_now = drf_serializers.BooleanField(source="is_valid", read_only=True)
    discount_type_display = drf_serializers.CharField(
        source="get_discount_type_display", read_only=True
    )

    class Meta:
        model = PromoCode
        fields = (
            "id", "code", "description",
            "discount_type", "discount_type_display", "discount_value",
            "min_order_value", "max_uses", "uses_count",
            "category", "valid_from", "valid_until",
            "is_active", "is_valid_now", "created_at",
        )
        read_only_fields = ("id", "uses_count", "is_valid_now", "created_at")


class AdminPromoCodeViewSet(viewsets.ModelViewSet):
    serializer_class = PromoCodeSerializer
    permission_classes = [IsAdmin]
    queryset = PromoCode.objects.all().order_by("-created_at")
