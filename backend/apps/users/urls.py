from django.urls import re_path
from .views import SignUpView, LoginView, LogoutView, RefreshTokenView, MeView

urlpatterns = [
    re_path(r'^signup/?$', SignUpView.as_view(), name='auth-signup'),
    re_path(r'^login/?$', LoginView.as_view(), name='auth-login'),
    re_path(r'^logout/?$', LogoutView.as_view(), name='auth-logout'),
    re_path(r'^refresh/?$', RefreshTokenView.as_view(), name='auth-refresh'),
    re_path(r'^me/?$', MeView.as_view(), name='auth-me'),
]
