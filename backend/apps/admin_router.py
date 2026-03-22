"""
All /api/v1/admin/* routes wired here.
Imported by config/urls.py.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.orders.admin_views import AdminOrderViewSet
from apps.catalog.admin_views import AdminProductViewSet, AdminCategoryViewSet
from apps.pricing.views import AdminPromoCodeViewSet
from apps.pricing.admin_views import AdminPriceListViewSet
from apps.accounts.admin_views import AdminCompanyViewSet, AdminUserViewSet

router = DefaultRouter()
router.register(r"orders", AdminOrderViewSet, basename="admin-orders")
router.register(r"products", AdminProductViewSet, basename="admin-products")
router.register(r"categories", AdminCategoryViewSet, basename="admin-categories")
router.register(r"promo-codes", AdminPromoCodeViewSet, basename="admin-promo-codes")
router.register(r"price-lists", AdminPriceListViewSet, basename="admin-price-lists")
router.register(r"companies", AdminCompanyViewSet, basename="admin-companies")
router.register(r"users", AdminUserViewSet, basename="admin-users")

from apps.orders.reports_views import reports
from django.urls import path
urlpatterns = router.urls + [
    path("reports/", reports, name="admin-reports"),
]
