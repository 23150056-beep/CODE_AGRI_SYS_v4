from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.distributors.views import DistributorViewSet

router = DefaultRouter()
router.register('distributors', DistributorViewSet, basename='distributor')

urlpatterns = [
    path('', include(router.urls)),
]
