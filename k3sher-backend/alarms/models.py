from django.db import models
from django.conf import settings

# Create your models here.

class Alarm(models.Model):
    REPEAT_CHOICES = [
        ('once', 'Uma vez'),
        ('daily', 'Diário'),
        ('weekly', 'Semanal'),
        ('weekdays', 'Dias úteis'),
        ('weekends', 'Finais de semana'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='alarms')
    title = models.CharField(max_length=100)
    time = models.TimeField()
    repeat = models.CharField(max_length=10, choices=REPEAT_CHOICES, default='once')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['time']

    def __str__(self):
        return f"{self.title} - {self.time}"