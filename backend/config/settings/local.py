from .base import *  # noqa

DEBUG = True

ALLOWED_HOSTS = ["*"]

# Use console email in development
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Looser CORS for local dev
CORS_ALLOW_ALL_ORIGINS = True

