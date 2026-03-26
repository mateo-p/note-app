from django.contrib import admin
from .models import Note, Category

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'color')

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'category', 'is_pinned', 'is_archived', 'updated_at')
    list_filter = ('category', 'is_pinned', 'is_archived')
    search_fields = ('title', 'content')
