"""
Creates an admin superuser for demo/staging environments.
Usage: python manage.py create_superuser_demo
Override credentials via env vars: DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from decouple import config

User = get_user_model()


class Command(BaseCommand):
    help = "Create a demo admin superuser (idempotent — safe to run multiple times)"

    def handle(self, *args, **options):
        email = config("DEMO_ADMIN_EMAIL", default="admin@interbr.com.br")
        password = config("DEMO_ADMIN_PASSWORD", default="InterBR@2024!")
        full_name = config("DEMO_ADMIN_NAME", default="Admin InterBR")

        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f"Admin user '{email}' already exists — skipping."))
            return

        User.objects.create_superuser(
            email=email,
            password=password,
            full_name=full_name,
        )
        self.stdout.write(self.style.SUCCESS(f"✓ Superuser '{email}' created successfully."))
        self.stdout.write(self.style.WARNING("  Change the password before going to production!"))
