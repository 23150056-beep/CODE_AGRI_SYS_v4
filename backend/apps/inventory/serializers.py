from rest_framework import serializers

from apps.inventory.models import InputInventory, InventoryTransaction


class InputInventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = InputInventory
        fields = [
            'id',
            'intervention',
            'input_name',
            'quantity_received',
            'quantity_available',
            'distributor',
            'delivery_date',
            'expiry_date',
            'last_updated',
        ]
        read_only_fields = ['last_updated']


class InventoryTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryTransaction
        fields = [
            'id',
            'inventory',
            'transaction_type',
            'quantity',
            'reference',
            'created_at',
        ]
        read_only_fields = ['created_at']
