from rest_framework import serializers

from apps.distributors.models import Distributor


class DistributorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Distributor
        fields = [
            'id',
            'user',
            'name',
            'location',
            'services_offered',
            'accreditation_status',
            'contact_person',
            'contact_number',
            'created_at',
        ]
        read_only_fields = ['created_at']
