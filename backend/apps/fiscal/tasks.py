import os
import random
import string

from celery import shared_task
from django.conf import settings
from django.utils import timezone

from apps.fiscal.models import NFeEmission
from apps.fiscal.mock_danfe import generate_mock_danfe
from apps.orders.models import Order


def _fake_key() -> str:
    return "".join(random.choices(string.digits, k=44))


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def emit_nfe(self, order_id: str):
    """
    Generates a mock DANFE PDF locally and marks the order as invoiced.
    Replaces the Focus NFe integration for demo purposes.
    """
    try:
        order = Order.objects.select_related("on_behalf_of").get(pk=order_id)
    except Order.DoesNotExist:
        return

    # Idempotency — skip if already processed
    if order.nfe_status == "authorized":
        return

    emission, _ = NFeEmission.objects.get_or_create(order=order)
    emission.status = NFeEmission.Status.PROCESSING
    emission.attempts += 1
    emission.save(update_fields=["status", "attempts"])

    order.nfe_status = "processing"
    order.save(update_fields=["nfe_status"])

    try:
        # Generate PDF bytes
        pdf_bytes = generate_mock_danfe(order)

        # Persist to media/nfe/
        filename = f"nfe_{order.order_number}.pdf"
        nfe_dir = os.path.join(settings.MEDIA_ROOT, "nfe")
        os.makedirs(nfe_dir, exist_ok=True)
        filepath = os.path.join(nfe_dir, filename)
        with open(filepath, "wb") as fh:
            fh.write(pdf_bytes)

        # Build publicly accessible URL
        base_url = getattr(settings, "BACKEND_URL",
                           getattr(settings, "FRONTEND_URL", "http://localhost:8000"))
        pdf_url = f"{base_url}/media/nfe/{filename}"

        # Fake access key (44 digits)
        access_key = _fake_key()

        # Update emission record
        emission.status = NFeEmission.Status.AUTHORIZED
        emission.access_key = access_key
        emission.pdf_url = pdf_url
        emission.emitted_at = timezone.now()
        emission.save(update_fields=["status", "access_key", "pdf_url", "emitted_at"])

        # Update order
        order.nfe_key = access_key
        order.nfe_pdf_url = pdf_url
        order.nfe_status = "authorized"
        order.nfe_emitted_at = emission.emitted_at
        order.status = Order.Status.INVOICED
        order.save(update_fields=[
            "nfe_key", "nfe_pdf_url", "nfe_status", "nfe_emitted_at", "status"
        ])

        # Notify client by e-mail
        try:
            from apps.notifications.tasks import send_nfe_email
            send_nfe_email.delay(order_id)
        except Exception:
            pass  # email failure must not block NF-e success

    except Exception as exc:
        emission.status = NFeEmission.Status.ERROR
        emission.error_message = str(exc)
        emission.save(update_fields=["status", "error_message"])
        order.nfe_status = "error"
        order.save(update_fields=["nfe_status"])
        raise self.retry(exc=exc)
