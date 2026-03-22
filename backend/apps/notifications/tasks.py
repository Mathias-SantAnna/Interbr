from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings


@shared_task
def send_order_confirmation(order_id: str):
    """Send order confirmation email to the client company."""
    from apps.orders.models import Order

    try:
        order = Order.objects.select_related(
            "on_behalf_of", "placed_by"
        ).prefetch_related("items__product").get(pk=order_id)
    except Order.DoesNotExist:
        return

    company = order.on_behalf_of
    items_text = "\n".join(
        f"  • {item.quantity}x {item.product.name} — R$ {item.line_total:,.2f}"
        for item in order.items.all()
    )

    discount_line = ""
    if order.discount_pct > 0:
        discount_line = (
            f"\nDesconto comercial ({order.discount_pct}%): -R$ {order.discount_amount:,.2f}"
        )

    body = f"""Olá, {company.display_name}!

Seu pedido foi confirmado.

Número do pedido: #{order.order_number}

ITENS:
{items_text}

Subtotal: R$ {order.subtotal:,.2f}{discount_line}
Frete: R$ {order.freight_cost:,.2f}
TOTAL: R$ {order.total:,.2f}

Forma de pagamento: {order.get_payment_method_display()}
{'Link para pagamento: ' + order.payment_link if order.payment_link else ''}

Acompanhe seu pedido em: {settings.FRONTEND_URL}/pedidos/{order.id}

Obrigado por comprar na InterBR!
Interbrasil Distribuidora — interbrasil.com.br
"""

    # Send to the client company's email
    recipient = company.email
    if not recipient and order.placed_by.company:
        recipient = order.placed_by.email

    if recipient:
        send_mail(
            subject=f"InterBR — Pedido #{order.order_number} confirmado",
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=True,
        )


@shared_task
def send_nfe_email(order_id: str):
    """Send NF-e availability email after emission."""
    from apps.orders.models import Order

    try:
        order = Order.objects.select_related("on_behalf_of").get(pk=order_id)
    except Order.DoesNotExist:
        return

    company = order.on_behalf_of

    body = f"""Olá, {company.display_name}!

A Nota Fiscal do seu pedido #{order.order_number} foi emitida.

Chave de acesso: {order.nfe_key}

Faça o download do DANFE (PDF): {order.nfe_pdf_url}
Faça o download do XML: {order.nfe_xml_url}

Você também pode acessar a NF-e em:
{settings.FRONTEND_URL}/pedidos/{order.id}

Interbrasil Distribuidora — interbrasil.com.br
"""

    recipient = company.email
    if recipient:
        send_mail(
            subject=f"InterBR — NF-e do pedido #{order.order_number} disponível",
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            fail_silently=True,
        )


@shared_task
def send_payment_link(order_id: str, payment_link: str):
    """Salesman places order → email client with payment link."""
    from apps.orders.models import Order

    try:
        order = Order.objects.select_related("on_behalf_of").get(pk=order_id)
    except Order.DoesNotExist:
        return

    company = order.on_behalf_of

    body = f"""Olá, {company.display_name}!

{order.placed_by.full_name} preparou um pedido para você na InterBR.

Número do pedido: #{order.order_number}
Total: R$ {order.total:,.2f}

Para confirmar o pedido, realize o pagamento pelo link abaixo:
{payment_link}

O link é válido por 3 dias.

Dúvidas? Entre em contato com seu representante:
{order.placed_by.full_name} — {order.placed_by.email}

Interbrasil Distribuidora — interbrasil.com.br
"""

    if company.email:
        send_mail(
            subject=f"InterBR — Pedido #{order.order_number} aguarda seu pagamento",
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[company.email],
            fail_silently=True,
        )
