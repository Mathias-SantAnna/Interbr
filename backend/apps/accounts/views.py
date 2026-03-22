from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Company
from .serializers import (
    UserSerializer, RegisterSerializer,
    CompanySerializer, CompanyLightSerializer,
    SalesmanClientRequestSerializer,
)


class RegisterView(generics.CreateAPIView):
    """POST /api/v1/auth/register/ — create Company + User."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            "user": UserSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def me(request):
    """GET /api/v1/auth/me/ — current user profile."""
    return Response(UserSerializer(request.user).data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def my_company(request):
    """GET /api/v1/auth/me/company/ — current user's company."""
    if not request.user.company:
        return Response({"detail": "Usuário sem empresa vinculada."}, status=404)
    return Response(CompanySerializer(request.user.company).data)


class SalesmanClientListView(generics.ListAPIView):
    """GET /api/v1/auth/my-clients/ — salesman's assigned companies."""
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_salesman:
            return user.assigned_companies.filter(is_active=True).order_by("razao_social")
        if user.is_admin:
            return Company.objects.filter(is_active=True).order_by("razao_social")
        return Company.objects.none()


class SalesmanRequestClientView(generics.CreateAPIView):
    """POST /api/v1/auth/salesman/request-client/ — salesman registers a new client pending admin approval."""
    serializer_class = SalesmanClientRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        if not (request.user.is_salesman or request.user.is_admin):
            return Response({"detail": "Apenas vendedores podem solicitar cadastro de clientes."}, status=403)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        company = serializer.save()
        return Response({
            "detail": f"Solicitacao de cadastro para '{company.razao_social}' enviada para aprovacao. Um administrador sera notificado.",
            "company_id": str(company.id),
            "cnpj": company.cnpj,
            "razao_social": company.razao_social,
        }, status=status.HTTP_201_CREATED)
