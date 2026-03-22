"""
Admin write endpoints for Product and Category management.
"""
from rest_framework import viewsets, permissions, parsers
from rest_framework.response import Response
from rest_framework import serializers as drf_serializers

from .models import Category, Product
from .serializers import CategorySerializer, ProductDetailSerializer, ProductListSerializer


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin


class ProductWriteSerializer(drf_serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = (
            "id", "sku", "slug", "name", "description",
            "category", "base_price", "unit",
            "stock_qty", "weight_kg", "ncm_code",
            "image_url", "is_featured", "is_active",
        )


class AdminCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAdmin]
    lookup_field = "slug"
    queryset = Category.objects.all().order_by("order", "name")


class AdminProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    lookup_field = "slug"

    def get_queryset(self):
        qs = Product.objects.select_related("category").order_by("-created_at")
        q = self.request.query_params.get("q", "").strip()
        if q:
            from django.db.models import Q
            qs = qs.filter(Q(name__icontains=q) | Q(sku__icontains=q))
        cat = self.request.query_params.get("category")
        if cat:
            qs = qs.filter(category__slug=cat)
        active = self.request.query_params.get("active")
        if active == "false":
            qs = qs.filter(is_active=False)
        elif active == "true":
            qs = qs.filter(is_active=True)
        return qs

    def get_serializer_class(self):
        if self.request.method in ("POST", "PUT", "PATCH"):
            return ProductWriteSerializer
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer
