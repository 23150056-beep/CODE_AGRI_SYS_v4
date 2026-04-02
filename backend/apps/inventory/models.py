from django.db import models

from apps.distributors.models import Distributor
from apps.programs.models import Intervention


class InputInventory(models.Model):
    intervention = models.ForeignKey(
        Intervention,
        on_delete=models.CASCADE,
        related_name='inventory_items',
    )
    input_name = models.CharField(max_length=255)
    quantity_received = models.PositiveIntegerField(default=0)
    quantity_available = models.PositiveIntegerField(default=0)
    distributor = models.ForeignKey(
        Distributor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='inventory_items',
    )
    delivery_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['input_name']

    def __str__(self):
        return f'{self.input_name} ({self.quantity_available})'


class InventoryTransaction(models.Model):
    class TransactionType(models.TextChoices):
        RECEIVED = 'received', 'Received'
        ALLOCATED = 'allocated', 'Allocated'
        ADJUSTED = 'adjusted', 'Adjusted'

    inventory = models.ForeignKey(
        InputInventory,
        on_delete=models.CASCADE,
        related_name='transactions',
    )
    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices)
    quantity = models.IntegerField()
    reference = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.inventory.input_name} - {self.transaction_type} ({self.quantity})'
