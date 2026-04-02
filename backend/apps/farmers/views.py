from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.farmers.models import FarmerProfile, InterventionApplication
from apps.farmers.serializers import (
    FarmerProfileSerializer,
    InterventionApplicationSerializer,
)
from apps.users.permissions import IsAdminOrStaff, has_any_role


class FarmerProfileViewSet(viewsets.ModelViewSet):
    queryset = FarmerProfile.objects.select_related('user').all()
    serializer_class = FarmerProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if has_any_role(user, ['Admin', 'Staff']):
            return self.queryset

        if has_any_role(user, ['Farmer']):
            return self.queryset.filter(user=user)

        return self.queryset.none()

    def get_permissions(self):
        if self.action in ['create', 'verify_credentials']:
            return [IsAdminOrStaff()]
        return [IsAuthenticated()]

    def _enforce_self_or_staff(self, farmer_profile):
        user = self.request.user
        if has_any_role(user, ['Admin', 'Staff']):
            return
        if has_any_role(user, ['Farmer']) and farmer_profile.user_id == user.id:
            return
        raise PermissionDenied('You do not have access to this farmer profile.')

    def retrieve(self, request, *args, **kwargs):
        farmer_profile = self.get_object()
        self._enforce_self_or_staff(farmer_profile)
        return super().retrieve(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        farmer_profile = self.get_object()
        self._enforce_self_or_staff(farmer_profile)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        farmer_profile = self.get_object()
        self._enforce_self_or_staff(farmer_profile)
        return super().partial_update(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='credentials/verify')
    def verify_credentials(self, request, pk=None):
        profile = self.get_object()
        status_value = request.data.get('credentials_status', FarmerProfile.CredentialsStatus.VERIFIED)
        remarks = request.data.get('remarks', '')

        if status_value not in FarmerProfile.CredentialsStatus.values:
            return Response(
                {'detail': 'Invalid credentials status.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile.credentials_status = status_value
        profile.save(update_fields=['credentials_status'])

        payload = {
            'profile': FarmerProfileSerializer(profile).data,
            'remarks': remarks,
        }
        return Response(payload)

    @action(detail=True, methods=['get', 'post'], url_path='applications')
    def applications(self, request, pk=None):
        profile = self.get_object()
        self._enforce_self_or_staff(profile)

        if request.method == 'GET':
            applications = profile.applications.select_related('intervention').all()
            serializer = InterventionApplicationSerializer(applications, many=True)
            return Response(serializer.data)

        payload = request.data.copy()
        payload['farmer'] = profile.id

        if has_any_role(request.user, ['Farmer']) and not has_any_role(
            request.user,
            ['Admin', 'Staff'],
        ):
            payload['status'] = InterventionApplication.ApplicationStatus.PENDING

        serializer = InterventionApplicationSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class InterventionApplicationViewSet(viewsets.ModelViewSet):
    queryset = InterventionApplication.objects.select_related('farmer', 'intervention').all()
    serializer_class = InterventionApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if has_any_role(user, ['Admin', 'Staff']):
            return self.queryset
        if has_any_role(user, ['Farmer']) and hasattr(user, 'farmer_profile'):
            return self.queryset.filter(farmer=user.farmer_profile)
        return self.queryset.none()

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAdminOrStaff()]
        return [IsAuthenticated()]
