
from django.contrib.auth.base_user import BaseUserManager


class UserManager(BaseUserManager):

    def create_user(
        self,
        email,
        first_name='',
        last_name='',
        password=None,
        **extra_fields
    ):
        if not email:
            raise ValueError("O e-mail é obrigatório")

        email = self.normalize_email(email.strip()).lower()

        user = self.model(
            email=email,
            first_name=first_name or '',
            last_name=last_name or '',
            **extra_fields
        )

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save(using=self._db)

        return user

    def create_superuser(
        self,
        email,
        first_name='',
        last_name='',
        password=None,
        **extra_fields
    ):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superusuário precisa ter is_staff=True.')

        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superusuário precisa ter is_superuser=True.')

        return self.create_user(
            email,
            first_name,
            last_name,
            password,
            **extra_fields
        )