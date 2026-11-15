
import os
from pathlib import Path

import firebase_admin
from firebase_admin import credentials


def get_firebase_app():
    try:
        return firebase_admin.get_app()

    except ValueError:
        pass

    credential_path = os.getenv(
        'FIREBASE_SERVICE_ACCOUNT_PATH',
        '/etc/secrets/firebase-service-account.json'
    )

    if not Path(credential_path).is_file():
        raise RuntimeError(
            'Arquivo de credenciais do Firebase não encontrado.'
        )

    credential = credentials.Certificate(credential_path)

    return firebase_admin.initialize_app(credential)
