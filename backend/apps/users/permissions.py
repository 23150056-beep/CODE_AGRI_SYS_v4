from rest_framework.permissions import BasePermission


def has_any_role(user, required_roles):
    if not user or not user.is_authenticated:
        return False

    if user.is_superuser:
        return True

    user_roles = set(user.user_roles.values_list('role__name', flat=True))
    return bool(user_roles.intersection(set(required_roles)))


class RolePermission(BasePermission):
    required_roles = ()

    def has_permission(self, request, view):
        return has_any_role(request.user, self.required_roles)


class IsAdmin(RolePermission):
    required_roles = ('Admin',)


class IsAdminOrStaff(RolePermission):
    required_roles = ('Admin', 'Staff')
