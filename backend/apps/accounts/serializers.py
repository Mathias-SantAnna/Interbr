from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Company


class CompanyLightSerializer(serializers.ModelSerializer):
    """Minimal company info — used nested inside UserSerializer."""
    tier_display = serializers.CharField(source="get_tier_display", read_only=True)
    max_discount = serializers.IntegerField(read_only=True)

    class Meta:
        model = Company
        fields = ("id", "cnpj", "razao_social", "nome_fantasia", "tier",
                  "tier_display", "max_discount", "city", "state")


class UserSerializer(serializers.ModelSerializer):
    company = CompanyLightSerializer(read_only=True)
    role_display = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = User
        fields = (
            "id", "email", "full_name", "role", "role_display",
            "company", "phone", "is_active", "created_at"
        )
        read_only_fields = ("id", "created_at")


class RegisterSerializer(serializers.Serializer):
    """Client self-registration — creates Company + User in one call."""
    # Company fields
    cnpj = serializers.CharField(max_length=18)
    razao_social = serializers.CharField(max_length=255)
    nome_fantasia = serializers.CharField(max_length=255, required=False, allow_blank=True)
    company_email = serializers.EmailField()
    company_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    cep = serializers.CharField(max_length=9, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    state = serializers.CharField(max_length=2, required=False, allow_blank=True)

    # User fields
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError({"password_confirm": "As senhas não coincidem."})
        if User.objects.filter(email=attrs["email"]).exists():
            raise serializers.ValidationError({"email": "Este e-mail já está cadastrado."})
        cnpj_clean = attrs["cnpj"].replace(".", "").replace("/", "").replace("-", "")
        if Company.objects.filter(cnpj=attrs["cnpj"]).exists() or \
           Company.objects.filter(cnpj=cnpj_clean).exists():
            raise serializers.ValidationError({"cnpj": "Este CNPJ já está cadastrado."})
        return attrs

    def create(self, validated_data):
        from django.db import transaction
        with transaction.atomic():
            company = Company.objects.create(
                cnpj=validated_data["cnpj"],
                razao_social=validated_data["razao_social"],
                nome_fantasia=validated_data.get("nome_fantasia", ""),
                email=validated_data["company_email"],
                phone=validated_data.get("company_phone", ""),
                cep=validated_data.get("cep", ""),
                city=validated_data.get("city", ""),
                state=validated_data.get("state", ""),
            )
            user = User.objects.create_user(
                email=validated_data["email"],
                password=validated_data["password"],
                full_name=validated_data["full_name"],
                role=User.Role.CLIENT,
                company=company,
            )
        return user



class SalesmanClientRequestSerializer(serializers.Serializer):
    """Salesman submits a new client company for admin approval (is_active=False)."""
    cnpj = serializers.CharField(max_length=18)
    razao_social = serializers.CharField(max_length=255)
    nome_fantasia = serializers.CharField(max_length=255, required=False, allow_blank=True)
    company_email = serializers.EmailField(required=False, allow_blank=True)
    company_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    cep = serializers.CharField(max_length=9, required=False, allow_blank=True)
    street = serializers.CharField(max_length=255, required=False, allow_blank=True)
    number = serializers.CharField(max_length=20, required=False, allow_blank=True)
    neighborhood = serializers.CharField(max_length=100, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    state = serializers.CharField(max_length=2, required=False, allow_blank=True)
    tier = serializers.ChoiceField(choices=Company.Tier.choices, default=Company.Tier.CONSUMIDOR)
    notes = serializers.CharField(max_length=1000, required=False, allow_blank=True)

    def validate_cnpj(self, value):
        cnpj_clean = value.replace(".", "").replace("/", "").replace("-", "")
        if Company.objects.filter(cnpj=value).exists() or Company.objects.filter(cnpj=cnpj_clean).exists():
            raise serializers.ValidationError("Este CNPJ ja esta cadastrado.")
        return value

    def create(self, validated_data):
        validated_data.pop("notes", "")
        salesman = self.context["request"].user
        company = Company.objects.create(
            cnpj=validated_data["cnpj"],
            razao_social=validated_data["razao_social"],
            nome_fantasia=validated_data.get("nome_fantasia", ""),
            email=validated_data.get("company_email", ""),
            phone=validated_data.get("company_phone", ""),
            cep=validated_data.get("cep", ""),
            street=validated_data.get("street", ""),
            number=validated_data.get("number", ""),
            neighborhood=validated_data.get("neighborhood", ""),
            city=validated_data.get("city", ""),
            state=validated_data.get("state", ""),
            tier=validated_data.get("tier", Company.Tier.CONSUMIDOR),
            is_active=False,
        )
        salesman.assigned_companies.add(company)
        return company


class CompanySerializer(serializers.ModelSerializer):
    tier_display = serializers.CharField(source="get_tier_display", read_only=True)
    max_discount = serializers.IntegerField(read_only=True)
    display_name = serializers.CharField(read_only=True)
    payment_terms_display = serializers.CharField(
        source="get_payment_terms_display", read_only=True
    )

    class Meta:
        model = Company
        fields = (
            "id", "cnpj", "razao_social", "nome_fantasia", "display_name",
            "tier", "tier_display", "max_discount",
            "email", "phone",
            "cep", "street", "number", "complement",
            "neighborhood", "city", "state",
            "ie", "is_mei",
            "credit_limit", "payment_terms", "payment_terms_display",
            "is_active", "created_at",
        )
        read_only_fields = ("id", "max_discount", "display_name", "created_at")
