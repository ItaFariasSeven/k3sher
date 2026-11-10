from rest_framework import serializers
from .models import PrayerRequest, PrayerIntercession, Thankfulness


class PrayerRequestSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    intercessions_count = serializers.IntegerField(
        source='intercessions.count',
        read_only=True
    )

    class Meta:
        model = PrayerRequest
        fields = [
            'id', 'user', 'title', 'description', 'category',
            'prayer_time', 'enable_notification',
            'is_answered', 'is_private', 'intercessions_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user']


class ThankfulnessSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Thankfulness
        fields = ['id', 'user', 'prayer_request', 'title', 'description', 'created_at','answered_at']
        read_only_fields = ['user']