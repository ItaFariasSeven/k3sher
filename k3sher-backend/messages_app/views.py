from rest_framework import generics, permissions
from .models import Message
from .serializers import MessageSerializer

# Create your views here.

class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Message.objects.filter(is_active=True)