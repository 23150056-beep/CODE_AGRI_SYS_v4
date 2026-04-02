from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.inventory.views import InputInventoryViewSet, InventoryTransactionViewSet

router = DefaultRouter()
router.register('inventory', InputInventoryViewSet, basename='inventory')
router.register(
    'inventory-transactions',
    InventoryTransactionViewSet,
    basename='inventory-transaction',
)

urlpatterns = [
    path('', include(router.urls)),
]
