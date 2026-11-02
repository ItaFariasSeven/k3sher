from django.db import models

# Create your models here.

class Message(models.Model):
    title = models.CharField(max_length=120)
    body = models.TextField()
    category = models.CharField(
        max_length=50,
        blank=True,
        default='Geral',
        help_text='Ex: Oração, Motivação, Agradecimento'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title