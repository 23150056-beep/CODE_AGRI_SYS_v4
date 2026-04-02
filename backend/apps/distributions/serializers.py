from rest_framework import serializers

from apps.distributions.models import DistributionRecord, DistributionStatusLog


class DistributionRecordSerializer(serializers.ModelSerializer):
    farmer_name = serializers.CharField(source='farmer.__str__', read_only=True)
    input_name = serializers.CharField(source='input_inventory.input_name', read_only=True)
    assigned_distributor_name = serializers.CharField(
        source='assigned_distributor.name',
        read_only=True,
    )

    class Meta:
        model = DistributionRecord
        fields = [
            'id',
            'farmer',
            'farmer_name',
            'input_inventory',
            'input_name',
            'quantity_released',
            'assigned_distributor',
            'assigned_distributor_name',
            'distribution_date',
            'release_officer',
            'status',
            'remarks',
        ]
        read_only_fields = ['distribution_date', 'release_officer']


class DistributionStatusLogSerializer(serializers.ModelSerializer):
    updated_by_username = serializers.CharField(source='updated_by.username', read_only=True)

    class Meta:
        model = DistributionStatusLog
        fields = [
            'id',
            'distribution',
            'previous_status',
            'new_status',
            'remarks',
            'updated_by',
            'updated_by_username',
            'created_at',
        ]
