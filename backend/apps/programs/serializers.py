from rest_framework import serializers

from apps.programs.models import Intervention, Program


class ProgramSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        start_date = attrs.get(
            'start_date',
            self.instance.start_date if self.instance else None,
        )
        end_date = attrs.get(
            'end_date',
            self.instance.end_date if self.instance else None,
        )

        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError(
                {'end_date': ['End date must be on or after start date.']}
            )

        return attrs

    class Meta:
        model = Program
        fields = [
            'id',
            'name',
            'description',
            'start_date',
            'end_date',
            'created_at',
            'updated_at',
        ]


class InterventionSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        instance = self.instance
        program = attrs.get('program', instance.program if instance else None)
        start_date = attrs.get('start_date', instance.start_date if instance else None)
        end_date = attrs.get('end_date', instance.end_date if instance else None)

        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError(
                {'end_date': ['End date must be on or after start date.']}
            )

        if program and start_date and start_date < program.start_date:
            raise serializers.ValidationError(
                {
                    'start_date': [
                        'Intervention start date cannot be earlier than program start date.'
                    ]
                }
            )

        if program and end_date and end_date > program.end_date:
            raise serializers.ValidationError(
                {
                    'end_date': [
                        'Intervention end date cannot be later than program end date.'
                    ]
                }
            )

        return attrs

    class Meta:
        model = Intervention
        fields = [
            'id',
            'program',
            'name',
            'description',
            'start_date',
            'end_date',
            'created_at',
            'updated_at',
        ]
