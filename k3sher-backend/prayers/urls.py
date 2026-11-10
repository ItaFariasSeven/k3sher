from django.urls import path
from .views import ( PrayerRequestListCreateView, PrayerRequestDetailView, PrayerRequestAnswerView, ThankfulnessListCreateView,)

urlpatterns = [
    path('requests/', PrayerRequestListCreateView.as_view(), name='prayer-list'),
    path('requests/<int:pk>/', PrayerRequestDetailView.as_view(), name='prayer-detail'),
    path('requests/<int:pk>/answer/', PrayerRequestAnswerView.as_view(), name='prayer-answer'),
    path('thanks/', ThankfulnessListCreateView.as_view(), name='thanks-list'),
]
