from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils import timezone
import secrets
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from .serializers import (
    EmailTokenObtainPairSerializer,
    RegisterSerializer,
    UserSerializer,
    SendCodeSerializer,
    VerifyCodeSerializer,
    ResetPasswordSerializer,
)
from .models import VerificationCode


User = get_user_model()


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def send_verification_email(user, code, purpose):
    if purpose == 'register':
        subject = 'K3sher - Código de verificação'
        message = f'''
        Olá, {user.first_name or user.email}!

        Seu código de verificação é: {code}

        Ele expira em 10 minutos.
        '''
    else:
        subject = 'K3sher - Recuperação de senha'
        message = f'''
        Olá, {user.first_name or user.email}!

        Seu código para redefinir a senha é: {code}

        Ele expira em 10 minutos.
        '''

    send_mail(
        subject=subject,
        message=message,
        from_email=None,
        recipient_list=[user.email],
        fail_silently=False,
    )


class SendVerificationCodeView(APIView):
    def post(self, request):
        serializer = SendCodeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        purpose = serializer.validated_data['purpose']

        if purpose == 'register':
            if User.objects.filter(email=email).exists():
                return Response(
                    {'email': 'Este email já está cadastrado.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user, _ = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': '',
                    'last_name': '',
                    'phone': '',
                    'is_active': False,
                }
            )
        else:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response(
                    {'email': 'Usuário não encontrado.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Invalida códigos antigos
        VerificationCode.objects.filter(user=user, purpose=purpose, used=False).update(used=True)

        # Gera novo código de 6 dígitos
        code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])

        VerificationCode.objects.create(
            user=user,
            code=code,
            purpose=purpose,
        )

        # Envia email
        send_verification_email(user, code, purpose)

        return Response({'message': 'Código enviado com sucesso.'})


class VerifyCodeView(APIView):
    def post(self, request):
        serializer = VerifyCodeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        code = serializer.validated_data['code']
        purpose = serializer.validated_data['purpose']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'email': 'Usuário não encontrado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            verification = VerificationCode.objects.filter(
                user=user,
                code=code,
                purpose=purpose,
                used=False,
            ).latest('created_at')
        except VerificationCode.DoesNotExist:
            return Response(
                {'code': 'Código inválido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if verification.is_expired:
            return Response(
                {'code': 'Código expirado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        verification.used = True
        verification.save()

        return Response({'message': 'Código verificado com sucesso.'})


class ResetPasswordView(APIView):
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        code = serializer.validated_data['code']
        new_password = serializer.validated_data['new_password']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'email': 'Usuário não encontrado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            verification = VerificationCode.objects.filter(
                user=user,
                code=code,
                purpose='password_reset',
                used=False,
            ).latest('created_at')
        except VerificationCode.DoesNotExist:
            return Response(
                {'code': 'Código inválido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if verification.is_expired:
            return Response(
                {'code': 'Código expirado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        verification.used = True
        verification.save()

        return Response({'message': 'Senha redefinida com sucesso.'})

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser) # Necessário para receber a imagem

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        # partial=True permite que você atualize apenas um campo (ex: só a bio) se quiser
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)