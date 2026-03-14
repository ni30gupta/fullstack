import firebase_admin
from firebase_admin import credentials

cred = credentials.Certificate("gym-rush-e42b4-firebase-adminsdk-fbsvc-4231c1797e.json")

firebase_admin.initialize_app(cred)