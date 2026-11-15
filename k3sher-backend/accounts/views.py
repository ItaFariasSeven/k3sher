from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils import timezone
import secrets
from rest_framework.permissions import AllowAny, IsAuthenticated
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
import resend
import logging
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured


logger = logging.getLogger(__name__)


User = get_user_model()


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer

    authentication_classes = []
    permission_classes = [AllowAny]


class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def send_verification_email(user, code, purpose):

    if not settings.RESEND_API_KEY:
        raise ImproperlyConfigured(
            'RESEND_API_KEY não foi configurada.'
        )

    if not settings.RESEND_FROM_EMAIL:
        raise ImproperlyConfigured(
            'RESEND_FROM_EMAIL não foi configurada.'
        )

    resend.api_key = settings.RESEND_API_KEY

    nome = escape(user.first_name or user.email)

    if purpose == 'register':
        subject = 'K3SHER - Código de verificação'

        mensagem = (
            f'Olá, {nome}!\n\n'
            f'Seu código de verificação é: {code}\n\n'
            'Ele expira em 10 minutos.'
        )

        titulo = 'Confirme seu e-mail'

    else:
        subject = 'K3SHER - Recuperação de senha'

        mensagem = (
            f'Olá, {nome}!\n\n'
            f'Seu código para redefinir a senha é: {code}\n\n'
            'Ele expira em 10 minutos.'
        )

        titulo = 'Redefinição de senha'

    html = f"""
        <div style="font-family: Arial, sans-serif; padding: 24px;">
            <h2>{titulo}</h2>

            <p>Olá, {nome}!</p>

            <p>Seu código de verificação é:</p>

            <h1 style="letter-spacing: 8px;">{code}</h1>

            <p>Este código expira em 10 minutos.</p>

            <p>Se você não solicitou este código,
            ignore esta mensagem.</p>

            <p>Equipe K3SHER</p>
        </div>
    """

    return resend.Emails.send({
        "from": settings.RESEND_FROM_EMAIL,
        "to": [user.email],
        "subject": subject,
        "html": html,
        "text": mensagem,
    })


class SendVerificationCodeView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        etapa = "validar dados"

        try:
            serializer = SendCodeSerializer(data=request.data)

            if not serializer.is_valid():
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )

            email = serializer.validated_data['email']
            purpose = serializer.validated_data['purpose']

            etapa = "consultar usuário"

            if purpose == 'register':
                user = User.objects.filter(email=email).first()

                if user and user.is_active:
                    return Response(
                        {'email': ['Este e-mail já está cadastrado.']},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if not user:
                    etapa = "criar usuário pendente"

                    user = User.objects.create(
                        email=email,
                        first_name='',
                        last_name='',
                        phone='',
                        is_active=False,
                    )

            else:
                try:
                    user = User.objects.get(email=email)

                except User.DoesNotExist:
                    return Response(
                        {'email': ['Usuário não encontrado.']},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            etapa = "invalidar códigos anteriores"

            VerificationCode.objects.filter(
                user=user,
                purpose=purpose,
                used=False
            ).update(used=True)

            etapa = "criar código de verificação"

            code = ''.join(
                str(secrets.randbelow(10))
                for _ in range(6)
            )

            VerificationCode.objects.create(
                user=user,
                code=code,
                purpose=purpose,
            )

            etapa = "enviar e-mail"

            try:
                send_verification_email(user, code, purpose)

            except Exception:
                logger.exception(
                    "Falha SMTP na etapa de envio de e-mail."
                )

                return Response(
                    {
                        'detail': [
                            'Não foi possível enviar o e-mail. '
                            'Tente novamente.'
                        ]
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )

            logger.info(
                "Código enviado com sucesso. Finalidade: %s",
                purpose
            )

            return Response(
                {'message': 'Código enviado com sucesso.'},
                status=status.HTTP_200_OK
            )

        except Exception:
            logger.exception(
                "ERRO NO CADASTRO. Etapa: %s",
                etapa
            )

            return Response(
                {
                    'detail': [
                        'Ocorreu um erro interno ao processar sua solicitação.'
                    ]
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VerifyCodeView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    
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
    authentication_classes = []
    permission_classes = [AllowAny]

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