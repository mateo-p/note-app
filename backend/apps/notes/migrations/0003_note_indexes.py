from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notes', '0002_seed_categories'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='note',
            index=models.Index(fields=['user', 'is_archived', '-updated_at'], name='note_user_archived_updated_idx'),
        ),
        migrations.AddIndex(
            model_name='note',
            index=models.Index(fields=['is_pinned'], name='note_pinned_idx'),
        ),
    ]
