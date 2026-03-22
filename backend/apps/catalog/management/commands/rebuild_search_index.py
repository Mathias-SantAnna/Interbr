from django.core.management.base import BaseCommand
from django.contrib.postgres.search import SearchVector
from apps.catalog.models import Product


class Command(BaseCommand):
    help = "Rebuild PostgreSQL full-text search vectors for all products"

    def handle(self, *args, **options):
        self.stdout.write("Rebuilding search vectors...")
        Product.objects.update(
            search_vector=(
                SearchVector("name", weight="A", config="portuguese") +
                SearchVector("sku", weight="A", config="portuguese") +
                SearchVector("description", weight="B", config="portuguese")
            )
        )
        count = Product.objects.count()
        self.stdout.write(self.style.SUCCESS(
            f"Done. Updated {count} products."
        ))
