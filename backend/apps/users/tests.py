from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import Role, UserRole


class UserManagementAdminApiTests(APITestCase):
    users_endpoint = '/api/users/'

    def setUp(self):
        User = get_user_model()

        self.admin_role, _ = Role.objects.get_or_create(name='Admin')
        self.staff_role, _ = Role.objects.get_or_create(name='Staff')

        self.admin_user = User.objects.create_user(
            username='admin_api_user',
            email='admin_api_user@example.com',
            password='Pass12345!',
        )
        UserRole.objects.get_or_create(user=self.admin_user, role=self.admin_role)

        self.staff_user = User.objects.create_user(
            username='staff_api_user',
            email='staff_api_user@example.com',
            password='Pass12345!',
        )
        UserRole.objects.get_or_create(user=self.staff_user, role=self.staff_role)

    def test_admin_can_create_user_with_initial_role(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.post(
            self.users_endpoint,
            {
                'username': 'created_via_admin',
                'email': 'created_via_admin@example.com',
                'password': 'Pass12345!',
                'role_id': self.staff_role.id,
                'is_active': True,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], 'created_via_admin')
        self.assertIn('Staff', response.data['roles'])

    def test_non_admin_cannot_create_user(self):
        self.client.force_authenticate(user=self.staff_user)

        response = self.client.post(
            self.users_endpoint,
            {
                'username': 'blocked_user',
                'password': 'Pass12345!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_remove_assigned_role(self):
        User = get_user_model()
        target_user = User.objects.create_user(
            username='role_target',
            email='role_target@example.com',
            password='Pass12345!',
        )
        UserRole.objects.get_or_create(user=target_user, role=self.staff_role)

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'{self.users_endpoint}{target_user.id}/remove_role/',
            {'role_id': self.staff_role.id},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('Staff', response.data['roles'])

    def test_remove_role_returns_400_when_not_assigned(self):
        User = get_user_model()
        target_user = User.objects.create_user(
            username='role_missing_target',
            email='role_missing_target@example.com',
            password='Pass12345!',
        )

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'{self.users_endpoint}{target_user.id}/remove_role/',
            {'role_id': self.staff_role.id},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data['detail'],
            'This user is not assigned to the selected role.',
        )

    def test_admin_can_reset_user_password(self):
        User = get_user_model()
        target_user = User.objects.create_user(
            username='password_target',
            email='password_target@example.com',
            password='OldPass123!',
        )

        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            f'{self.users_endpoint}{target_user.id}/reset_password/',
            {'new_password': 'NewPass123!'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['detail'], 'Password reset successful.')

        target_user.refresh_from_db()
        self.assertTrue(target_user.check_password('NewPass123!'))

    def test_non_admin_cannot_reset_password(self):
        User = get_user_model()
        target_user = User.objects.create_user(
            username='blocked_reset_target',
            email='blocked_reset_target@example.com',
            password='OldPass123!',
        )

        self.client.force_authenticate(user=self.staff_user)
        response = self.client.post(
            f'{self.users_endpoint}{target_user.id}/reset_password/',
            {'new_password': 'NewPass123!'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
