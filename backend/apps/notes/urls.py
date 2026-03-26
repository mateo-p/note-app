from django.urls import re_path
from .views import CategoryListView, NoteListCreateView, NoteDetailView

urlpatterns = [
    re_path(r'^categories/?$', CategoryListView.as_view(), name='category-list'),
    re_path(r'^notes/?$', NoteListCreateView.as_view(), name='note-list-create'),
    re_path(r'^notes/(?P<pk>[0-9a-f-]{36})/?$', NoteDetailView.as_view(), name='note-detail'),
]
