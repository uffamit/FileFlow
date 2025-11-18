import os

class Config:
    SECRET_KEY = os.urandom(24)
    SQLALCHEMY_DATABASE_URI = 'sqlite:///fileflow.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = 'user_files'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file upload