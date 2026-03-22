from django.contrib import admin
from django.utils.html import format_html
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "quantity", "unit_price", "line_total")
    fields = ("product", "quantity", "unit_price", "line_total")

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number", "client_name", "placed_by_name",
        "status_badge", "formatted_total", "discount_display",
        "nfe_status_badge", "created_at"
    )
    list_filter = ("status", "payment_method", "nfe_status", "created_at")
    search_fields = (
        "order_number", "on_behalf_of__razao_social",
        "placed_by__full_name", "nfe_key", "mp_payment_id"
    )
    readonly_fields = (
        "id", "order_number", "subtotal_display", "discount_amount_display",
        "total_display", "created_at", "updated_at", "paid_at",
        "nfe_emitted_at", "shipped_at", "delivered_at",
    )
    inlines = [OrderItemInline]
    list_per_page = 30
    date_hierarchy = "created_at"
    fieldsets = (
        ("Pedido", {
            "fields": ("id", "order_number", "placed_by", "on_behalf_of", "status")
        }),
        ("Valores", {
            "fields": (
                "subtotal_display", "discount_pct", "discount_note", "discount_by",
                "promo_code", "promo_discount_amount",
                "freight_cost", "discount_amount_display", "total_display"
            )
        }),
        ("Pagamento", {
            "fields": ("payment_method", "mp_preference_id", "mp_payment_id", "payment_link", "paid_at")
        }),
        ("Entrega", {
            "fields": (
                "delivery_cep", "delivery_street", "delivery_number",
                "delivery_complement", "delivery_neighborhood",
                "delivery_city", "delivery_state",
                "tracking_code", "shipped_at", "delivered_at"
            ),
            "classes": ("collapse",),
        }),
        ("NF-e", {
            "fields": ("nfe_key", "nfe_pdf_url", "nfe_xml_url", "nfe_status", "nfe_emitted_at"),
            "classes": ("collapse",),
        }),
        ("Notas", {
            "fields": ("internal_notes",),
            "classes": ("collapse",),
        }),
        ("Datas", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    @admin.display(description="Cliente")
    def client_name(self, obj):
        return obj.on_behalf_of.display_name

    @admin.display(description="Colocado por")
    def placed_by_name(self, obj):
        return obj.placed_by.full_name

    @admin.display(description="Status")
    def status_badge(self, obj):
        colors = {
            "draft": ("#f3f4f6", "#374151"),
            "pending_payment": ("#fef3c7", "#92400e"),
            "paid": ("#dbeafe", "#1e40af"),
            "invoiced": ("#ede9fe", "#5b21b6"),
            "shipped": ("#e0f2fe", "#0369a1"),
            "delivered": ("#d1fae5", "#065f46"),
            "cancelled": ("#fee2e2", "#991b1b"),
        }
        bg, fg = colors.get(obj.status, ("#f3f4f6", "#374151"))
        return format_html(
            '<span style="background:{};color:{};padding:2px 8px;border-radius:99px;font-size:11px;font-weight:500">{}</span>',
            bg, fg, obj.get_status_display()
        )

    @admin.display(description="Total")
    def formatted_total(self, obj):
        return f"R$ {obj.total:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    @admin.display(description="Desconto")
    def discount_display(self, obj):
        if obj.discount_pct > 0:
            return format_html(
                '<span style="color:#065f46;font-weight:500">{}%</span>',
                obj.discount_pct
            )
        return "—"

    @admin.display(description="NF-e")
    def nfe_status_badge(self, obj):
        if not obj.nfe_status:
            return "—"
        colors = {
            "pending": ("#f3f4f6", "#374151"),
            "processing": ("#fef3c7", "#92400e"),
            "authorized": ("#d1fae5", "#065f46"),
            "error": ("#fee2e2", "#991b1b"),
        }
        bg, fg = colors.get(obj.nfe_status, ("#f3f4f6", "#374151"))
        return format_html(
            '<span style="background:{};color:{};padding:2px 8px;border-radius:99px;font-size:11px">{}</span>',
            bg, fg, obj.nfe_status
        )

    @admin.display(description="Subtotal")
    def subtotal_display(self, obj):
        return f"R$ {obj.subtotal:,.2f}"

    @admin.display(description="Desconto (R$)")
    def discount_amount_display(self, obj):
        return f"R$ {obj.discount_amount:,.2f}"

    @admin.display(description="Total")
    def total_display(self, obj):
        return f"R$ {obj.total:,.2f}"
