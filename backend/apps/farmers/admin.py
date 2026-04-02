from django.contrib import admin

from apps.farmers.models import FarmerProfile, InterventionApplication

admin.site.register(FarmerProfile)
admin.site.register(InterventionApplication)
