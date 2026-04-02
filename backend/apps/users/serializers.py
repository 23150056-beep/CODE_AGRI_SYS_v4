from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.users.models import Role, UserRole

User = get_user_model()


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name']


class UserSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_active', 'date_joined', 'roles']

    def get_roles(self, obj):
        return list(obj.user_roles.values_list('role__name', flat=True))


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role_id']

    def create(self, validated_data):
        role_id = validated_data.pop('role_id', None)
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)

        if role_id:
            role = Role.objects.get(pk=role_id)
            UserRole.objects.get_or_create(user=user, role=role)

        return user


class AdminCreateUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role_id = serializers.IntegerField(required=False, allow_null=True)
    is_active = serializers.BooleanField(required=False, default=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role_id', 'is_active']
        extra_kwargs = {
            'email': {'required': False, 'allow_blank': True},
        }

    def validate_role_id(self, value):
        if value is not None and not Role.objects.filter(pk=value).exists():
            raise serializers.ValidationError('Invalid role id.')
        return value

    def create(self, validated_data):
        role_id = validated_data.pop('role_id', None)
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)

        if role_id:
            role = Role.objects.get(pk=role_id)
            UserRole.objects.get_or_create(user=user, role=role)

        return user


class AssignRoleSerializer(serializers.Serializer):
    role_id = serializers.IntegerField()

    def validate_role_id(self, value):
        if not Role.objects.filter(pk=value).exists():
            raise serializers.ValidationError('Invalid role id.')
        return value


class RemoveRoleSerializer(AssignRoleSerializer):
    pass


class ResetPasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True, min_length=8)
