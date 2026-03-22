from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("", views.OrderViewSet, basename="order")

urlpatterns = [
    # Explicit paths MUST come before the router to avoid {pk}/ capturing them
    path("create/", views.OrderViewSet.as_view({"post": "create_order"}), name="create_order"),
    path("validate-promo/", views.ValidatePromoCodeView.as_view(), name="validate_promo"),
    path("webhook/mp/", include("apps.orders.webhook_urls")),
    path("<uuid:order_id>/simulate-payment/", views.simulate_payment, name="simulate_payment"),
    path("", include(router.urls)),
]
