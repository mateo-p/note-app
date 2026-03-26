import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(email='test@example.com', password='StrongPass123!')


@pytest.fixture
def auth_client(client, user):
    client.force_authenticate(user=user)
    return client


# ── SignUp ────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestSignUp:
    def test_creates_user_and_sets_cookies(self, client):
        res = client.post('/api/auth/signup', {'email': 'new@example.com', 'password': 'StrongPass123!'}, format='json')
        assert res.status_code == 201
        assert User.objects.filter(email='new@example.com').exists()
        assert 'access_token' in res.cookies
        assert 'refresh_token' in res.cookies

    def test_duplicate_email_returns_400(self, client, user):
        res = client.post('/api/auth/signup', {'email': user.email, 'password': 'StrongPass123!'}, format='json')
        assert res.status_code == 400

    def test_weak_password_returns_400(self, client):
        res = client.post('/api/auth/signup', {'email': 'new@example.com', 'password': '123'}, format='json')
        assert res.status_code == 400

    def test_missing_email_returns_400(self, client):
        res = client.post('/api/auth/signup', {'password': 'StrongPass123!'}, format='json')
        assert res.status_code == 400


# ── Login ─────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestLogin:
    def test_valid_credentials_returns_200_and_sets_cookies(self, client, user):
        res = client.post('/api/auth/login', {'email': user.email, 'password': 'StrongPass123!'}, format='json')
        assert res.status_code == 200
        assert 'access_token' in res.cookies
        assert 'refresh_token' in res.cookies

    def test_wrong_password_returns_401(self, client, user):
        res = client.post('/api/auth/login', {'email': user.email, 'password': 'wrongpass'}, format='json')
        assert res.status_code == 401

    def test_nonexistent_email_returns_401(self, client):
        res = client.post('/api/auth/login', {'email': 'ghost@example.com', 'password': 'StrongPass123!'}, format='json')
        assert res.status_code == 401


# ── Logout ────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestLogout:
    def test_authenticated_logout_returns_200(self, auth_client):
        res = auth_client.post('/api/auth/logout')
        assert res.status_code == 200

    def test_unauthenticated_logout_returns_401(self, client):
        res = client.post('/api/auth/logout')
        assert res.status_code == 401


# ── Me ────────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestMe:
    def test_returns_current_user(self, auth_client, user):
        res = auth_client.get('/api/auth/me')
        assert res.status_code == 200
        assert res.data['email'] == user.email
        assert 'id' in res.data
        assert 'password' not in res.data

    def test_unauthenticated_returns_401(self, client):
        res = client.get('/api/auth/me')
        assert res.status_code == 401


# ── Refresh ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestRefresh:
    def test_missing_refresh_token_returns_401(self, client):
        res = client.post('/api/auth/refresh')
        assert res.status_code == 401

    def test_invalid_refresh_token_returns_401(self, client):
        client.cookies['refresh_token'] = 'invalid.token.here'
        res = client.post('/api/auth/refresh')
        assert res.status_code == 401
