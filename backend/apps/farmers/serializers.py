from rest_framework import serializers

from apps.farmers.models import FarmerProfile, InterventionApplication


class FarmerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = FarmerProfile
        fields = [
            'id',
            'user',
            'first_name',
            'last_name',
            'address',
            'contact_number',
            'credentials_status',
            'farm_location',
            'planting_season',
            'date_registered',
        ]
        read_only_fields = ['date_registered']


class InterventionApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterventionApplication
        fields = [
            'id',
            'farmer',
            'intervention',
            'application_date',
            'status',
            'remarks',
        ]
        read_only_fields = ['application_date']
