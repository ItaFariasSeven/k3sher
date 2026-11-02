from rest_framework import generics, permissions
from .models import PrayerRequest, Thankfulness
from .serializers import PrayerRequestSerializer, ThankfulnessSerializer

# Create your views here.

class PrayerRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = PrayerRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PrayerRequest.objects.filter(is_private=False) | PrayerRequest.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PrayerRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PrayerRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PrayerRequest.objects.filter(user=self.request.user)


class ThankfulnessListCreateView(generics.ListCreateAPIView):
    serializer_class = ThankfulnessSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Thankfulness.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)