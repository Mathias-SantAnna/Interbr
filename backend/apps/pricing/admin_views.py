"""
Admin endpoints for Price List management.
"""
from rest_framework import viewsets, serializers as drf_serializers, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import PriceList, PriceListItem
from apps.catalog.models import Product
from apps.accounts.models import Company


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin


class PriceListItemSerializer(drf_serializers.ModelSerializer):
    product_name = drf_serializers.CharField(source="product.name", read_only=True)
    product_sku = drf_serializers.CharField(source="product.sku", read_only=True)

    class Meta:
        model = PriceListItem
        fields = ("id", "product", "product_name", "product_sku", "price")


class PriceListSerializer(drf_serializers.ModelSerializer):
    items = PriceListItemSerializer(many=True, read_only=True)
    company_count = drf_serializers.SerializerMethodField()

    class Meta:
        model = PriceList
        fields = (
            "id", "name", "description", "global_discount_pct",
            "valid_from", "valid_until", "is_active",
            "items", "company_count", "created_at",
        )
        read_only_fields = ("id", "created_at")

    def get_company_count(self, obj):
        return obj.companies.count()


class AdminPriceListViewSet(viewsets.ModelViewSet):
    serializer_class = PriceListSerializer
    permission_classes = [IsAdmin]
    queryset = PriceList.objects.prefetch_related("items__product", "companies").order_by("name")

    @action(detail=True, methods=["post"])
    def set_items(self, request, pk=None):
        """
        POST /api/v1/admin/price-lists/{id}/set_items/
        Body: [{"product_id": uuid, "price": decimal}, ...]
        Replaces ALL items for this price list.
        """
        price_list = self.get_object()
        items_data = request.data if isinstance(request.data, list) else request.data.get("items", [])

        # Validate
        errors = []
        for i, item in enumerate(items_data):
            if "product_id" not in item or "price" not in item:
                errors.append(f"Item {i}: product_id and price required.")
        if errors:
            return Response({"errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        # Replace all items atomically
        from django.db import transaction
        with transaction.atomic():
            price_list.items.all().delete()
            created = []
            for item in items_data:
                try:
                    product = Product.objects.get(pk=item["product_id"])
                    obj = PriceListItem.objects.create(
                        price_list=price_list,
                        product=product,
                        price=item["price"],
                    )
                    created.append(obj)
                except Product.DoesNotExist:
                    pass

        return Response(PriceListItemSerializer(created, many=True).data)

    @action(detail=True, methods=["post"])
    def assign_to_company(self, request, pk=None):
        """POST /api/v1/admin/price-lists/{id}/assign_to_company/ — body: {company_id: uuid}"""
        price_list = self.get_object()
        company_id = request.data.get("company_id")
        try:
            company = Company.objects.get(pk=company_id)
            company.price_list = price_list
            company.save(update_fields=["price_list"])
            return Response({"detail": f"Tabela '{price_list.name}' atribuída a {company.display_name}."})
        except Company.DoesNotExist:
            return Response({"company_id": "Empresa não encontrada."}, status=404)
