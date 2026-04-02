from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.distributions.models import DistributionRecord, DistributionStatusLog
from apps.distributors.models import Distributor
from apps.farmers.models import FarmerProfile
from apps.inventory.models import InputInventory, InventoryTransaction
from apps.programs.models import Intervention, Program
from apps.users.models import Role, UserRole


class DistributionBulkReleaseTests(APITestCase):
    endpoint = '/api/distributions/bulk-release/'

    def setUp(self):
        self.User = get_user_model()

        self.staff_role, _ = Role.objects.get_or_create(name='Staff')
        self.farmer_role, _ = Role.objects.get_or_create(name='Farmer')

        self.staff_user = self.User.objects.create_user(
            username='bulk_staff_test',
            password='pass1234',
            email='bulk_staff_test@example.com',
        )
        UserRole.objects.create(user=self.staff_user, role=self.staff_role)

        self.farmer_user = self.User.objects.create_user(
            username='bulk_farmer_test',
            password='pass1234',
            email='bulk_farmer_test@example.com',
        )
        UserRole.objects.create(user=self.farmer_user, role=self.farmer_role)

        self.farmer_profile = FarmerProfile.objects.create(
            user=self.farmer_user,
            first_name='Bulk',
            last_name='Farmer',
            address='Bauang, La Union',
            contact_number='09000000000',
            credentials_status=FarmerProfile.CredentialsStatus.VERIFIED,
            farm_location='Bauang',
            planting_season='Dry',
        )

        self.program = Program.objects.create(
            name='Bulk Test Program',
            description='Program for bulk release tests',
            start_date='2026-01-01',
            end_date='2026-12-31',
        )
        self.intervention = Intervention.objects.create(
            program=self.program,
            name='Bulk Test Intervention',
            description='Intervention for bulk release tests',
            start_date='2026-01-01',
            end_date='2026-12-31',
        )
        self.distributor = Distributor.objects.create(
            name='Bulk Test Distributor',
            location='Bauang',
            services_offered='Delivery',
            accreditation_status=Distributor.AccreditationStatus.ACCREDITED,
            contact_person='Bulk Person',
            contact_number='09000000001',
        )

    def _create_inventory(self, quantity_available=20):
        return InputInventory.objects.create(
            intervention=self.intervention,
            input_name='Bulk Input',
            quantity_received=quantity_available,
            quantity_available=quantity_available,
            distributor=self.distributor,
        )

    def _create_distribution(self, inventory, quantity_released, status='Pending'):
        return DistributionRecord.objects.create(
            farmer=self.farmer_profile,
            input_inventory=inventory,
            quantity_released=quantity_released,
            assigned_distributor=self.distributor,
            status=status,
        )

    def test_bulk_release_requires_staff_or_admin_role(self):
        self.client.force_authenticate(user=self.farmer_user)
        response = self.client.post(
            self.endpoint,
            {'distribution_ids': [1]},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_bulk_release_rejects_empty_payload(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.post(
            self.endpoint,
            {'distribution_ids': []},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data['detail'],
            'distribution_ids must be a non-empty array.',
        )

    def test_bulk_release_handles_mixed_valid_and_skipped_records(self):
        self.client.force_authenticate(user=self.staff_user)

        shared_inventory = self._create_inventory(quantity_available=10)
        releasable_1 = self._create_distribution(shared_inventory, quantity_released=3)
        non_pending = self._create_distribution(
            shared_inventory,
            quantity_released=1,
            status=DistributionRecord.DistributionStatus.RELEASED,
        )
        insufficient_inventory = self._create_distribution(
            shared_inventory,
            quantity_released=12,
        )
        releasable_2 = self._create_distribution(shared_inventory, quantity_released=5)

        response = self.client.post(
            self.endpoint,
            {
                'distribution_ids': [
                    releasable_1.id,
                    999999,
                    non_pending.id,
                    insufficient_inventory.id,
                    releasable_2.id,
                ]
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['released_ids'], [releasable_1.id, releasable_2.id])

        skipped_by_id = {item['id']: item['reason'] for item in response.data['skipped']}
        self.assertEqual(skipped_by_id[999999], 'Not found.')
        self.assertEqual(
            skipped_by_id[non_pending.id],
            'Only pending distributions can be released.',
        )
        self.assertEqual(
            skipped_by_id[insufficient_inventory.id],
            'Insufficient inventory available for release.',
        )

        shared_inventory.refresh_from_db()
        releasable_1.refresh_from_db()
        releasable_2.refresh_from_db()
        insufficient_inventory.refresh_from_db()

        self.assertEqual(shared_inventory.quantity_available, 2)
        self.assertEqual(releasable_1.status, DistributionRecord.DistributionStatus.RELEASED)
        self.assertEqual(releasable_2.status, DistributionRecord.DistributionStatus.RELEASED)
        self.assertEqual(
            insufficient_inventory.status,
            DistributionRecord.DistributionStatus.PENDING,
        )

        allocation_refs = set(
            InventoryTransaction.objects.filter(
                transaction_type=InventoryTransaction.TransactionType.ALLOCATED
            ).values_list('reference', flat=True)
        )
        self.assertIn(f'distribution:{releasable_1.id}', allocation_refs)
        self.assertIn(f'distribution:{releasable_2.id}', allocation_refs)

        self.assertTrue(
            DistributionStatusLog.objects.filter(
                distribution=releasable_1,
                previous_status=DistributionRecord.DistributionStatus.PENDING,
                new_status=DistributionRecord.DistributionStatus.RELEASED,
            ).exists()
        )
        self.assertTrue(
            DistributionStatusLog.objects.filter(
                distribution=releasable_2,
                previous_status=DistributionRecord.DistributionStatus.PENDING,
                new_status=DistributionRecord.DistributionStatus.RELEASED,
            ).exists()
        )

    def test_bulk_release_handles_high_volume_records(self):
        self.client.force_authenticate(user=self.staff_user)

        shared_inventory = self._create_inventory(quantity_available=60)
        records = [
            self._create_distribution(shared_inventory, quantity_released=1)
            for _ in range(50)
        ]

        response = self.client.post(
            self.endpoint,
            {'distribution_ids': [record.id for record in records]},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['released_ids']), 50)
        self.assertEqual(response.data['skipped'], [])

        shared_inventory.refresh_from_db()
        self.assertEqual(shared_inventory.quantity_available, 10)
        self.assertEqual(
            DistributionRecord.objects.filter(
                id__in=[record.id for record in records],
                status=DistributionRecord.DistributionStatus.RELEASED,
            ).count(),
            50,
        )


class DistributionReleaseAndSecurityTests(APITestCase):
    def setUp(self):
        self.User = get_user_model()

        self.staff_role, _ = Role.objects.get_or_create(name='Staff')
        self.farmer_role, _ = Role.objects.get_or_create(name='Farmer')
        self.distributor_role, _ = Role.objects.get_or_create(name='Distributor')

        self.staff_user = self.User.objects.create_user(
            username='release_staff_test',
            password='pass1234',
            email='release_staff_test@example.com',
        )
        UserRole.objects.create(user=self.staff_user, role=self.staff_role)

        self.farmer_user = self.User.objects.create_user(
            username='release_farmer_test',
            password='pass1234',
            email='release_farmer_test@example.com',
        )
        UserRole.objects.create(user=self.farmer_user, role=self.farmer_role)

        self.other_farmer_user = self.User.objects.create_user(
            username='release_farmer_other_test',
            password='pass1234',
            email='release_farmer_other_test@example.com',
        )
        UserRole.objects.create(user=self.other_farmer_user, role=self.farmer_role)

        self.distributor_user = self.User.objects.create_user(
            username='release_distributor_test',
            password='pass1234',
            email='release_distributor_test@example.com',
        )
        UserRole.objects.create(user=self.distributor_user, role=self.distributor_role)

        self.other_distributor_user = self.User.objects.create_user(
            username='release_distributor_other_test',
            password='pass1234',
            email='release_distributor_other_test@example.com',
        )
        UserRole.objects.create(user=self.other_distributor_user, role=self.distributor_role)

        self.farmer_profile = FarmerProfile.objects.create(
            user=self.farmer_user,
            first_name='Release',
            last_name='Farmer',
            address='Bauang, La Union',
            contact_number='09000000000',
            credentials_status=FarmerProfile.CredentialsStatus.VERIFIED,
            farm_location='Bauang',
            planting_season='Dry',
        )
        self.other_farmer_profile = FarmerProfile.objects.create(
            user=self.other_farmer_user,
            first_name='Other',
            last_name='Farmer',
            address='Bauang, La Union',
            contact_number='09000000003',
            credentials_status=FarmerProfile.CredentialsStatus.VERIFIED,
            farm_location='Bauang',
            planting_season='Dry',
        )

        self.program = Program.objects.create(
            name='Release Test Program',
            description='Program for release tests',
            start_date='2026-01-01',
            end_date='2026-12-31',
        )
        self.intervention = Intervention.objects.create(
            program=self.program,
            name='Release Test Intervention',
            description='Intervention for release tests',
            start_date='2026-01-01',
            end_date='2026-12-31',
        )

        self.distributor = Distributor.objects.create(
            user=self.distributor_user,
            name='Release Distributor',
            location='Bauang',
            services_offered='Delivery',
            accreditation_status=Distributor.AccreditationStatus.ACCREDITED,
            contact_person='Release Person',
            contact_number='09000000001',
        )
        self.other_distributor = Distributor.objects.create(
            user=self.other_distributor_user,
            name='Release Other Distributor',
            location='Bauang',
            services_offered='Delivery',
            accreditation_status=Distributor.AccreditationStatus.ACCREDITED,
            contact_person='Other Person',
            contact_number='09000000002',
        )

        self.inventory = InputInventory.objects.create(
            intervention=self.intervention,
            input_name='Release Input',
            quantity_received=20,
            quantity_available=20,
            distributor=self.distributor,
        )

        self.distribution = DistributionRecord.objects.create(
            farmer=self.farmer_profile,
            input_inventory=self.inventory,
            quantity_released=4,
            assigned_distributor=self.distributor,
            status=DistributionRecord.DistributionStatus.PENDING,
        )
        self.other_distribution = DistributionRecord.objects.create(
            farmer=self.farmer_profile,
            input_inventory=self.inventory,
            quantity_released=2,
            assigned_distributor=self.other_distributor,
            status=DistributionRecord.DistributionStatus.PENDING,
        )
        DistributionStatusLog.objects.create(
            distribution=self.distribution,
            previous_status='',
            new_status=DistributionRecord.DistributionStatus.PENDING,
            remarks='Created for timeline access tests.',
            updated_by=self.staff_user,
        )

    def test_release_requires_staff_or_admin_role(self):
        self.client.force_authenticate(user=self.farmer_user)
        response = self.client.post(
            f'/api/distributions/{self.distribution.id}/release/',
            {},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_release_updates_inventory_transaction_and_timeline(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.post(
            f'/api/distributions/{self.distribution.id}/release/',
            {},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.distribution.refresh_from_db()
        self.inventory.refresh_from_db()

        self.assertEqual(
            self.distribution.status,
            DistributionRecord.DistributionStatus.RELEASED,
        )
        self.assertEqual(self.distribution.release_officer_id, self.staff_user.id)
        self.assertEqual(self.inventory.quantity_available, 16)

        self.assertTrue(
            InventoryTransaction.objects.filter(
                inventory=self.inventory,
                transaction_type=InventoryTransaction.TransactionType.ALLOCATED,
                quantity=4,
                reference=f'distribution:{self.distribution.id}',
            ).exists()
        )
        self.assertTrue(
            DistributionStatusLog.objects.filter(
                distribution=self.distribution,
                previous_status=DistributionRecord.DistributionStatus.PENDING,
                new_status=DistributionRecord.DistributionStatus.RELEASED,
                remarks='Distribution released for delivery.',
                updated_by=self.staff_user,
            ).exists()
        )

    def test_distributor_list_is_scoped_to_assigned_records(self):
        self.client.force_authenticate(user=self.distributor_user)
        response = self.client.get('/api/distributions/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = {item['id'] for item in response.data}
        self.assertEqual(ids, {self.distribution.id})

    def test_distributor_cannot_update_pending_distribution(self):
        self.client.force_authenticate(user=self.distributor_user)
        response = self.client.patch(
            f'/api/distributions/{self.distribution.id}/',
            {'status': DistributionRecord.DistributionStatus.DELIVERED},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Distribution must be released', response.data['detail'])

    def test_distributor_can_update_status_after_release(self):
        self.client.force_authenticate(user=self.staff_user)
        self.client.post(
            f'/api/distributions/{self.distribution.id}/release/',
            {},
            format='json',
        )

        self.client.force_authenticate(user=self.distributor_user)
        response = self.client.patch(
            f'/api/distributions/{self.distribution.id}/',
            {
                'status': DistributionRecord.DistributionStatus.DELIVERED,
                'remarks': 'Delivered to farmer',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.distribution.refresh_from_db()
        self.assertEqual(
            self.distribution.status,
            DistributionRecord.DistributionStatus.DELIVERED,
        )
        self.assertEqual(self.distribution.remarks, 'Delivered to farmer')

        self.assertTrue(
            DistributionStatusLog.objects.filter(
                distribution=self.distribution,
                previous_status=DistributionRecord.DistributionStatus.RELEASED,
                new_status=DistributionRecord.DistributionStatus.DELIVERED,
                updated_by=self.distributor_user,
            ).exists()
        )

    def test_staff_can_view_distribution_timeline(self):
        self.client.force_authenticate(user=self.staff_user)
        response = self.client.get(f'/api/distributions/{self.distribution.id}/timeline/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['distribution'], self.distribution.id)

    def test_assigned_distributor_can_view_timeline(self):
        self.client.force_authenticate(user=self.distributor_user)
        response = self.client.get(f'/api/distributions/{self.distribution.id}/timeline/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unassigned_distributor_cannot_view_timeline(self):
        self.client.force_authenticate(user=self.other_distributor_user)
        response = self.client.get(f'/api/distributions/{self.distribution.id}/timeline/')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_non_owner_farmer_cannot_view_timeline(self):
        self.client.force_authenticate(user=self.other_farmer_user)
        response = self.client.get(f'/api/distributions/{self.distribution.id}/timeline/')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
