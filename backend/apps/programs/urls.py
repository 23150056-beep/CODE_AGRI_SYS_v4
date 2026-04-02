from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.programs.views import InterventionViewSet, ProgramViewSet

router = DefaultRouter()
router.register('programs', ProgramViewSet, basename='program')
router.register('interventions', InterventionViewSet, basename='intervention')

urlpatterns = [
    path('', include(router.urls)),
]
