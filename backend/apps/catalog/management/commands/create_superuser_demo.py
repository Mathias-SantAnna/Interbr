from django.core.management.base import BaseCommand
from apps.accounts.models import User


class Command(BaseCommand):
    help = "Create the demo admin superuser (admin@interbrasil.com.br / admin123)"

    def handle(self, *args, **options):
        email = "admin@interbrasil.com.br"
        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f"User {email} already exists."))
            return
        user = User.objects.create_superuser(
            email=email,
            password="admin123",
            full_name="Admin InterBR",
        )
        self.stdout.write(self.style.SUCCESS(
            f"Superuser created: {email} / admin123"
        ))
