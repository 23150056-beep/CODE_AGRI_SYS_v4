from django.contrib import admin

from apps.distributions.models import DistributionRecord, DistributionStatusLog

admin.site.register(DistributionRecord)
admin.site.register(DistributionStatusLog)
