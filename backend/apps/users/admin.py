from django.contrib import admin

from apps.users.models import Role, UserRole

admin.site.register(Role)
admin.site.register(UserRole)
