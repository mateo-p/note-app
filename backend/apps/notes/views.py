from django.db.models import Q
from rest_framework import generics

from .models import Note, Category
from .serializers import NoteSerializer, CategorySerializer


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class NoteListCreateView(generics.ListCreateAPIView):
    serializer_class = NoteSerializer

    def get_queryset(self):
        qs = Note.objects.filter(user=self.request.user).select_related('category')

        category_id = self.request.query_params.get('category')
        if category_id:
            qs = qs.filter(category_id=category_id)

        archived = self.request.query_params.get('archived', 'false').lower()
        qs = qs.filter(is_archived=(archived == 'true'))

        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(content__icontains=search))

        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class NoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NoteSerializer
    http_method_names = ['get', 'patch', 'delete']

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user).select_related('category')
