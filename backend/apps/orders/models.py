import uuid
from decimal import Decimal
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError


class Order(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Rascunho"
        PENDING_PAYMENT = "pending_payment", "Aguardando pagamento"
        PAID = "paid", "Pago"
        INVOICED = "invoiced", "Faturado (NF-e emitida)"
        SHIPPED = "shipped", "Enviado"
        DELIVERED = "delivered", "Entregue"
        CANCELLED = "cancelled", "Cancelado"

    class PaymentMethod(models.TextChoices):
        PIX = "pix", "Pix"
        BOLETO = "boleto", "Boleto Bancário"
        CREDIT_CARD = "credit_card", "Cartão de crédito"
        BANK_TRANSFER = "bank_transfer", "Transferência bancária"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField("Número do pedido", max_length=20, unique=True, blank=True)

    # ── Two-track order model ──────────────────────────────────────────
    # Track A (salesman): placed_by=salesman, on_behalf_of=client_company
    # Track B (client self-serve): placed_by=client, on_behalf_of=client_company
    placed_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="placed_orders",
        verbose_name="Colocado por",
    )
    on_behalf_of = models.ForeignKey(
        "accounts.Company",
        on_delete=models.PROTECT,
        related_name="orders",
        verbose_name="Cliente",
    )

    status = models.CharField(
        "Status", max_length=20, choices=Status.choices, default=Status.PENDING_PAYMENT
    )
    payment_method = models.CharField(
        "Forma de pagamento",
        max_length=20,
        choices=PaymentMethod.choices,
        blank=True,
    )

    # ── Salesman discount ─────────────────────────────────────────────
    discount_pct = models.DecimalField(
        "Desconto (%)",
        max_digits=4,
        decimal_places=1,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(20)],
    )
    discount_note = models.CharField(
        "Motivo do desconto", max_length=200, blank=True
    )
    discount_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="discounts_given",
        verbose_name="Desconto aplicado por",
    )

    # ── Promo code ────────────────────────────────────────────────────
    promo_code = models.ForeignKey(
        "pricing.PromoCode",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
        verbose_name="Código promocional",
    )
    promo_discount_amount = models.DecimalField(
        "Desconto promo (R$)", max_digits=10, decimal_places=2, default=0
    )

    # ── Delivery ──────────────────────────────────────────────────────
    delivery_cep = models.CharField("CEP de entrega", max_length=9, blank=True)
    delivery_street = models.CharField("Logradouro", max_length=255, blank=True)
    delivery_number = models.CharField("Número", max_length=20, blank=True)
    delivery_complement = models.CharField("Complemento", max_length=100, blank=True)
    delivery_neighborhood = models.CharField("Bairro", max_length=100, blank=True)
    delivery_city = models.CharField("Cidade", max_length=100, blank=True)
    delivery_state = models.CharField("UF", max_length=2, blank=True)
    freight_cost = models.DecimalField(
        "Frete (R$)", max_digits=8, decimal_places=2, default=0
    )

    # ── Payment gateway ───────────────────────────────────────────────
    mp_preference_id = models.CharField("MP Preference ID", max_length=100, blank=True)
    mp_payment_id = models.CharField("MP Payment ID", max_length=100, blank=True)
    payment_link = models.URLField("Link de pagamento", blank=True)
    paid_at = models.DateTimeField("Pago em", null=True, blank=True)

    # ── NF-e ──────────────────────────────────────────────────────────
    nfe_key = models.CharField("Chave NF-e", max_length=50, blank=True)
    nfe_pdf_url = models.URLField("PDF NF-e", blank=True)
    nfe_xml_url = models.URLField("XML NF-e", blank=True)
    nfe_status = models.CharField(
        "Status NF-e",
        max_length=20,
        choices=[
            ("pending", "Pendente"),
            ("processing", "Processando"),
            ("authorized", "Autorizada"),
            ("error", "Erro"),
        ],
        blank=True,
    )
    nfe_emitted_at = models.DateTimeField("NF-e emitida em", null=True, blank=True)

    # ── Shipping ──────────────────────────────────────────────────────
    tracking_code = models.CharField("Código de rastreio", max_length=50, blank=True)
    shipped_at = models.DateTimeField("Enviado em", null=True, blank=True)
    delivered_at = models.DateTimeField("Entregue em", null=True, blank=True)

    # ── Notes ─────────────────────────────────────────────────────────
    internal_notes = models.TextField("Notas internas", blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Pedido"
        verbose_name_plural = "Pedidos"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Pedido #{self.order_number} — {self.on_behalf_of.display_name}"

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = self._generate_order_number()
        super().save(*args, **kwargs)

    def _generate_order_number(self):
        from django.utils import timezone
        prefix = timezone.now().strftime("%Y%m")
        last = (
            Order.objects.filter(order_number__startswith=prefix)
            .order_by("-order_number")
            .values_list("order_number", flat=True)
            .first()
        )
        if last:
            seq = int(last[-4:]) + 1
        else:
            seq = 1
        return f"{prefix}{seq:04d}"

    # ── Money calculations ────────────────────────────────────────────
    @property
    def subtotal(self):
        return sum(item.line_total for item in self.items.all())

    @property
    def discount_amount(self):
        return self.subtotal * (Decimal(str(self.discount_pct)) / 100)

    @property
    def total(self):
        return self.subtotal - self.discount_amount - self.promo_discount_amount + self.freight_cost

    # ── Validation ────────────────────────────────────────────────────
    def clean(self):
        max_disc = self.on_behalf_of.max_discount if self.on_behalf_of_id else 20
        if self.discount_pct > max_disc:
            raise ValidationError(
                {"discount_pct": f"Desconto máximo para este cliente: {max_disc}%"}
            )


class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name="items", verbose_name="Pedido"
    )
    product = models.ForeignKey(
        "catalog.Product",
        on_delete=models.PROTECT,
        related_name="order_items",
        verbose_name="Produto",
    )
    quantity = models.PositiveIntegerField("Quantidade", default=1)
    unit_price = models.DecimalField(
        "Preço unitário (no momento da venda)", max_digits=12, decimal_places=2
    )

    class Meta:
        verbose_name = "Item do pedido"
        verbose_name_plural = "Itens do pedido"

    def __str__(self):
        return f"{self.quantity}x {self.product.sku}"

    @property
    def line_total(self):
        return self.unit_price * self.quantity
