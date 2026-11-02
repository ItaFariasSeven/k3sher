from rest_framework import serializers
from .models import Alarm


class AlarmSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alarm
        fields = ['id', 'title', 'time', 'repeat', 'is_active', 'created_at']
        read_only_fields = ['user']
