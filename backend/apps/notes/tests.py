import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.notes.models import Note, Category

User = get_user_model()


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(email='user@example.com', password='StrongPass123!')


@pytest.fixture
def other_user(db):
    return User.objects.create_user(email='other@example.com', password='StrongPass123!')


@pytest.fixture
def auth_client(client, user):
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def category(db):
    # Use get_or_create since seed migration already creates these categories
    cat, _ = Category.objects.get_or_create(name='Personal', defaults={'color': '#F5D79E'})
    return cat


@pytest.fixture
def note(db, user, category):
    return Note.objects.create(user=user, title='My Note', content='Some content', category=category)


# ── Categories ────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestCategoryList:
    def test_returns_all_categories(self, auth_client, category):
        res = auth_client.get('/api/categories')
        assert res.status_code == 200
        names = [c['name'] for c in res.data]
        assert 'Personal' in names

    def test_unauthenticated_returns_401(self, client):
        res = client.get('/api/categories')
        assert res.status_code == 401


# ── Note List / Create ────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestNoteList:
    def test_returns_only_own_notes(self, auth_client, note, other_user, category):
        Note.objects.create(user=other_user, title='Other Note', content='', category=category)
        res = auth_client.get('/api/notes')
        assert res.status_code == 200
        assert len(res.data) == 1
        assert res.data[0]['title'] == 'My Note'

    def test_filter_by_category(self, auth_client, user, note, db):
        other_cat = Category.objects.create(name='Work', color='#7BBFBB')
        Note.objects.create(user=user, title='Work Note', content='', category=other_cat)
        res = auth_client.get(f'/api/notes?category={note.category.id}')
        assert res.status_code == 200
        assert all(n['category']['id'] == note.category.id for n in res.data)

    def test_search_by_title(self, auth_client, user, note):
        Note.objects.create(user=user, title='Unrelated', content='Nothing here')
        res = auth_client.get('/api/notes?search=My Note')
        assert res.status_code == 200
        assert len(res.data) == 1
        assert res.data[0]['title'] == 'My Note'

    def test_unauthenticated_returns_401(self, client):
        res = client.get('/api/notes')
        assert res.status_code == 401


@pytest.mark.django_db
class TestNoteCreate:
    def test_creates_note(self, auth_client, category):
        res = auth_client.post('/api/notes', {'title': 'New', 'content': 'Body', 'category_id': category.id}, format='json')
        assert res.status_code == 201
        assert res.data['title'] == 'New'
        assert Note.objects.filter(title='New').exists()

    def test_creates_note_without_category(self, auth_client):
        res = auth_client.post('/api/notes', {'title': 'No Cat', 'content': ''}, format='json')
        assert res.status_code == 201
        assert res.data['category'] is None

    def test_unauthenticated_returns_401(self, client, category):
        res = client.post('/api/notes', {'title': 'X', 'content': '', 'category_id': category.id}, format='json')
        assert res.status_code == 401


# ── Note Detail ───────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestNoteDetail:
    def test_patch_updates_note(self, auth_client, note):
        res = auth_client.patch(f'/api/notes/{note.id}', {'title': 'Updated'}, format='json')
        assert res.status_code == 200
        note.refresh_from_db()
        assert note.title == 'Updated'

    def test_patch_pin_note(self, auth_client, note):
        res = auth_client.patch(f'/api/notes/{note.id}', {'is_pinned': True}, format='json')
        assert res.status_code == 200
        note.refresh_from_db()
        assert note.is_pinned is True

    def test_delete_note(self, auth_client, note):
        res = auth_client.delete(f'/api/notes/{note.id}')
        assert res.status_code == 204
        assert not Note.objects.filter(id=note.id).exists()

    def test_cannot_patch_other_users_note(self, auth_client, other_user, category):
        other_note = Note.objects.create(user=other_user, title='Private', content='', category=category)
        res = auth_client.patch(f'/api/notes/{other_note.id}', {'title': 'Hacked'}, format='json')
        assert res.status_code == 404

    def test_cannot_delete_other_users_note(self, auth_client, other_user, category):
        other_note = Note.objects.create(user=other_user, title='Private', content='', category=category)
        res = auth_client.delete(f'/api/notes/{other_note.id}')
        assert res.status_code == 404

    def test_unauthenticated_returns_401(self, client, note):
        res = client.patch(f'/api/notes/{note.id}', {'title': 'X'}, format='json')
        assert res.status_code == 401
