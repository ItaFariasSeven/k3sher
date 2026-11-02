from django.urls import path
from .views import AlarmListCreateView, AlarmDetailView

urlpatterns = [
    path('', AlarmListCreateView.as_view(), name='alarm-list'),
    path('<int:pk>/', AlarmDetailView.as_view(), name='alarm-detail'),
]
