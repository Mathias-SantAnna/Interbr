from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User, Company


class UserInline(admin.TabularInline):
    model = User
    extra = 0
    fields = ("full_name", "email", "role", "is_active")
    readonly_fields = ("email",)
    show_change_link = True


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = (
        "razao_social", "cnpj", "tier_badge", "city", "state",
        "credit_limit", "payment_terms", "is_active"
    )
    list_filter = ("tier", "state", "is_active", "payment_terms")
    search_fields = ("razao_social", "nome_fantasia", "cnpj")
    readonly_fields = ("id", "created_at", "updated_at")
    inlines = [UserInline]
    fieldsets = (
        ("Dados da empresa", {
            "fields": ("id", "cnpj", "razao_social", "nome_fantasia", "tier", "price_list")
        }),
        ("Contato", {
            "fields": ("email", "phone")
        }),
        ("Endereço", {
            "fields": ("cep", "street", "number", "complement", "neighborhood", "city", "state"),
            "classes": ("collapse",),
        }),
        ("Fiscal", {
            "fields": ("ie", "is_mei"),
            "classes": ("collapse",),
        }),
        ("Termos comerciais", {
            "fields": ("credit_limit", "payment_terms", "is_active")
        }),
        ("Datas", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    @admin.display(description="Tier")
    def tier_badge(self, obj):
        colors = {
            "distribuidor": ("#d1fae5", "#065f46"),
            "revendedor": ("#dbeafe", "#1e40af"),
            "consumidor": ("#fef3c7", "#92400e"),
        }
        bg, fg = colors.get(obj.tier, ("#f3f4f6", "#374151"))
        return format_html(
            '<span style="background:{};color:{};padding:2px 8px;border-radius:99px;font-size:11px;font-weight:500">{}</span>',
            bg, fg, obj.get_tier_display()
        )


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("full_name", "email", "role_badge", "company", "is_active", "created_at")
    list_filter = ("role", "is_active", "is_staff")
    search_fields = ("full_name", "email")
    readonly_fields = ("id", "created_at", "updated_at", "last_login")
    ordering = ("full_name",)
    filter_horizontal = ("assigned_companies", "groups", "user_permissions")
    fieldsets = (
        ("Dados pessoais", {"fields": ("id", "full_name", "email", "phone")}),
        ("Perfil", {"fields": ("role", "company", "assigned_companies")}),
        ("Acesso", {"fields": ("password", "is_active", "is_staff", "is_superuser")}),
        ("Permissões", {
            "fields": ("groups", "user_permissions"),
            "classes": ("collapse",),
        }),
        ("Datas", {
            "fields": ("last_login", "created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("full_name", "email", "role", "company", "password1", "password2"),
        }),
    )

    @admin.display(description="Perfil")
    def role_badge(self, obj):
        colors = {
            "admin": ("#fee2e2", "#991b1b"),
            "salesman": ("#ede9fe", "#5b21b6"),
            "client": ("#f0fdf4", "#166534"),
        }
        bg, fg = colors.get(obj.role, ("#f3f4f6", "#374151"))
        return format_html(
            '<span style="background:{};color:{};padding:2px 8px;border-radius:99px;font-size:11px;font-weight:500">{}</span>',
            bg, fg, obj.get_role_display()
        )
