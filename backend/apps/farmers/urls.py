from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.farmers.views import FarmerProfileViewSet, InterventionApplicationViewSet

router = DefaultRouter()
router.register('farmers', FarmerProfileViewSet, basename='farmer-profile')
router.register(
    'intervention-applications',
    InterventionApplicationViewSet,
    basename='intervention-application',
)

urlpatterns = [
    path('', include(router.urls)),
]
