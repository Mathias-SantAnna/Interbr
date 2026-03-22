"""
python manage.py assign_demo_clients

Assigns demo companies to demo salesman accounts.
Run after loaddata seed.json.
"""
from django.core.management.base import BaseCommand
from apps.accounts.models import User, Company


class Command(BaseCommand):
    help = "Assign demo companies to salesman accounts after seed data load"

    def handle(self, *args, **options):
        try:
            carlos = User.objects.get(email="carlos@interbrasil.com.br")
            ana = User.objects.get(email="ana@interbrasil.com.br")
            madeiras = Company.objects.get(cnpj="12.345.678/0001-90")
            solar = Company.objects.get(cnpj="98.765.432/0001-10")
            agro = Company.objects.get(cnpj="11.222.333/0001-44")

            carlos.assigned_companies.set([madeiras, agro])
            ana.assigned_companies.set([solar])

            # Set passwords (seed.json uses unusable passwords)
            carlos.set_password("carlos123")
            carlos.save()
            ana.set_password("ana123")
            ana.save()

            # Set client user password
            joao = User.objects.get(email="compras@madeirasp.com.br")
            joao.set_password("joao123")
            joao.save()

            self.stdout.write(self.style.SUCCESS(
                "Demo assignments done.\n"
                "  Carlos Silva (carlos@interbrasil.com.br / carlos123) "
                "→ Madeiras SP, Agro CO\n"
                "  Ana Ferreira (ana@interbrasil.com.br / ana123) "
                "→ Solar Nordeste\n"
                "  João Madeira (compras@madeirasp.com.br / joao123) "
                "→ client of Madeiras SP"
            ))

        except User.DoesNotExist as e:
            self.stderr.write(
                f"User not found: {e}. Did you run loaddata seed.json first?"
            )
        except Company.DoesNotExist as e:
            self.stderr.write(
                f"Company not found: {e}. Did you run loaddata seed.json first?"
            )
