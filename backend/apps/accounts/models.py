import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email é obrigatório")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", User.Role.ADMIN)
        return self.create_user(email, password, **extra_fields)


class Company(models.Model):
    class Tier(models.TextChoices):
        CONSUMIDOR = "consumidor", "Consumidor Final"
        REVENDEDOR = "revendedor", "Revendedor"
        DISTRIBUIDOR = "distribuidor", "Distribuidor"

    # Max discount allowed per tier — enforced at API level
    MAX_DISCOUNT_BY_TIER = {
        Tier.CONSUMIDOR: 10,
        Tier.REVENDEDOR: 15,
        Tier.DISTRIBUIDOR: 20,
    }

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cnpj = models.CharField("CNPJ", max_length=18, unique=True)
    razao_social = models.CharField("Razão Social", max_length=255)
    nome_fantasia = models.CharField("Nome Fantasia", max_length=255, blank=True)
    tier = models.CharField("Tier", max_length=20, choices=Tier.choices, default=Tier.CONSUMIDOR)
    price_list = models.ForeignKey(
        "pricing.PriceList",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="companies",
        verbose_name="Tabela de preços",
    )

    # Contact
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)

    # Address
    cep = models.CharField("CEP", max_length=9, blank=True)
    street = models.CharField("Logradouro", max_length=255, blank=True)
    number = models.CharField("Número", max_length=20, blank=True)
    complement = models.CharField("Complemento", max_length=100, blank=True)
    neighborhood = models.CharField("Bairro", max_length=100, blank=True)
    city = models.CharField("Cidade", max_length=100, blank=True)
    state = models.CharField("UF", max_length=2, blank=True)

    # Fiscal
    ie = models.CharField("Inscrição Estadual", max_length=30, blank=True)
    is_mei = models.BooleanField("MEI", default=False)

    # B2B terms
    credit_limit = models.DecimalField("Limite de crédito", max_digits=12, decimal_places=2, default=0)
    payment_terms = models.CharField(
        "Prazo de pagamento",
        max_length=20,
        choices=[
            ("immediate", "À vista"),
            ("net_30", "30 dias"),
            ("net_60", "60 dias"),
            ("net_90", "90 dias"),
        ],
        default="immediate",
    )

    is_active = models.BooleanField("Ativo", default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Empresa"
        verbose_name_plural = "Empresas"
        ordering = ["razao_social"]

    def __str__(self):
        return f"{self.razao_social} ({self.cnpj})"

    @property
    def max_discount(self):
        return self.MAX_DISCOUNT_BY_TIER.get(self.tier, 10)

    @property
    def display_name(self):
        return self.nome_fantasia or self.razao_social


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        ADMIN = "admin", "Administrador"
        SALESMAN = "salesman", "Vendedor"
        CLIENT = "client", "Cliente"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField("E-mail", unique=True)
    full_name = models.CharField("Nome completo", max_length=255)
    role = models.CharField("Perfil", max_length=20, choices=Role.choices, default=Role.CLIENT)

    # Links
    company = models.ForeignKey(
        Company,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
        verbose_name="Empresa",
    )
    # Salesman's assigned clients
    assigned_companies = models.ManyToManyField(
        Company,
        blank=True,
        related_name="salesmen",
        verbose_name="Clientes atribuídos",
    )

    phone = models.CharField("Telefone", max_length=20, blank=True)
    is_active = models.BooleanField("Ativo", default=True)
    is_staff = models.BooleanField("Staff", default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    objects = UserManager()

    class Meta:
        verbose_name = "Usuário"
        verbose_name_plural = "Usuários"
        ordering = ["full_name"]

    def __str__(self):
        return f"{self.full_name} <{self.email}>"

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_salesman(self):
        return self.role == self.Role.SALESMAN

    @property
    def is_client(self):
        return self.role == self.Role.CLIENT
