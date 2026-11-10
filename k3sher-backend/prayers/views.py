from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import PrayerRequest, Thankfulness
from .serializers import PrayerRequestSerializer, ThankfulnessSerializer

# Create your views here.

class PrayerRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = PrayerRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            PrayerRequest.objects.filter(is_private=False) |
            PrayerRequest.objects.filter(user=self.request.user)
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PrayerRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PrayerRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PrayerRequest.objects.filter(user=self.request.user)


class PrayerRequestAnswerView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        prayer = get_object_or_404(
            PrayerRequest,
            pk=pk,
            user=request.user
        )

        prayer.is_answered = True
        prayer.save()

        thank = Thankfulness.objects.create(
            user=request.user,
            prayer_request=prayer,
            title=prayer.title,
            description=prayer.description,
        )

        serializer = ThankfulnessSerializer(thank)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ThankfulnessListCreateView(generics.ListCreateAPIView):
    serializer_class = ThankfulnessSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Thankfulness.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)