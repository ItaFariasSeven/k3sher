from datetime import timezone
from pydoc import cli

from django.db import models
from django.conf import settings

# Create your models here.

class PrayerRequest(models.Model):
    CATEGORY_CHOICES = [
        ('health', 'Saúde'),
        ('family', 'Família'),
        ('work', 'Trabalho'),
        ('finance', 'Finanças'),
        ('relationship', 'Relacionamento'),
        ('other', 'Outros'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='prayer_requests'
    )
    title = models.CharField(max_length=120)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    prayer_time = models.TimeField(null=True, blank=True)
    enable_notification = models.BooleanField(default=False)
    is_answered = models.BooleanField(default=False)
    is_private = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    answered_at = models.DateTimeField(null=True, blank=True)

    def mark_as_answered(self):
        from django.utils import timezone
        self.is_answered = True
        self.answered_at = timezone.now()
        self.save()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class PrayerIntercession(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='intercessions'
    )
    prayer_request = models.ForeignKey(
        PrayerRequest,
        on_delete=models.CASCADE,
        related_name='intercessions'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'prayer_request')


class Thankfulness(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='thankfulness'
    )
    prayer_request = models.ForeignKey(
        PrayerRequest,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='answered_thanks'
    )
    title = models.CharField(max_length=120)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    answered_at = models.DateTimeField(auto_now_add=True)

    @classmethod
    def thank_prayer_request(prayer_request_id):
        prayer_request = PrayerRequest.objects.get(id=prayer_request_id)
        prayer_request.is_answered = True
        prayer_request.answered_at = timezone.now()
        prayer_request.save()

        thank = cli.objects.create(
            user=prayer_request.user,
            prayer_request=prayer_request,
            title=prayer_request.title,
            description=prayer_request.description,
        )
        return thank

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title