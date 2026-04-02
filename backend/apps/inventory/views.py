from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.inventory.models import InputInventory, InventoryTransaction
from apps.inventory.serializers import (
    InputInventorySerializer,
    InventoryTransactionSerializer,
)
from apps.users.permissions import IsAdminOrStaff


class InputInventoryViewSet(viewsets.ModelViewSet):
    queryset = InputInventory.objects.select_related('intervention', 'distributor').all()
    serializer_class = InputInventorySerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'record_transaction']:
            return [IsAdminOrStaff()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['get', 'post'], url_path='transactions')
    def record_transaction(self, request, pk=None):
        inventory = self.get_object()

        if request.method == 'GET':
            serializer = InventoryTransactionSerializer(
                inventory.transactions.all(),
                many=True,
            )
            return Response(serializer.data)

        payload = request.data.copy()
        payload['inventory'] = inventory.id

        serializer = InventoryTransactionSerializer(data=payload)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            tx = serializer.save()

            if tx.transaction_type == InventoryTransaction.TransactionType.RECEIVED:
                inventory.quantity_received += max(tx.quantity, 0)
                inventory.quantity_available += max(tx.quantity, 0)
            elif tx.transaction_type == InventoryTransaction.TransactionType.ALLOCATED:
                inventory.quantity_available = max(inventory.quantity_available - abs(tx.quantity), 0)
            elif tx.transaction_type == InventoryTransaction.TransactionType.ADJUSTED:
                inventory.quantity_available = max(inventory.quantity_available + tx.quantity, 0)

            inventory.save(update_fields=['quantity_received', 'quantity_available', 'last_updated'])

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class InventoryTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InventoryTransaction.objects.select_related('inventory').all()
    serializer_class = InventoryTransactionSerializer
    permission_classes = [IsAuthenticated]
