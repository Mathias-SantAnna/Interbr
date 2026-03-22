from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Company, User
from .serializers import CompanySerializer, UserSerializer


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin


class AdminCompanyViewSet(viewsets.ModelViewSet):
    serializer_class = CompanySerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = Company.objects.all().order_by("razao_social")
        q = self.request.query_params.get("q", "").strip()
        if q:
            from django.db.models import Q
            qs = qs.filter(
                Q(razao_social__icontains=q) |
                Q(nome_fantasia__icontains=q) |
                Q(cnpj__icontains=q)
            )
        tier = self.request.query_params.get("tier")
        if tier:
            qs = qs.filter(tier=tier)
        return qs

    @action(detail=True, methods=["post"])
    def assign_salesman(self, request, pk=None):
        company = self.get_object()
        salesman_id = request.data.get("salesman_id")
        if not salesman_id:
            return Response({"salesman_id": "Obrigatório."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            salesman = User.objects.get(pk=salesman_id, role=User.Role.SALESMAN)
        except User.DoesNotExist:
            return Response({"salesman_id": "Vendedor não encontrado."}, status=404)
        salesman.assigned_companies.add(company)
        return Response({"detail": f"{salesman.full_name} atribuído a {company.display_name}."})

    @action(detail=True, methods=["post"])
    def remove_salesman(self, request, pk=None):
        company = self.get_object()
        salesman_id = request.data.get("salesman_id")
        try:
            salesman = User.objects.get(pk=salesman_id)
        except User.DoesNotExist:
            return Response({"salesman_id": "Vendedor não encontrado."}, status=404)
        salesman.assigned_companies.remove(company)
        return Response({"detail": "Vendedor removido."})


class AdminUserViewSet(viewsets.ReadOnlyModelViewSet):
    """List users (read-only) — for salesman dropdown in company assignment."""
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = User.objects.select_related("company").order_by("full_name")
        role = self.request.query_params.get("role")
        if role:
            qs = qs.filter(role=role)
        return qs
