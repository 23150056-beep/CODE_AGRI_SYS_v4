from django.conf import settings
from django.db import models

from apps.programs.models import Intervention


class FarmerProfile(models.Model):
    class CredentialsStatus(models.TextChoices):
        VERIFIED = 'Verified', 'Verified'
        PENDING = 'Pending', 'Pending'
        REJECTED = 'Rejected', 'Rejected'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='farmer_profile',
    )
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    address = models.TextField()
    contact_number = models.CharField(max_length=30)
    credentials_status = models.CharField(
        max_length=20,
        choices=CredentialsStatus.choices,
        default=CredentialsStatus.PENDING,
    )
    farm_location = models.CharField(max_length=255)
    planting_season = models.CharField(max_length=100)
    date_registered = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f'{self.last_name}, {self.first_name}'


class InterventionApplication(models.Model):
    class ApplicationStatus(models.TextChoices):
        PENDING = 'Pending', 'Pending'
        APPROVED = 'Approved', 'Approved'
        REJECTED = 'Rejected', 'Rejected'

    farmer = models.ForeignKey(
        FarmerProfile,
        on_delete=models.CASCADE,
        related_name='applications',
    )
    intervention = models.ForeignKey(
        Intervention,
        on_delete=models.CASCADE,
        related_name='applications',
    )
    application_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=ApplicationStatus.choices,
        default=ApplicationStatus.PENDING,
    )
    remarks = models.TextField(blank=True)

    class Meta:
        ordering = ['-application_date']
        unique_together = ('farmer', 'intervention')

    def __str__(self):
        return f'{self.farmer} - {self.intervention} ({self.status})'
