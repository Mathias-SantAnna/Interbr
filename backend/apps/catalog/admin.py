from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Product, PartCompatibility


class PartCompatibilityInline(admin.TabularInline):
    model = PartCompatibility
    extra = 1
    fields = ("equipment_brand", "equipment_model", "year_from", "year_to", "notes")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "parent", "order", "is_active")
    list_filter = ("is_active", "parent")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}
    ordering = ("order", "name")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "sku", "name", "category", "formatted_price",
        "stock_badge", "ncm_code", "is_active", "is_featured"
    )
    list_filter = ("category", "is_active", "is_featured")
    search_fields = ("sku", "name", "ncm_code", "description")
    readonly_fields = ("id", "slug", "created_at", "updated_at", "search_vector", "image_preview")
    prepopulated_fields = {}
    inlines = [PartCompatibilityInline]
    list_per_page = 50
    fieldsets = (
        ("Identificação", {
            "fields": ("id", "sku", "name", "slug", "category", "description")
        }),
        ("Imagem", {
            "fields": ("image_preview", "image", "image_url")
        }),
        ("Preços", {
            "fields": ("base_price", "unit")
        }),
        ("Fiscal", {
            "fields": ("ncm_code", "cest_code")
        }),
        ("Estoque", {
            "fields": ("stock_qty", "min_stock_alert", "weight_kg")
        }),
        ("Status", {
            "fields": ("is_active", "is_featured")
        }),
        ("Metadados", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )
    actions = ["mark_featured", "mark_active", "mark_inactive"]

    @admin.display(description="Preço base")
    def formatted_price(self, obj):
        return f"R$ {obj.base_price:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    @admin.display(description="Estoque")
    def stock_badge(self, obj):
        if obj.stock_qty == 0:
            color, bg = "#991b1b", "#fee2e2"
            label = "Sem estoque"
        elif obj.is_low_stock:
            color, bg = "#92400e", "#fef3c7"
            label = f"Baixo ({obj.stock_qty})"
        else:
            color, bg = "#065f46", "#d1fae5"
            label = str(obj.stock_qty)
        return format_html(
            '<span style="background:{};color:{};padding:2px 8px;border-radius:99px;font-size:11px;font-weight:500">{}</span>',
            bg, color, label
        )

    @admin.display(description="Prévia da imagem")
    def image_preview(self, obj):
        url = obj.display_image
        if url:
            return format_html('<img src="{}" style="max-height:80px;border-radius:6px;" />', url)
        return "—"

    @admin.action(description="Marcar como destaque")
    def mark_featured(self, request, queryset):
        queryset.update(is_featured=True)

    @admin.action(description="Ativar produtos")
    def mark_active(self, request, queryset):
        queryset.update(is_active=True)

    @admin.action(description="Desativar produtos")
    def mark_inactive(self, request, queryset):
        queryset.update(is_active=False)
