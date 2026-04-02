from django.conf import settings
from django.db import models


class Distributor(models.Model):
    class AccreditationStatus(models.TextChoices):
        ACCREDITED = 'Accredited', 'Accredited'
        PENDING = 'Pending', 'Pending'
        SUSPENDED = 'Suspended', 'Suspended'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='distributor_profile',
    )
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    services_offered = models.TextField()
    accreditation_status = models.CharField(
        max_length=20,
        choices=AccreditationStatus.choices,
        default=AccreditationStatus.PENDING,
    )
    contact_person = models.CharField(max_length=255)
    contact_number = models.CharField(max_length=30)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name
