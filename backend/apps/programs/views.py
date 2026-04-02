from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.programs.models import Intervention, Program
from apps.programs.serializers import InterventionSerializer, ProgramSerializer
from apps.users.permissions import IsAdmin, IsAdminOrStaff


class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdmin()]


class InterventionViewSet(viewsets.ModelViewSet):
    queryset = Intervention.objects.select_related('program').all()
    serializer_class = InterventionSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsAdminOrStaff()]
