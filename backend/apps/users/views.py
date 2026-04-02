from django.contrib.auth import get_user_model
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import Role, UserRole
from apps.users.permissions import IsAdmin, IsAdminOrStaff
from apps.users.serializers import (
    AdminCreateUserSerializer,
    AssignRoleSerializer,
    RegisterSerializer,
    RemoveRoleSerializer,
    ResetPasswordSerializer,
    RoleSerializer,
    UserSerializer,
)

User = get_user_model()


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return AdminCreateUserSerializer
        return super().get_serializer_class()

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'update', 'partial_update']:
            return [IsAdminOrStaff()]
        if self.action in [
            'create',
            'destroy',
            'assign_role',
            'remove_role',
            'reset_password',
        ]:
            return [IsAdmin()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def assign_role(self, request, pk=None):
        serializer = AssignRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = self.get_object()
        role = Role.objects.get(pk=serializer.validated_data['role_id'])
        UserRole.objects.get_or_create(user=user, role=role)

        return Response(UserSerializer(user).data)

    @action(detail=True, methods=['post'])
    def remove_role(self, request, pk=None):
        serializer = RemoveRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = self.get_object()
        role = Role.objects.get(pk=serializer.validated_data['role_id'])
        deleted_count, _ = UserRole.objects.filter(user=user, role=role).delete()

        if not deleted_count:
            return Response(
                {'detail': 'This user is not assigned to the selected role.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(UserSerializer(user).data)

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = self.get_object()
        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password'])

        return Response({'detail': 'Password reset successful.'})


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all().order_by('name')
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAdminOrStaff()]
        return [IsAdmin()]
