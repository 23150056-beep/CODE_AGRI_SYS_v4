from django.contrib import admin

from apps.programs.models import Intervention, Program

admin.site.register(Program)
admin.site.register(Intervention)
