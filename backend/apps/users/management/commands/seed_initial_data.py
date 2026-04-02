from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.distributors.models import Distributor
from apps.farmers.models import FarmerProfile, InterventionApplication
from apps.inventory.models import InputInventory
from apps.programs.models import Intervention, Program
from apps.users.models import Role, UserRole


ROLE_NAMES = ['Admin', 'Staff', 'Farmer', 'Distributor']

DEMO_USERS = [
    {
        'username': 'admin',
        'email': 'admin@bauang.local',
        'role': 'Admin',
        'is_staff': True,
        'is_superuser': True,
    },
    {
        'username': 'staff',
        'email': 'staff@bauang.local',
        'role': 'Staff',
        'is_staff': True,
        'is_superuser': False,
    },
    {
        'username': 'farmer',
        'email': 'farmer@bauang.local',
        'role': 'Farmer',
        'is_staff': False,
        'is_superuser': False,
    },
    {
        'username': 'distributor',
        'email': 'distributor@bauang.local',
        'role': 'Distributor',
        'is_staff': False,
        'is_superuser': False,
    },
]


class Command(BaseCommand):
    help = 'Seed default roles and demo users for local development.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--password',
            default='ChangeMe123!',
            help='Password to use for new demo users.',
        )
        parser.add_argument(
            '--reset-passwords',
            action='store_true',
            help='Reset password for existing demo users as well.',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        password = options['password']
        reset_passwords = options['reset_passwords']

        role_map = {}
        for role_name in ROLE_NAMES:
            role, created = Role.objects.get_or_create(name=role_name)
            role_map[role_name] = role
            action = 'Created' if created else 'Exists'
            self.stdout.write(self.style.SUCCESS(f'{action} role: {role_name}'))

        User = get_user_model()
        user_map = {}

        for config in DEMO_USERS:
            user, created = User.objects.get_or_create(
                username=config['username'],
                defaults={
                    'email': config['email'],
                    'is_staff': config['is_staff'],
                    'is_superuser': config['is_superuser'],
                },
            )

            changed = False
            if created:
                user.set_password(password)
                changed = True
            elif reset_passwords:
                user.set_password(password)
                changed = True

            if user.email != config['email']:
                user.email = config['email']
                changed = True

            if user.is_staff != config['is_staff']:
                user.is_staff = config['is_staff']
                changed = True

            if user.is_superuser != config['is_superuser']:
                user.is_superuser = config['is_superuser']
                changed = True

            if changed:
                user.save()

            role = role_map[config['role']]
            UserRole.objects.get_or_create(user=user, role=role)
            user_map[config['username']] = user

            action = 'Created' if created else 'Updated'
            self.stdout.write(
                self.style.SUCCESS(
                    f'{action} user: {user.username} (role: {config["role"]})'
                )
            )

        self.seed_domain_demo_records(
            farmer_user=user_map['farmer'],
            distributor_user=user_map['distributor'],
        )

        self.stdout.write(self.style.SUCCESS('Seeding complete.'))

    def seed_domain_demo_records(self, farmer_user, distributor_user):
        today = date.today()

        program, created_program = Program.objects.get_or_create(
            name='Rice Support 2026',
            defaults={
                'description': 'Government intervention for rice seed and nutrient support.',
                'start_date': today,
                'end_date': today + timedelta(days=120),
            },
        )

        intervention, created_intervention = Intervention.objects.get_or_create(
            program=program,
            name='Seed Pack A',
            defaults={
                'description': 'Starter package for wet season rice cultivation.',
                'start_date': today,
                'end_date': today + timedelta(days=90),
            },
        )

        profile, created_profile = FarmerProfile.objects.get_or_create(
            user=farmer_user,
            defaults={
                'first_name': 'Demo',
                'last_name': 'Farmer',
                'address': 'Poblacion, Bauang, La Union',
                'contact_number': '09171234567',
                'credentials_status': FarmerProfile.CredentialsStatus.PENDING,
                'farm_location': 'Barangay Poblacion Block 4',
                'planting_season': 'Wet Season',
            },
        )

        _, created_application = InterventionApplication.objects.get_or_create(
            farmer=profile,
            intervention=intervention,
            defaults={
                'status': InterventionApplication.ApplicationStatus.PENDING,
                'remarks': 'Seeded initial application for local testing.',
            },
        )

        distributor, created_distributor = Distributor.objects.get_or_create(
            name='Bauang North Logistics',
            defaults={
                'user': distributor_user,
                'location': 'Bauang, La Union',
                'services_offered': 'Last-mile distribution and route updates',
                'accreditation_status': Distributor.AccreditationStatus.ACCREDITED,
                'contact_person': 'Route Supervisor',
                'contact_number': '09170001111',
            },
        )

        if distributor.user_id != distributor_user.id:
            distributor.user = distributor_user
            distributor.save(update_fields=['user'])

        inventory, created_inventory = InputInventory.objects.get_or_create(
            intervention=intervention,
            input_name='Rice Seed Pack A',
            defaults={
                'quantity_received': 500,
                'quantity_available': 500,
                'distributor': distributor,
                'delivery_date': today,
            },
        )

        if inventory.distributor_id != distributor.id:
            inventory.distributor = distributor
            inventory.save(update_fields=['distributor', 'last_updated'])

        program_action = 'Created' if created_program else 'Exists'
        intervention_action = 'Created' if created_intervention else 'Exists'
        profile_action = 'Created' if created_profile else 'Exists'
        application_action = 'Created' if created_application else 'Exists'
        distributor_action = 'Created' if created_distributor else 'Exists'
        inventory_action = 'Created' if created_inventory else 'Exists'

        self.stdout.write(self.style.SUCCESS(f'{program_action} program: {program.name}'))
        self.stdout.write(
            self.style.SUCCESS(f'{intervention_action} intervention: {intervention.name}')
        )
        self.stdout.write(
            self.style.SUCCESS(
                f'{profile_action} farmer profile for: {farmer_user.username}'
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f'{application_action} intervention application for: {farmer_user.username}'
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f'{distributor_action} distributor: {distributor.name}'
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f'{inventory_action} inventory item: {inventory.input_name}'
            )
        )
