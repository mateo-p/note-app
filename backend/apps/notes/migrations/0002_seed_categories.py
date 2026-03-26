from django.db import migrations

CATEGORIES = [
    {'name': 'Random Thoughts', 'color': '#E8956D'},
    {'name': 'School',          'color': '#7BBFBB'},
    {'name': 'Personal',        'color': '#F5D79E'},
    {'name': 'Drama',           'color': '#B8D4B0'},
]


def seed_categories(apps, schema_editor):
    Category = apps.get_model('notes', 'Category')
    for cat in CATEGORIES:
        Category.objects.get_or_create(name=cat['name'], defaults={'color': cat['color']})


def unseed_categories(apps, schema_editor):
    Category = apps.get_model('notes', 'Category')
    Category.objects.filter(name__in=[c['name'] for c in CATEGORIES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('notes', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_categories, reverse_code=unseed_categories),
    ]
