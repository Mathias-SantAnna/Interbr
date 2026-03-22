import uuid
from django.db import models


class NFeEmission(models.Model):
    """Audit log of every NF-e emission attempt."""
    class Status(models.TextChoices):
        PENDING = "pending", "Pendente"
        PROCESSING = "processing", "Processando"
        AUTHORIZED = "authorized", "Autorizada"
        ERROR = "error", "Erro"
        CANCELLED = "cancelled", "Cancelada"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.OneToOneField(
        "orders.Order",
        on_delete=models.PROTECT,
        related_name="nfe_emission",
        verbose_name="Pedido",
    )
    status = models.CharField(
        "Status", max_length=20, choices=Status.choices, default=Status.PENDING
    )
    focus_nfe_ref = models.CharField("Referência Focus NFe", max_length=100, blank=True)
    access_key = models.CharField("Chave de acesso", max_length=50, blank=True)
    pdf_url = models.URLField("PDF", blank=True)
    xml_url = models.URLField("XML", blank=True)
    error_message = models.TextField("Erro", blank=True)
    attempts = models.PositiveIntegerField("Tentativas", default=0)
    emitted_at = models.DateTimeField("Emitida em", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Emissão NF-e"
        verbose_name_plural = "Emissões NF-e"
        ordering = ["-created_at"]

    def __str__(self):
        return f"NF-e #{self.order.order_number} — {self.status}"
