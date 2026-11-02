from django.contrib import admin
from .models import PrayerRequest, PrayerIntercession, Thankfulness

# Register your models here.

@admin.register(PrayerRequest)
class PrayerRequestAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'category', 'is_answered', 'is_private', 'created_at']
    list_filter = ['category', 'is_answered', 'is_private', 'created_at']
    search_fields = ['title', 'description', 'user__email']


@admin.register(PrayerIntercession)
class PrayerIntercessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'prayer_request', 'created_at']


@admin.register(Thankfulness)
class ThankfulnessAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'prayer_request', 'created_at']
    search_fields = ['title', 'description', 'user__email']