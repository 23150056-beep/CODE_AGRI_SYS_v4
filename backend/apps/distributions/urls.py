from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.distributions.views import DistributionRecordViewSet

router = DefaultRouter()
router.register('distributions', DistributionRecordViewSet, basename='distribution')

urlpatterns = [
    path('', include(router.urls)),
]
