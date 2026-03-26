from rest_framework import serializers
from .models import Note, Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'color')


class NoteSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Note
        fields = (
            'id', 'title', 'content', 'category', 'category_id',
            'is_pinned', 'is_archived', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


