from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.programs.models import Intervention, Program
from apps.users.models import Role, UserRole


class ProgramAndInterventionApiTests(APITestCase):
    programs_endpoint = '/api/programs/'
    interventions_endpoint = '/api/interventions/'

    def setUp(self):
        User = get_user_model()

        self.admin_role, _ = Role.objects.get_or_create(name='Admin')
        self.staff_role, _ = Role.objects.get_or_create(name='Staff')
        self.farmer_role, _ = Role.objects.get_or_create(name='Farmer')

        self.admin_user = User.objects.create_user(
            username='program_admin_user',
            email='program_admin_user@example.com',
            password='Pass12345!',
        )
        UserRole.objects.get_or_create(user=self.admin_user, role=self.admin_role)

        self.staff_user = User.objects.create_user(
            username='program_staff_user',
            email='program_staff_user@example.com',
            password='Pass12345!',
        )
        UserRole.objects.get_or_create(user=self.staff_user, role=self.staff_role)

        self.farmer_user = User.objects.create_user(
            username='program_farmer_user',
            email='program_farmer_user@example.com',
            password='Pass12345!',
        )
        UserRole.objects.get_or_create(user=self.farmer_user, role=self.farmer_role)

        self.program = Program.objects.create(
            name='Rice Assistance Program',
            description='Seasonal rice support',
            start_date='2026-01-01',
            end_date='2026-12-31',
        )
        self.intervention = Intervention.objects.create(
            program=self.program,
            name='Fertilizer Pack',
            description='Starter fertilizer package',
            start_date='2026-01-10',
            end_date='2026-11-30',
        )

    def test_unauthenticated_user_cannot_list_programs(self):
        response = self.client.get(self.programs_endpoint)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_list_programs_and_interventions(self):
        self.client.force_authenticate(user=self.farmer_user)

        program_response = self.client.get(self.programs_endpoint)
        intervention_response = self.client.get(self.interventions_endpoint)

        self.assertEqual(program_response.status_code, status.HTTP_200_OK)
        self.assertEqual(intervention_response.status_code, status.HTTP_200_OK)
        self.assertEqual(program_response.data[0]['name'], 'Rice Assistance Program')
        self.assertEqual(intervention_response.data[0]['name'], 'Fertilizer Pack')

    def test_admin_can_create_program(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.post(
            self.programs_endpoint,
            {
                'name': 'Corn Assistance Program',
                'description': 'Corn support program',
                'start_date': '2026-02-01',
                'end_date': '2026-10-31',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Corn Assistance Program')

    def test_staff_cannot_create_program(self):
        self.client.force_authenticate(user=self.staff_user)

        response = self.client.post(
            self.programs_endpoint,
            {
                'name': 'Blocked Program',
                'description': 'Should not be created by staff',
                'start_date': '2026-03-01',
                'end_date': '2026-09-30',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_cannot_create_program_with_invalid_date_range(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.post(
            self.programs_endpoint,
            {
                'name': 'Invalid Date Program',
                'description': 'Invalid date range sample',
                'start_date': '2026-12-01',
                'end_date': '2026-01-01',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('end_date', response.data)

    def test_admin_can_update_and_delete_program(self):
        self.client.force_authenticate(user=self.admin_user)

        update_response = self.client.patch(
            f'{self.programs_endpoint}{self.program.id}/',
            {
                'description': 'Updated seasonal rice support',
            },
            format='json',
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data['description'], 'Updated seasonal rice support')

        delete_response = self.client.delete(f'{self.programs_endpoint}{self.program.id}/')
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Program.objects.filter(id=self.program.id).exists())

    def test_admin_can_create_update_and_delete_intervention(self):
        self.client.force_authenticate(user=self.admin_user)

        create_response = self.client.post(
            self.interventions_endpoint,
            {
                'program': self.program.id,
                'name': 'Seed Assistance',
                'description': 'Seed distribution package',
                'start_date': '2026-02-10',
                'end_date': '2026-09-20',
            },
            format='json',
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        intervention_id = create_response.data['id']

        update_response = self.client.patch(
            f'{self.interventions_endpoint}{intervention_id}/',
            {'description': 'Updated seed package'},
            format='json',
        )
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data['description'], 'Updated seed package')

        delete_response = self.client.delete(f'{self.interventions_endpoint}{intervention_id}/')
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Intervention.objects.filter(id=intervention_id).exists())

    def test_staff_cannot_mutate_intervention(self):
        self.client.force_authenticate(user=self.staff_user)

        create_response = self.client.post(
            self.interventions_endpoint,
            {
                'program': self.program.id,
                'name': 'Blocked Intervention',
                'description': 'Should not be created by staff',
                'start_date': '2026-04-01',
                'end_date': '2026-08-01',
            },
            format='json',
        )
        self.assertEqual(create_response.status_code, status.HTTP_403_FORBIDDEN)

        update_response = self.client.patch(
            f'{self.interventions_endpoint}{self.intervention.id}/',
            {'description': 'Blocked update'},
            format='json',
        )
        self.assertEqual(update_response.status_code, status.HTTP_403_FORBIDDEN)

        delete_response = self.client.delete(
            f'{self.interventions_endpoint}{self.intervention.id}/'
        )
        self.assertEqual(delete_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_cannot_create_intervention_with_invalid_date_range(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.post(
            self.interventions_endpoint,
            {
                'program': self.program.id,
                'name': 'Invalid Date Intervention',
                'description': 'Invalid date range sample',
                'start_date': '2026-09-01',
                'end_date': '2026-03-01',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('end_date', response.data)

    def test_admin_cannot_create_intervention_outside_program_window(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.post(
            self.interventions_endpoint,
            {
                'program': self.program.id,
                'name': 'Out of Range Intervention',
                'description': 'Outside parent program schedule',
                'start_date': '2025-12-01',
                'end_date': '2026-09-01',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('start_date', response.data)
