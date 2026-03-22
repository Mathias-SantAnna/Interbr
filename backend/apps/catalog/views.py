from rest_framework import viewsets, filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from django.db.models import Q

from .models import Category, Product
from .serializers import (
    CategorySerializer, ProductListSerializer, ProductDetailSerializer
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        return (
            Category.objects.filter(is_active=True, parent=None)
            .prefetch_related("children")
            .order_by("order", "name")
        )


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["name", "base_price", "created_at", "stock_qty"]
    ordering = ["name"]
    lookup_field = "slug"

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        # Inject company so price_for() works in serializer
        user = self.request.user
        if user.is_authenticated and user.company:
            ctx["company"] = user.company
        else:
            ctx["company"] = None
        return ctx

    def get_queryset(self):
        qs = (
            Product.objects.filter(is_active=True)
            .select_related("category")
            .prefetch_related("compatibilities")
        )

        # Full-text search
        q = self.request.query_params.get("q", "").strip()
        if q:
            search_query = SearchQuery(q, config="portuguese")
            qs = qs.annotate(
                rank=SearchRank("search_vector", search_query)
            ).filter(
                Q(search_vector=search_query) |
                Q(name__icontains=q) |
                Q(sku__icontains=q)
            ).order_by("-rank")

        # Category filter (by slug)
        category_slug = self.request.query_params.get("category")
        if category_slug:
            qs = qs.filter(
                Q(category__slug=category_slug) |
                Q(category__parent__slug=category_slug)
            )

        # Price range
        price_min = self.request.query_params.get("price_min")
        price_max = self.request.query_params.get("price_max")
        if price_min:
            qs = qs.filter(base_price__gte=price_min)
        if price_max:
            qs = qs.filter(base_price__lte=price_max)

        # In-stock only
        if self.request.query_params.get("in_stock") == "true":
            qs = qs.filter(stock_qty__gt=0)

        # Featured
        if self.request.query_params.get("featured") == "true":
            qs = qs.filter(is_featured=True)

        return qs

    @action(detail=False, methods=["get"])
    def featured(self, request):
        """GET /api/v1/catalog/products/featured/ — 8 featured products for homepage."""
        qs = self.get_queryset().filter(is_featured=True)[:8]
        serializer = ProductListSerializer(
            qs, many=True, context=self.get_serializer_context()
        )
        return Response(serializer.data)
