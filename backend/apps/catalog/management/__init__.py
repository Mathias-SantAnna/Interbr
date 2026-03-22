"""
python manage.py rebuild_search_index

Updates the PostgreSQL full-text search vector on every Product.
Run once after loaddata, then on a Celery beat schedule (e.g. nightly).
"""
from django.core.management.base import BaseCommand
from django.contrib.postgres.search import SearchVector
from apps.catalog.models import Product


class Command(BaseCommand):
    help = "Rebuild the PostgreSQL full-text search vector for all products"

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
        self.stdout.write(
            self.style.SUCCESS(f"Done. Updated search vectors for {count} products.")
        )
