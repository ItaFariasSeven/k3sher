from rest_framework import generics, permissions
from .models import Alarm
from .serializers import AlarmSerializer


class AlarmListCreateView(generics.ListCreateAPIView):
    serializer_class = AlarmSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Alarm.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AlarmDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AlarmSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Impede que um usuário consulte ou altere alarmes de outra conta.
        return Alarm.objects.filter(user=self.request.user)
