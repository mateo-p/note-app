from django.db import models
from django.conf import settings
from apps.common.models import BaseModel


class Category(models.Model):
    name = models.CharField(max_length=50, unique=True)
    color = models.CharField(max_length=7)  # hex e.g. "#E8956D"

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'categories'

    def __str__(self):
        return self.name


class Note(BaseModel):
    title = models.CharField(max_length=255, blank=True, default='')
    content = models.TextField(blank=True, default='')
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='notes',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notes',
    )
    is_pinned = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)

    class Meta:
        db_table = 'notes'
        ordering = ['-is_pinned', '-updated_at']
        indexes = [
            models.Index(fields=['user', 'is_archived', '-updated_at'], name='note_user_archived_updated_idx'),
            models.Index(fields=['is_pinned'], name='note_pinned_idx'),
        ]

    def __str__(self):
        return self.title or f'Note {self.id}'
