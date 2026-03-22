import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class PriceList(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField("Nome", max_length=100)
    description = models.TextField("Descrição", blank=True)

    # A flat % applied to all products not in PriceListItem
    global_discount_pct = models.DecimalField(
        "Desconto global (%)",
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    valid_from = models.DateField("Válida de", null=True, blank=True)
    valid_until = models.DateField("Válida até", null=True, blank=True)
    is_active = models.BooleanField("Ativa", default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Tabela de preços"
        verbose_name_plural = "Tabelas de preços"
        ordering = ["name"]

    def __str__(self):
        return self.name


class PriceListItem(models.Model):
    """Per-product price override within a price list."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    price_list = models.ForeignKey(
        PriceList,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name="Tabela",
    )
    product = models.ForeignKey(
        "catalog.Product",
        on_delete=models.CASCADE,
        related_name="price_list_items",
        verbose_name="Produto",
    )
    price = models.DecimalField("Preço", max_digits=12, decimal_places=2)

    class Meta:
        verbose_name = "Item da tabela"
        verbose_name_plural = "Itens da tabela"
        unique_together = [("price_list", "product")]

    def __str__(self):
        return f"{self.price_list.name} — {self.product.sku}: R$ {self.price}"


class PromoCode(models.Model):
    class DiscountType(models.TextChoices):
        PERCENTAGE = "percentage", "Percentual (%)"
        FIXED = "fixed", "Valor fixo (R$)"
        FREE_SHIPPING = "free_shipping", "Frete grátis"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField("Código", max_length=30, unique=True)
    description = models.CharField("Descrição", max_length=255, blank=True)
    discount_type = models.CharField(
        "Tipo de desconto",
        max_length=20,
        choices=DiscountType.choices,
        default=DiscountType.PERCENTAGE,
    )
    discount_value = models.DecimalField(
        "Valor do desconto",
        max_digits=8,
        decimal_places=2,
        default=0,
    )

    # Restrictions
    min_order_value = models.DecimalField(
        "Pedido mínimo (R$)", max_digits=10, decimal_places=2, default=0
    )
    max_uses = models.PositiveIntegerField("Máximo de usos", null=True, blank=True)
    uses_count = models.PositiveIntegerField("Usos realizados", default=0)

    # Scope — null means applies to everything
    category = models.ForeignKey(
        "catalog.Category",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Restrito à categoria",
    )

    valid_from = models.DateTimeField("Válido de", null=True, blank=True)
    valid_until = models.DateTimeField("Válido até", null=True, blank=True)
    is_active = models.BooleanField("Ativo", default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Código promocional"
        verbose_name_plural = "Códigos promocionais"
        ordering = ["-created_at"]

    def __str__(self):
        return self.code

    @property
    def is_valid(self):
        if not self.is_active:
            return False
        now = timezone.now()
        if self.valid_from and now < self.valid_from:
            return False
        if self.valid_until and now > self.valid_until:
            return False
        if self.max_uses is not None and self.uses_count >= self.max_uses:
            return False
        return True

    def calculate_discount(self, subtotal):
        if self.discount_type == self.DiscountType.PERCENTAGE:
            return subtotal * (self.discount_value / 100)
        elif self.discount_type == self.DiscountType.FIXED:
            return min(self.discount_value, subtotal)
        return 0  # FREE_SHIPPING handled separately
