from django.conf import settings
from django.db import models

from apps.distributors.models import Distributor
from apps.farmers.models import FarmerProfile
from apps.inventory.models import InputInventory


class DistributionRecord(models.Model):
    class DistributionStatus(models.TextChoices):
        PENDING = 'Pending', 'Pending'
        RELEASED = 'Released', 'Released'
        DELIVERED = 'Delivered', 'Delivered'
        DELAYED = 'Delayed', 'Delayed'
        RESCHEDULED = 'Rescheduled', 'Rescheduled'
        CANCELLED = 'Cancelled', 'Cancelled'

    farmer = models.ForeignKey(
        FarmerProfile,
        on_delete=models.CASCADE,
        related_name='distribution_records',
    )
    input_inventory = models.ForeignKey(
        InputInventory,
        on_delete=models.CASCADE,
        related_name='distribution_records',
    )
    quantity_released = models.PositiveIntegerField()
    assigned_distributor = models.ForeignKey(
        Distributor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='distribution_records',
    )
    distribution_date = models.DateTimeField(auto_now_add=True)
    release_officer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='released_distributions',
    )
    status = models.CharField(
        max_length=20,
        choices=DistributionStatus.choices,
        default=DistributionStatus.PENDING,
    )
    remarks = models.TextField(blank=True)

    class Meta:
        ordering = ['-distribution_date']

    def __str__(self):
        return f'{self.farmer} - {self.input_inventory.input_name} ({self.quantity_released})'


class DistributionStatusLog(models.Model):
    distribution = models.ForeignKey(
        DistributionRecord,
        on_delete=models.CASCADE,
        related_name='status_logs',
    )
    previous_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20)
    remarks = models.TextField(blank=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='distribution_status_logs',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return (
            f'Distribution #{self.distribution_id}: '
            f'{self.previous_status or "None"} -> {self.new_status}'
        )
