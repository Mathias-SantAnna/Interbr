from rest_framework import serializers
from .models import Category, Product, PartCompatibility


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ("id", "name", "slug", "description", "parent", "children",
                  "image", "product_count", "order")

    def get_children(self, obj):
        if obj.children.exists():
            return CategorySerializer(
                obj.children.filter(is_active=True), many=True, context=self.context
            ).data
        return []

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class PartCompatibilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = PartCompatibility
        fields = ("id", "equipment_brand", "equipment_model", "year_from", "year_to", "notes")


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for catalog listings."""
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    price = serializers.SerializerMethodField()
    display_image = serializers.CharField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id", "sku", "slug", "name", "category_name", "category_slug",
            "price", "base_price", "unit",
            "stock_qty", "is_low_stock",
            "display_image", "is_featured",
        )

    def get_price(self, obj):
        """Return negotiated price if a company is in context, else base_price."""
        company = self.context.get("company")
        return obj.price_for(company)


class ProductDetailSerializer(serializers.ModelSerializer):
    """Full serializer for the product detail page."""
    category = CategorySerializer(read_only=True)
    compatibilities = PartCompatibilitySerializer(many=True, read_only=True)
    price = serializers.SerializerMethodField()
    display_image = serializers.CharField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id", "sku", "slug", "name", "description",
            "category", "compatibilities",
            "price", "base_price", "unit",
            "stock_qty", "is_low_stock", "weight_kg",
            "ncm_code",
            "display_image", "image_url",
            "is_featured", "created_at",
        )

    def get_price(self, obj):
        company = self.context.get("company")
        return obj.price_for(company)
