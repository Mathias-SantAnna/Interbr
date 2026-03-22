from django.contrib import admin
from django.utils.html import format_html
from .models import NFeEmission


@admin.register(NFeEmission)
class NFeEmissionAdmin(admin.ModelAdmin):
    list_display = (
        "order_number", "status_badge", "access_key_short",
        "attempts", "emitted_at", "created_at"
    )
    list_filter = ("status",)
    search_fields = ("order__order_number", "access_key", "focus_nfe_ref")
    readonly_fields = (
        "id", "order", "focus_nfe_ref", "access_key",
        "pdf_url", "xml_url", "attempts", "emitted_at",
        "created_at", "updated_at"
    )
    fieldsets = (
        ("Emissão", {
            "fields": ("id", "order", "status", "focus_nfe_ref", "attempts")
        }),
        ("Resultado", {
            "fields": ("access_key", "pdf_url", "xml_url", "emitted_at")
        }),
        ("Erro", {
            "fields": ("error_message",),
            "classes": ("collapse",),
        }),
        ("Datas", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    def has_add_permission(self, request):
        return False

    @admin.display(description="Pedido")
    def order_number(self, obj):
        return f"#{obj.order.order_number}"

    @admin.display(description="Status")
    def status_badge(self, obj):
        colors = {
            "pending": ("#fef3c7", "#92400e"),
            "processing": ("#dbeafe", "#1e40af"),
            "authorized": ("#d1fae5", "#065f46"),
            "error": ("#fee2e2", "#991b1b"),
            "cancelled": ("#f3f4f6", "#374151"),
        }
        bg, fg = colors.get(obj.status, ("#f3f4f6", "#374151"))
        return format_html(
            '<span style="background:{};color:{};padding:2px 8px;border-radius:99px;font-size:11px;font-weight:500">{}</span>',
            bg, fg, obj.get_status_display()
        )

    @admin.display(description="Chave (parcial)")
    def access_key_short(self, obj):
        if obj.access_key:
            return f"{obj.access_key[:8]}…{obj.access_key[-4:]}"
        return "—"
