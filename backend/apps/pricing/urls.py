from django.urls import path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import PriceList
from rest_framework import serializers


class PriceListSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import PriceList
        model = PriceList
        fields = ("id", "name", "global_discount_pct")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def price_lists(request):
    from .models import PriceList
    qs = PriceList.objects.filter(is_active=True)
    return Response(PriceListSerializer(qs, many=True).data)


urlpatterns = [
    path("", price_lists, name="price_lists"),
]
