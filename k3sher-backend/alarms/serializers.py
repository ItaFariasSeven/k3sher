from rest_framework import serializers
from .models import Alarm


class AlarmSerializer(serializers.ModelSerializer):
    settings = serializers.JSONField(required=False)

    class Meta:
        model = Alarm
        fields = [
            'id',
            'title',
            'time',
            'repeat',
            'is_active',
            'settings',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate_settings(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError('As configurações devem ser um objeto JSON.')

        days = value.get('days')
        if days is not None:
            if not isinstance(days, list) or len(days) != 7 or not all(isinstance(day, bool) for day in days):
                raise serializers.ValidationError('days deve conter sete valores booleanos, de domingo a sábado.')

        snooze_minutes = value.get('snoozeMinutes', 5)
        snooze_count = value.get('snoozeCount', 3)
        if not isinstance(snooze_minutes, int) or not 1 <= snooze_minutes <= 30:
            raise serializers.ValidationError('snoozeMinutes deve estar entre 1 e 30.')
        if not isinstance(snooze_count, int) or not 1 <= snooze_count <= 10:
            raise serializers.ValidationError('snoozeCount deve estar entre 1 e 10.')

        return value
