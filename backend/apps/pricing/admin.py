from django.contrib import admin
from django.utils.html import format_html
from .models import PriceList, PriceListItem, PromoCode


class PriceListItemInline(admin.TabularInline):
    model = PriceListItem
    extra = 1
    fields = ("product", "price")
    autocomplete_fields = ("product",)


@admin.register(PriceList)
class PriceListAdmin(admin.ModelAdmin):
    list_display = ("name", "global_discount_pct", "valid_from", "valid_until", "companies_count", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name",)
    readonly_fields = ("id", "created_at")
    inlines = [PriceListItemInline]
    fieldsets = (
        ("Tabela", {"fields": ("id", "name", "description", "global_discount_pct")}),
        ("Validade", {"fields": ("valid_from", "valid_until", "is_active")}),
        ("Datas", {"fields": ("created_at",), "classes": ("collapse",)}),
    )

    @admin.display(description="Empresas")
    def companies_count(self, obj):
        count = obj.companies.count()
        return format_html(
            '<span style="font-weight:500">{}</span> empresa{}',
            count, "s" if count != 1 else ""
        )


@admin.register(PromoCode)
class PromoCodeAdmin(admin.ModelAdmin):
    list_display = (
        "code", "discount_type", "discount_value", "uses_count",
        "max_uses", "valid_until", "validity_badge", "is_active"
    )
    list_filter = ("discount_type", "is_active")
    search_fields = ("code", "description")
    readonly_fields = ("id", "uses_count", "created_at")
    fieldsets = (
        ("Código", {"fields": ("id", "code", "description", "is_active")}),
        ("Desconto", {"fields": ("discount_type", "discount_value")}),
        ("Restrições", {"fields": ("min_order_value", "max_uses", "uses_count", "category")}),
        ("Validade", {"fields": ("valid_from", "valid_until")}),
        ("Datas", {"fields": ("created_at",), "classes": ("collapse",)}),
    )

    @admin.display(description="Válido")
    def validity_badge(self, obj):
        if obj.is_valid:
            return format_html(
                '<span style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:99px;font-size:11px">Ativo</span>'
            )
        return format_html(
            '<span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:99px;font-size:11px">Inativo</span>'
        )
