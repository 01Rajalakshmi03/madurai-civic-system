from mongoengine import Document, StringField, EmailField, IntField, ListField, DateTimeField, BooleanField, ReferenceField
from datetime import datetime, timezone
import bcrypt

class User(Document):
    meta = {'collection': 'users', 'indexes': ['email', 'role', 'ward']}

    email = EmailField(required=True, unique=True)
    password_hash = StringField(required=True)
    name = StringField(required=True, max_length=100)
    phone = StringField(max_length=15)
    role = StringField(choices=['citizen', 'ward_member', 'corporation_official', 'admin'], default='citizen')
    ward = IntField(min_value=1, max_value=100, default=None)
    address = StringField(max_length=500)
    aadhar_number = StringField(max_length=12)
    is_active = BooleanField(default=True)
    profile_image = StringField(default=None)
    created_at = DateTimeField(default=lambda: datetime.now(timezone.utc))
    updated_at = DateTimeField(default=lambda: datetime.now(timezone.utc))
    last_login = DateTimeField(default=None)
    fcm_token = StringField(default=None)

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def to_json(self):
        return {
            'id': str(self.id),
            'email': self.email,
            'name': self.name,
            'phone': self.phone,
            'role': self.role,
            'ward': self.ward,
            'address': self.address,
            'is_active': self.is_active,
            'profile_image': self.profile_image,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

class Notification(Document):
    meta = {'collection': 'notifications', 'indexes': ['user', 'created_at']}

    user = ReferenceField(User, required=True)
    title = StringField(required=True, max_length=200)
    message = StringField(required=True, max_length=1000)
    type = StringField(choices=['complaint_update', 'assignment', 'system', 'reminder'], default='system')
    is_read = BooleanField(default=False)
    created_at = DateTimeField(default=lambda: datetime.now(timezone.utc))

    def to_json(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user.id) if self.user else None,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
