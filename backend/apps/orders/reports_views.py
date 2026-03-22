"""
Admin analytics/reports endpoint.
GET /api/v1/admin/reports/?days=30
"""
from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, Count, F, DecimalField
from django.db.models.functions import TruncDate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Order, OrderItem
from apps.accounts.models import Company


class IsAdmin:
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def reports(request):
    if not request.user.is_admin:
        from rest_framework import status
        return Response({"detail": "Acesso negado."}, status=403)

    days = int(request.query_params.get("days", 30))
    since = timezone.now() - timedelta(days=days)

    paid_statuses = ["confirmed", "invoiced", "shipped", "delivered"]

    # ── Revenue by day ─────────────────────────────────────────────────────────
    daily_qs = (
        Order.objects.filter(created_at__gte=since)
        .annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(
            revenue=Sum("items__unit_price", output_field=DecimalField()),
            count=Count("id", distinct=True),
        )
        .order_by("day")
    )
    # Build complete date range (fill zeros)
    daily_map = {str(r["day"]): {"revenue": float(r["revenue"] or 0), "count": r["count"]} for r in daily_qs}
    daily = []
    for i in range(days):
        d = (timezone.now() - timedelta(days=days - 1 - i)).date()
        key = str(d)
        daily.append({"date": key, **daily_map.get(key, {"revenue": 0, "count": 0})})

    # ── Top products ───────────────────────────────────────────────────────────
    top_products = (
        OrderItem.objects.filter(order__created_at__gte=since)
        .values(
            product_name=F("product__name"),
            product_sku=F("product__sku"),
        )
        .annotate(
            total_qty=Sum("quantity"),
            total_revenue=Sum(F("quantity") * F("unit_price"), output_field=DecimalField()),
        )
        .order_by("-total_revenue")[:10]
    )

    # ── Top clients ────────────────────────────────────────────────────────────
    top_clients = (
        Order.objects.filter(created_at__gte=since)
        .values(
            company_name=F("on_behalf_of__razao_social"),
            company_id=F("on_behalf_of__id"),
        )
        .annotate(
            order_count=Count("id"),
            total_spend=Sum(F("items__unit_price"), output_field=DecimalField()),
        )
        .order_by("-total_spend")[:10]
    )

    # ── Orders by status ───────────────────────────────────────────────────────
    by_status = (
        Order.objects.filter(created_at__gte=since)
        .values("status")
        .annotate(count=Count("id"))
        .order_by("status")
    )

    # ── Summary KPIs ──────────────────────────────────────────────────────────
    total_orders = Order.objects.filter(created_at__gte=since).count()
    total_revenue = (
        OrderItem.objects.filter(order__created_at__gte=since)
        .aggregate(s=Sum(F("quantity") * F("unit_price"), output_field=DecimalField()))["s"] or 0
    )
    new_clients = Company.objects.filter(created_at__gte=since).count()

    return Response({
        "period_days": days,
        "summary": {
            "total_orders": total_orders,
            "total_revenue": float(total_revenue),
            "new_clients": new_clients,
        },
        "daily": daily,
        "top_products": [
            {
                "name": r["product_name"],
                "sku": r["product_sku"],
                "qty": r["total_qty"],
                "revenue": float(r["total_revenue"] or 0),
            }
            for r in top_products
        ],
        "top_clients": [
            {
                "name": r["company_name"],
                "id": str(r["company_id"]),
                "orders": r["order_count"],
                "spend": float(r["total_spend"] or 0),
            }
            for r in top_clients
        ],
        "by_status": [{"status": r["status"], "count": r["count"]} for r in by_status],
    })
