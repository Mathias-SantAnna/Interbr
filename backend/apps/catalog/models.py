import uuid
from django.db import models
from django.contrib.postgres.search import SearchVectorField
from django.contrib.postgres.indexes import GinIndex
from django.utils.text import slugify


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField("Nome", max_length=100)
    slug = models.SlugField(unique=True, max_length=120)
    description = models.TextField("Descrição", blank=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="children",
        verbose_name="Categoria pai",
    )
    image = models.ImageField("Imagem", upload_to="categories/", blank=True, null=True)
    order = models.PositiveIntegerField("Ordem", default=0)
    is_active = models.BooleanField("Ativa", default=True)

    class Meta:
        verbose_name = "Categoria"
        verbose_name_plural = "Categorias"
        ordering = ["order", "name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sku = models.CharField("SKU", max_length=64, unique=True)
    name = models.CharField("Nome", max_length=255)
    slug = models.SlugField(unique=True, max_length=280)
    description = models.TextField("Descrição", blank=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products",
        verbose_name="Categoria",
    )

    # Pricing
    base_price = models.DecimalField("Preço base", max_digits=12, decimal_places=2)
    unit = models.CharField("Unidade", max_length=20, default="un")

    # Fiscal
    ncm_code = models.CharField("NCM", max_length=10)
    cest_code = models.CharField("CEST", max_length=9, blank=True)

    # Inventory
    stock_qty = models.IntegerField("Estoque", default=0)
    min_stock_alert = models.IntegerField("Alerta estoque mínimo", default=5)
    weight_kg = models.DecimalField("Peso (kg)", max_digits=8, decimal_places=3, default=0)

    # Media
    image = models.ImageField("Imagem principal", upload_to="products/", blank=True, null=True)
    image_url = models.URLField("URL da imagem", blank=True)

    # Status
    is_active = models.BooleanField("Ativo", default=True)
    is_featured = models.BooleanField("Destaque", default=False)

    # Full-text search vector (updated via management command / signal)
    search_vector = SearchVectorField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Produto"
        verbose_name_plural = "Produtos"
        ordering = ["name"]
        indexes = [
            GinIndex(fields=["search_vector"]),
        ]

    def __str__(self):
        return f"[{self.sku}] {self.name}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.sku}-{self.name}")
        super().save(*args, **kwargs)

    def price_for(self, company):
        """Return the negotiated price for a given company, or base_price."""
        if company is None or company.price_list is None:
            return self.base_price
        item = company.price_list.items.filter(product=self).first()
        if item:
            return item.price
        # Apply list-level discount if no item-level override
        discount = company.price_list.global_discount_pct
        if discount:
            return self.base_price * (1 - discount / 100)
        return self.base_price

    @property
    def is_low_stock(self):
        return self.stock_qty <= self.min_stock_alert

    @property
    def display_image(self):
        if self.image:
            return self.image.url
        return self.image_url or None


class PartCompatibility(models.Model):
    """Links a product (spare part) to the equipment it fits."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="compatibilities",
        verbose_name="Produto",
    )
    equipment_brand = models.CharField("Marca do equipamento", max_length=100)
    equipment_model = models.CharField("Modelo do equipamento", max_length=200)
    year_from = models.PositiveIntegerField("Ano (de)", null=True, blank=True)
    year_to = models.PositiveIntegerField("Ano (até)", null=True, blank=True)
    notes = models.CharField("Observações", max_length=255, blank=True)

    class Meta:
        verbose_name = "Compatibilidade"
        verbose_name_plural = "Compatibilidades"
        ordering = ["equipment_brand", "equipment_model"]

    def __str__(self):
        return f"{self.equipment_brand} {self.equipment_model}"
