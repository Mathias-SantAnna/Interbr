"""
Generates a realistic-looking DANFE PDF locally using ReportLab.
Used for demo/staging — no external fiscal service required.
"""
import io
import random
import string

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
)


def _fake_key() -> str:
    """Generate a 44-digit fake NF-e access key."""
    return "".join(random.choices(string.digits, k=44))


def _fmt_key(key: str) -> str:
    """Format key as groups of 4 digits for readability."""
    return " ".join(key[i:i+4] for i in range(0, len(key), 4))


def generate_mock_danfe(order) -> bytes:
    """
    Generates a realistic DANFE PDF for demo purposes.
    Returns raw PDF bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=10 * mm,
        bottomMargin=10 * mm,
        leftMargin=10 * mm,
        rightMargin=10 * mm,
    )
    styles = getSampleStyleSheet()
    small = ParagraphStyle("small", parent=styles["Normal"], fontSize=7, leading=9)
    tiny  = ParagraphStyle("tiny",  parent=styles["Normal"], fontSize=6, leading=8)

    elements = []
    W = 190 * mm  # usable page width

    fake_key = _fake_key()

    # ── HEADER ────────────────────────────────────────────────────────────────
    header_data = [
        [
            Paragraph("<b>INTERBRASIL DISTRIBUIDORA LTDA</b><br/>"
                      "CNPJ: 37.628.401/0001-09<br/>"
                      "IE: 07.301.201/001-82<br/>"
                      "SIA Trecho 17, Rua 11, Lt 01/02 — Brasília/DF<br/>"
                      "CEP 71200-170", small),
            Paragraph("<b>NF-e</b><br/>DANFE<br/>"
                      "Documento Auxiliar da<br/>Nota Fiscal Eletrônica", small),
            Paragraph(f"<b>N°:</b> {order.order_number}<br/>"
                      f"<b>Série:</b> 001<br/><br/>"
                      f"<font color='red'><b>HOMOLOGAÇÃO<br/>SEM VALOR FISCAL</b></font>", small),
        ]
    ]
    header_table = Table(header_data, colWidths=[95 * mm, 55 * mm, 40 * mm])
    header_table.setStyle(TableStyle([
        ("BOX",       (0, 0), (-1, -1), 1,   colors.black),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("VALIGN",    (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN",     (1, 0), (1,  0),  "CENTER"),
        ("ALIGN",     (2, 0), (2,  0),  "CENTER"),
        ("PADDING",   (0, 0), (-1, -1), 5),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 3 * mm))

    # ── ACCESS KEY ────────────────────────────────────────────────────────────
    key_data = [
        [Paragraph("<b>CHAVE DE ACESSO</b>", small)],
        [Paragraph(_fmt_key(fake_key), small)],
    ]
    key_table = Table(key_data, colWidths=[W])
    key_table.setStyle(TableStyle([
        ("BOX",    (0, 0), (-1, -1), 1,   colors.black),
        ("ALIGN",  (0, 0), (-1, -1), "CENTER"),
        ("PADDING",(0, 0), (-1, -1), 3),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f0f0f0")),
    ]))
    elements.append(key_table)
    elements.append(Spacer(1, 3 * mm))

    # ── EMITENTE / DESTINATÁRIO ───────────────────────────────────────────────
    company = order.on_behalf_of
    # Resolve delivery address (use order delivery fields; fall back to company)
    dest_street = (order.delivery_street or company.street or "—")
    dest_number = (order.delivery_number or company.number or "S/N")
    dest_neighborhood = (order.delivery_neighborhood or company.neighborhood or "")
    dest_city  = (order.delivery_city  or company.city  or "—")
    dest_state = (order.delivery_state or company.state or "—")
    dest_cep   = (order.delivery_cep   or company.cep   or "")

    parties_data = [
        [
            Paragraph("<b>DESTINATÁRIO / REMETENTE</b>", small),
            "",
            "",
        ],
        [
            Paragraph(f"<b>Nome/Razão Social:</b> {company.razao_social}", small),
            Paragraph(f"<b>CNPJ:</b> {company.cnpj}", small),
            Paragraph(f"<b>Data Emissão:</b><br/>{order.created_at.strftime('%d/%m/%Y')}", small),
        ],
        [
            Paragraph(
                f"<b>Endereço:</b> {dest_street}, {dest_number}"
                + (f" — {dest_neighborhood}" if dest_neighborhood else ""),
                small,
            ),
            Paragraph(f"<b>Município:</b> {dest_city}", small),
            Paragraph(f"<b>UF:</b> {dest_state}", small),
        ],
        [
            Paragraph(f"<b>CEP:</b> {dest_cep}", small),
            Paragraph(f"<b>E-mail:</b> {getattr(company, 'email', '') or '—'}", small),
            "",
        ],
    ]
    parties_table = Table(parties_data, colWidths=[100 * mm, 60 * mm, 30 * mm])
    parties_table.setStyle(TableStyle([
        ("BOX",        (0, 0), (-1, -1), 1,   colors.black),
        ("SPAN",       (0, 0), (-1, 0)),
        ("INNERGRID",  (0, 0), (-1, -1), 0.5, colors.grey),
        ("BACKGROUND", (0, 0), (-1, 0),  colors.HexColor("#f0f0f0")),
        ("FONTNAME",   (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("ALIGN",      (0, 0), (-1, 0),  "CENTER"),
        ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
        ("PADDING",    (0, 0), (-1, -1), 4),
    ]))
    elements.append(parties_table)
    elements.append(Spacer(1, 3 * mm))

    # ── PRODUCTS TABLE ────────────────────────────────────────────────────────
    col_widths = [8 * mm, 74 * mm, 22 * mm, 15 * mm, 12 * mm, 28 * mm, 31 * mm]
    items_data = [[
        Paragraph("<b>#</b>",       tiny),
        Paragraph("<b>Descrição do Produto</b>", tiny),
        Paragraph("<b>NCM</b>",     tiny),
        Paragraph("<b>Qtd</b>",     tiny),
        Paragraph("<b>Un</b>",      tiny),
        Paragraph("<b>V. Unit.</b>", tiny),
        Paragraph("<b>V. Total</b>", tiny),
    ]]

    order_items = list(order.items.select_related("product").all())
    for i, item in enumerate(order_items, start=1):
        items_data.append([
            Paragraph(str(i), tiny),
            Paragraph(item.product.name[:60], tiny),
            Paragraph(item.product.ncm_code or "—", tiny),
            Paragraph(str(item.quantity), tiny),
            Paragraph(item.product.unit.upper(), tiny),
            Paragraph(f"R$ {item.unit_price:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."), tiny),
            Paragraph(f"R$ {item.line_total:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."), tiny),
        ])

    items_table = Table(items_data, colWidths=col_widths, repeatRows=1)
    items_table.setStyle(TableStyle([
        ("BOX",        (0, 0), (-1, -1), 1,   colors.black),
        ("INNERGRID",  (0, 0), (-1, -1), 0.5, colors.grey),
        ("BACKGROUND", (0, 0), (-1, 0),  colors.HexColor("#f0f0f0")),
        ("ALIGN",      (3, 0), (-1, -1), "RIGHT"),
        ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
        ("PADDING",    (0, 0), (-1, -1), 3),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 3 * mm))

    # ── TOTALS ────────────────────────────────────────────────────────────────
    def brl(val) -> str:
        return f"R$ {val:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    totals_data = [
        [Paragraph("Subtotal dos produtos:",   small), Paragraph(brl(order.subtotal),  small)],
        [Paragraph("Desconto:",                small), Paragraph(brl(order.discount_amount + order.promo_discount_amount), small)],
        [Paragraph("Frete:",                   small), Paragraph(brl(order.freight_cost), small)],
        [Paragraph("<b>TOTAL DA NF-e:</b>",    small), Paragraph(f"<b>{brl(order.total)}</b>", small)],
    ]
    totals_table = Table(totals_data, colWidths=[150 * mm, 40 * mm])
    totals_table.setStyle(TableStyle([
        ("BOX",       (0, 0), (-1, -1), 1,   colors.black),
        ("LINEABOVE", (0, -1), (-1, -1), 1,  colors.black),
        ("ALIGN",     (1, 0),  (1, -1),  "RIGHT"),
        ("VALIGN",    (0, 0),  (-1, -1), "MIDDLE"),
        ("PADDING",   (0, 0),  (-1, -1), 4),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 3 * mm))

    # ── PAYMENT INFO ─────────────────────────────────────────────────────────
    payment_label = getattr(order, "payment_method_display", order.payment_method.upper())
    pay_data = [
        [Paragraph("<b>INFORMAÇÕES DE COBRANÇA</b>", small), ""],
        [Paragraph(f"<b>Forma de pagamento:</b> {payment_label}", small),
         Paragraph(f"<b>Pedido:</b> #{order.order_number}", small)],
    ]
    pay_table = Table(pay_data, colWidths=[130 * mm, 60 * mm])
    pay_table.setStyle(TableStyle([
        ("BOX",        (0, 0), (-1, -1), 1,   colors.black),
        ("SPAN",       (0, 0), (-1, 0)),
        ("INNERGRID",  (0, 0), (-1, -1), 0.5, colors.grey),
        ("BACKGROUND", (0, 0), (-1, 0),  colors.HexColor("#f0f0f0")),
        ("ALIGN",      (0, 0), (-1, 0),  "CENTER"),
        ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
        ("PADDING",    (0, 0), (-1, -1), 4),
    ]))
    elements.append(pay_table)
    elements.append(Spacer(1, 4 * mm))

    # ── FOOTER ────────────────────────────────────────────────────────────────
    elements.append(HRFlowable(width=W, thickness=0.5, color=colors.grey))
    elements.append(Spacer(1, 2 * mm))
    footer_style = ParagraphStyle(
        "footer", parent=styles["Normal"], fontSize=7, leading=10,
        textColor=colors.HexColor("#555555"), alignment=1,  # center
    )
    elements.append(Paragraph(
        "<b>NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGAÇÃO — SEM VALOR FISCAL</b><br/>"
        f"Interbrasil Distribuidora Ltda · CNPJ 37.628.401/0001-09 · "
        f"Emitida em: {order.created_at.strftime('%d/%m/%Y %H:%M')}",
        footer_style,
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer.read()
