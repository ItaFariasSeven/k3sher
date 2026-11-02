from django.urls import path
from .views import (
    PrayerRequestListCreateView,
    PrayerRequestDetailView,
    ThankfulnessListCreateView,
)

urlpatterns = [
    path('requests/', PrayerRequestListCreateView.as_view(), name='prayer-list'),
    path('requests/<int:pk>/', PrayerRequestDetailView.as_view(), name='prayer-detail'),
    path('thanks/', ThankfulnessListCreateView.as_view(), name='thanks-list'),
]
