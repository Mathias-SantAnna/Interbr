from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView, TokenRefreshView, TokenBlacklistView
)
from . import views

urlpatterns = [
    path("token/", TokenObtainPairView.as_view(), name="token_obtain"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("token/logout/", TokenBlacklistView.as_view(), name="token_blacklist"),
    path("register/", views.RegisterView.as_view(), name="register"),
    path("me/", views.me, name="me"),
    path("me/company/", views.my_company, name="my_company"),
    path("my-clients/", views.SalesmanClientListView.as_view(), name="my_clients"),
    path("salesman/request-client/", views.SalesmanRequestClientView.as_view(), name="salesman_request_client"),
]
