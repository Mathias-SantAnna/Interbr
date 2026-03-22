import requests
from celery import shared_task
from django.conf import settings
from django.utils import timezone


@shared_task
def create_mp_preference(order_id: str):
    """Create a Mercado Pago Checkout Pro preference and save the payment link."""
    from apps.orders.models import Order
    from apps.notifications.tasks import send_payment_link

    try:
        order = Order.objects.select_related("on_behalf_of", "placed_by") \
            .prefetch_related("items__product").get(pk=order_id)
    except Order.DoesNotExist:
        return

    items = [
        {
            "id": str(item.product.sku),
            "title": item.product.name[:256],
            "quantity": item.quantity,
            "unit_price": float(item.unit_price),
            "currency_id": "BRL",
        }
        for item in order.items.all()
    ]

    # Add freight as a separate item
    if order.freight_cost > 0:
        items.append({
            "id": "frete",
            "title": "Frete",
            "quantity": 1,
            "unit_price": float(order.freight_cost),
            "currency_id": "BRL",
        })

    discount_total = float(order.discount_amount + order.promo_discount_amount)

    payload = {
        "items": items,
        "payer": {
            "name": order.on_behalf_of.display_name,
            "email": order.on_behalf_of.email or "cliente@interbrasil.com.br",
        },
        "back_urls": {
            "success": f"{settings.FRONTEND_URL}/pedidos/{order.id}?payment=success",
            "failure": f"{settings.FRONTEND_URL}/pedidos/{order.id}?payment=failure",
            "pending": f"{settings.FRONTEND_URL}/pedidos/{order.id}?payment=pending",
        },
        "auto_return": "approved",
        "external_reference": str(order.id),
        "statement_descriptor": "INTERBRASIL",
        "expires": True,
        "expiration_date_to": (
            timezone.now() + timezone.timedelta(days=3)
        ).strftime("%Y-%m-%dT%H:%M:%S.000-03:00"),
    }

    if discount_total > 0:
        payload["discounts"] = [
            {
                "name": "Desconto",
                "amount": discount_total,
            }
        ]

    try:
        response = requests.post(
            "https://api.mercadopago.com/checkout/preferences",
            json=payload,
            headers={
                "Authorization": f"Bearer {settings.MERCADO_PAGO_ACCESS_TOKEN}",
                "Content-Type": "application/json",
            },
            timeout=15,
        )
        data = response.json()

        if response.status_code == 201:
            preference_id = data["id"]
            # Use sandbox link in non-prod
            if settings.DEBUG:
                payment_link = data.get("sandbox_init_point", data.get("init_point"))
            else:
                payment_link = data.get("init_point")

            order.mp_preference_id = preference_id
            order.payment_link = payment_link
            order.save(update_fields=["mp_preference_id", "payment_link"])

            # Send payment link to client (Track A: salesman placed the order)
            if order.placed_by != order.on_behalf_of.users.first():
                send_payment_link.delay(str(order.id), payment_link)

    except Exception as exc:
        print(f"[MP] Error creating preference for order {order.order_number}: {exc}")


@shared_task
def poll_pending_payments():
    """
    Periodic task — runs every 5 minutes via Celery Beat.
    Catches any orders where the MP webhook was missed.
    """
    from apps.orders.models import Order

    cutoff = timezone.now() - timezone.timedelta(minutes=10)
    pending = Order.objects.filter(
        status=Order.Status.PENDING_PAYMENT,
        mp_preference_id__isnull=False,
        created_at__lte=cutoff,
    ).exclude(mp_preference_id="")

    for order in pending:
        check_mp_payment_status.delay(str(order.id))


@shared_task
def check_mp_payment_status(order_id: str):
    """Check Mercado Pago for payment status of a single order."""
    from apps.orders.models import Order
    from apps.fiscal.tasks import emit_nfe
    from apps.notifications.tasks import send_order_confirmation

    try:
        order = Order.objects.get(pk=order_id)
    except Order.DoesNotExist:
        return

    if not order.mp_preference_id:
        return

    try:
        response = requests.get(
            f"https://api.mercadopago.com/checkout/preferences/{order.mp_preference_id}",
            headers={"Authorization": f"Bearer {settings.MERCADO_PAGO_ACCESS_TOKEN}"},
            timeout=10,
        )
        # A real implementation would check payment search endpoint
        # This is the simplified polling version for MVP
        if response.status_code == 200:
            data = response.json()
            # Check via payment search
            payment_response = requests.get(
                f"https://api.mercadopago.com/v1/payments/search"
                f"?external_reference={order_id}&status=approved",
                headers={"Authorization": f"Bearer {settings.MERCADO_PAGO_ACCESS_TOKEN}"},
                timeout=10,
            )
            payment_data = payment_response.json()
            results = payment_data.get("results", [])
            if results:
                payment = results[0]
                order.mp_payment_id = str(payment["id"])
                order.status = Order.Status.PAID
                order.paid_at = timezone.now()
                order.save(update_fields=["mp_payment_id", "status", "paid_at"])
                send_order_confirmation.delay(order_id)
                emit_nfe.delay(order_id)

    except Exception as exc:
        print(f"[MP Poll] Error for order {order.order_number}: {exc}")


@shared_task
def handle_mp_webhook(payment_id: str):
    """
    Called by the MP webhook endpoint when a payment notification arrives.
    This is the primary (fast) path; polling is the fallback.
    """
    from apps.orders.models import Order
    from apps.fiscal.tasks import emit_nfe
    from apps.notifications.tasks import send_order_confirmation

    try:
        response = requests.get(
            f"https://api.mercadopago.com/v1/payments/{payment_id}",
            headers={"Authorization": f"Bearer {settings.MERCADO_PAGO_ACCESS_TOKEN}"},
            timeout=10,
        )
        payment = response.json()
        external_ref = payment.get("external_reference")
        mp_status = payment.get("status")

        if not external_ref:
            return

        try:
            order = Order.objects.get(pk=external_ref)
        except Order.DoesNotExist:
            return

        if mp_status == "approved" and order.status == Order.Status.PENDING_PAYMENT:
            order.mp_payment_id = payment_id
            order.status = Order.Status.PAID
            order.paid_at = timezone.now()
            order.save(update_fields=["mp_payment_id", "status", "paid_at"])
            send_order_confirmation.delay(str(order.id))
            emit_nfe.delay(str(order.id))

        elif mp_status in ("cancelled", "rejected"):
            order.status = Order.Status.CANCELLED
            order.save(update_fields=["status"])

    except Exception as exc:
        print(f"[Webhook] Error processing payment {payment_id}: {exc}")
