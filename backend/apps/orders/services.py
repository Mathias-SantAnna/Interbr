"""
Order service layer — all business logic lives here, not in views.
Views call these functions. Celery tasks call these functions.
"""
from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ValidationError

from apps.orders.models import Order, OrderItem
from apps.catalog.models import Product
from apps.pricing.models import PromoCode


def calculate_freight(cep: str, items: list) -> Decimal:
    """
    Flat-rate freight by Brazilian region (CEP prefix).
    Replace with Correios API post-MVP.
    """
    if not cep or not items:
        return Decimal("0")

    prefix = int(cep[:2])
    # SP + RJ + MG + ES (Sudeste)
    if prefix <= 28:
        rate = Decimal("35.00")
    # PR + SC + RS (Sul)
    elif prefix <= 39:
        rate = Decimal("42.00")
    # BA + SE + AL + PE + PB + RN + CE + PI + MA (Nordeste)
    elif prefix <= 65:
        rate = Decimal("75.00")
    # GO + TO + MT + MS + DF (Centro-Oeste)
    elif prefix <= 79:
        rate = Decimal("55.00")
    # AM + PA + AC + RR + RO + AP (Norte)
    else:
        rate = Decimal("89.00")

    # Heavy orders get a small surcharge
    total_weight = sum(
        (item.get("weight_kg", 0) * item.get("quantity", 1)) for item in items
    )
    if total_weight > 20:
        rate += Decimal("25.00")

    return rate


@transaction.atomic
def create_order(
    placed_by,
    company,
    cart_items: list,
    payment_method: str,
    delivery_address: dict,
    discount_pct: float = 0,
    discount_note: str = "",
    promo_code_str: str = "",
) -> Order:
    """
    Creates an Order from a cart.
    Works for both Track A (salesman) and Track B (client self-serve).

    cart_items: [{"product_id": uuid, "quantity": int}, ...]
    """
    # 1. Validate discount cap
    max_allowed = company.max_discount
    if discount_pct > max_allowed:
        raise ValidationError(
            f"Desconto máximo para {company.tier}: {max_allowed}%"
        )

    # 2. Validate and lock products (select_for_update prevents race conditions)
    product_ids = [item["product_id"] for item in cart_items]
    products = {
        str(p.id): p
        for p in Product.objects.select_for_update().filter(
            id__in=product_ids, is_active=True
        )
    }

    for item in cart_items:
        pid = str(item["product_id"])
        if pid not in products:
            raise ValidationError(f"Produto não encontrado: {pid}")
        product = products[pid]
        if product.stock_qty < item["quantity"]:
            raise ValidationError(
                f"Estoque insuficiente para '{product.name}': "
                f"solicitado {item['quantity']}, disponível {product.stock_qty}"
            )

    # 3. Calculate freight
    freight = calculate_freight(
        delivery_address.get("cep", ""),
        [
            {
                "weight_kg": float(products[str(i["product_id"])].weight_kg),
                "quantity": i["quantity"],
            }
            for i in cart_items
        ],
    )

    # 4. Resolve promo code
    promo = None
    promo_discount = Decimal("0")
    if promo_code_str:
        try:
            promo = PromoCode.objects.get(code=promo_code_str.upper())
            if not promo.is_valid:
                raise ValidationError(f"Código '{promo_code_str}' inválido ou expirado.")
        except PromoCode.DoesNotExist:
            raise ValidationError(f"Código '{promo_code_str}' não encontrado.")

    # 5. Create the Order header
    order = Order(
        placed_by=placed_by,
        on_behalf_of=company,
        payment_method=payment_method,
        discount_pct=Decimal(str(discount_pct)),
        discount_note=discount_note,
        discount_by=placed_by if discount_pct > 0 else None,
        promo_code=promo,
        freight_cost=freight,
        **delivery_address,
    )
    order.full_clean()
    order.save()

    # 6. Create OrderItems and deduct stock
    for item in cart_items:
        pid = str(item["product_id"])
        product = products[pid]
        qty = item["quantity"]
        unit_price = product.price_for(company)

        OrderItem.objects.create(
            order=order,
            product=product,
            quantity=qty,
            unit_price=unit_price,
        )

        # Reserve stock immediately
        Product.objects.filter(id=product.id).update(
            stock_qty=product.stock_qty - qty
        )

    # 7. Calculate and save promo discount now that items exist
    if promo:
        promo_discount = promo.calculate_discount(order.subtotal)
        if promo.discount_type == PromoCode.DiscountType.FREE_SHIPPING:
            promo_discount = freight
        order.promo_discount_amount = promo_discount
        order.save(update_fields=["promo_discount_amount"])
        PromoCode.objects.filter(id=promo.id).update(
            uses_count=promo.uses_count + 1
        )

    return order
