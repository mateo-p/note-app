from .base import *  # noqa

DEBUG = True

ALLOWED_HOSTS = ['*']

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://frontend:3000',
]
CORS_ALLOW_CREDENTIALS = True

AUTH_COOKIE_SECURE = False
