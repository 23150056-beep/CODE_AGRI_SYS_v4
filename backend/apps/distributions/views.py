from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.distributions.models import DistributionRecord
from apps.distributions.models import DistributionStatusLog
from apps.distributions.serializers import (
    DistributionRecordSerializer,
    DistributionStatusLogSerializer,
)
from apps.inventory.models import InputInventory
from apps.inventory.models import InventoryTransaction
from apps.users.permissions import IsAdminOrStaff, has_any_role


class DistributionRecordViewSet(viewsets.ModelViewSet):
    queryset = DistributionRecord.objects.select_related(
        'farmer',
        'input_inventory',
        'assigned_distributor',
        'release_officer',
    ).all()
    serializer_class = DistributionRecordSerializer
    permission_classes = [IsAuthenticated]

    def _log_status_event(self, record, previous_status, actor, remarks=''):
        DistributionStatusLog.objects.create(
            distribution=record,
            previous_status=previous_status or '',
            new_status=record.status,
            remarks=remarks,
            updated_by=actor,
        )

    def get_queryset(self):
        user = self.request.user
        if has_any_role(user, ['Admin', 'Staff']):
            return self.queryset
        if has_any_role(user, ['Farmer']) and hasattr(user, 'farmer_profile'):
            return self.queryset.filter(farmer=user.farmer_profile)
        if has_any_role(user, ['Distributor']) and hasattr(user, 'distributor_profile'):
            return self.queryset.filter(assigned_distributor=user.distributor_profile)
        return self.queryset.none()

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'release', 'bulk_release']:
            return [IsAdminOrStaff()]
        return [IsAuthenticated()]

    def _enforce_update_permission(self, record, payload):
        user = self.request.user

        if has_any_role(user, ['Admin', 'Staff']):
            return

        if has_any_role(user, ['Distributor']) and hasattr(user, 'distributor_profile'):
            if record.assigned_distributor_id != user.distributor_profile.id:
                raise PermissionDenied('You can only update records assigned to you.')

            allowed_fields = {'status', 'remarks'}
            incoming_fields = set(payload.keys())
            if not incoming_fields.issubset(allowed_fields):
                raise PermissionDenied('Distributors can only update status and remarks.')

            allowed_statuses = {
                DistributionRecord.DistributionStatus.DELIVERED,
                DistributionRecord.DistributionStatus.DELAYED,
                DistributionRecord.DistributionStatus.RESCHEDULED,
            }

            requested_status = payload.get('status')
            if requested_status and requested_status not in allowed_statuses:
                raise PermissionDenied('Invalid distributor status update.')

            if record.status in {
                DistributionRecord.DistributionStatus.PENDING,
                DistributionRecord.DistributionStatus.CANCELLED,
            }:
                raise PermissionDenied(
                    'Distribution must be released before delivery status updates.'
                )

            return

        raise PermissionDenied('You do not have permission to update this record.')

    def update(self, request, *args, **kwargs):
        record = self.get_object()
        self._enforce_update_permission(record, request.data)
        previous_status = record.status
        previous_remarks = record.remarks
        response = super().update(request, *args, **kwargs)
        record.refresh_from_db()

        if record.status != previous_status or record.remarks != previous_remarks:
            self._log_status_event(
                record,
                previous_status=previous_status,
                actor=request.user,
                remarks=request.data.get('remarks', record.remarks),
            )

        return response

    def partial_update(self, request, *args, **kwargs):
        record = self.get_object()
        self._enforce_update_permission(record, request.data)
        previous_status = record.status
        previous_remarks = record.remarks
        response = super().partial_update(request, *args, **kwargs)
        record.refresh_from_db()

        if record.status != previous_status or record.remarks != previous_remarks:
            self._log_status_event(
                record,
                previous_status=previous_status,
                actor=request.user,
                remarks=request.data.get('remarks', record.remarks),
            )

        return response

    def perform_create(self, serializer):
        record = serializer.save(release_officer=self.request.user)
        self._log_status_event(
            record,
            previous_status='',
            actor=self.request.user,
            remarks=record.remarks,
        )

    @action(detail=True, methods=['post'], url_path='release')
    def release(self, request, pk=None):
        record = self.get_object()

        if record.status != DistributionRecord.DistributionStatus.PENDING:
            return Response(
                {'detail': 'Only pending distributions can be released.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        inventory = record.input_inventory
        if inventory.quantity_available < record.quantity_released:
            return Response(
                {'detail': 'Insufficient inventory available for release.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            inventory.quantity_available -= record.quantity_released
            inventory.save(update_fields=['quantity_available', 'last_updated'])

            InventoryTransaction.objects.create(
                inventory=inventory,
                transaction_type=InventoryTransaction.TransactionType.ALLOCATED,
                quantity=record.quantity_released,
                reference=f'distribution:{record.id}',
            )

            record.status = DistributionRecord.DistributionStatus.RELEASED
            record.release_officer = request.user
            record.save(update_fields=['status', 'release_officer'])

            self._log_status_event(
                record,
                previous_status=DistributionRecord.DistributionStatus.PENDING,
                actor=request.user,
                remarks='Distribution released for delivery.',
            )

        serializer = self.get_serializer(record)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='bulk-release')
    def bulk_release(self, request):
        ids = request.data.get('distribution_ids', [])

        if not isinstance(ids, list) or not ids:
            return Response(
                {'detail': 'distribution_ids must be a non-empty array.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        records = list(self.queryset.filter(id__in=ids))
        record_map = {record.id: record for record in records}
        released_ids = []
        skipped = []

        for requested_id in ids:
            record = record_map.get(requested_id)
            if not record:
                skipped.append({'id': requested_id, 'reason': 'Not found.'})
                continue

            if record.status != DistributionRecord.DistributionStatus.PENDING:
                skipped.append(
                    {
                        'id': record.id,
                        'reason': 'Only pending distributions can be released.',
                    }
                )
                continue

            with transaction.atomic():
                inventory = InputInventory.objects.select_for_update().get(
                    id=record.input_inventory_id
                )

                if inventory.quantity_available < record.quantity_released:
                    skipped.append(
                        {
                            'id': record.id,
                            'reason': 'Insufficient inventory available for release.',
                        }
                    )
                    continue

                inventory.quantity_available -= record.quantity_released
                inventory.save(update_fields=['quantity_available', 'last_updated'])

                InventoryTransaction.objects.create(
                    inventory=inventory,
                    transaction_type=InventoryTransaction.TransactionType.ALLOCATED,
                    quantity=record.quantity_released,
                    reference=f'distribution:{record.id}',
                )

                previous_status = record.status
                record.status = DistributionRecord.DistributionStatus.RELEASED
                record.release_officer = request.user
                record.save(update_fields=['status', 'release_officer'])

                self._log_status_event(
                    record,
                    previous_status=previous_status,
                    actor=request.user,
                    remarks='Distribution released via bulk action.',
                )

            released_ids.append(record.id)

        return Response(
            {
                'released_ids': released_ids,
                'skipped': skipped,
            }
        )

    @action(detail=True, methods=['get'], url_path='timeline')
    def timeline(self, request, pk=None):
        record = self.get_object()
        serializer = DistributionStatusLogSerializer(
            record.status_logs.select_related('updated_by').all(),
            many=True,
        )
        return Response(serializer.data)
