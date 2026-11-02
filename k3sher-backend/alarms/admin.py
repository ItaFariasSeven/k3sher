from django.contrib import admin
from .models import Alarm

# Register your models here.

@admin.register(Alarm)
class AlarmAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'time', 'repeat', 'is_active', 'created_at']
    list_filter = ['repeat', 'is_active']
    search_fields = ['title', 'user__email']