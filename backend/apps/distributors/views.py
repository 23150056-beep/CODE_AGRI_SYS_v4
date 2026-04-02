from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.distributors.models import Distributor
from apps.distributors.serializers import DistributorSerializer
from apps.users.permissions import IsAdminOrStaff


class DistributorViewSet(viewsets.ModelViewSet):
    queryset = Distributor.objects.all()
    serializer_class = DistributorSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrStaff()]
        return [IsAuthenticated()]
