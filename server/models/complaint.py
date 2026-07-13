from mongoengine import Document, StringField, IntField, FloatField, ListField, DictField, DateTimeField, BooleanField, ReferenceField, EnumField
from datetime import datetime, timezone
from enum import Enum

from models.user import User

class ComplaintStatus(str, Enum):
    FILED = 'filed'
    ASSIGNED = 'assigned'
    IN_PROGRESS = 'in_progress'
    RESOLVED = 'resolved'
    REJECTED = 'rejected'

class ComplaintPriority(str, Enum):
    LOW = 'low'
    MEDIUM = 'medium'
    HIGH = 'high'
    EMERGENCY = 'emergency'

class Complaint(Document):
    meta = {
        'collection': 'complaints',
        'indexes': ['complaint_id', 'citizen', 'assigned_officer', 'ward', 'status', 'category', 'created_at']
    }

    complaint_id = StringField(required=True, unique=True)
    citizen = ReferenceField('User', required=True)
    assigned_officer = ReferenceField('User', default=None)
    title = StringField(required=True, max_length=200)
    description = StringField(required=True, max_length=2000)
    category = StringField(required=True, choices=[
        'road_damage', 'garbage_accumulation', 'water_leakage',
        'drainage_problem', 'streetlight_failure', 'illegal_dumping',
        'infrastructure_damage', 'other'
    ])
    sub_category = StringField(max_length=100)
    status = StringField(
        choices=[s.value for s in ComplaintStatus],
        default=ComplaintStatus.FILED.value
    )
    priority = StringField(
        choices=[p.value for p in ComplaintPriority],
        default=ComplaintPriority.MEDIUM.value
    )
    ward = IntField(required=True, min_value=1, max_value=100)
    location = DictField(required=True)
    images = ListField(StringField(), default=[])
    completion_images = ListField(StringField(), default=[])
    feedback = DictField(default={
        'rating': 0,
        'comment': '',
        'submitted_at': None
    })
    blockchain_tx_hash = StringField(default=None)
    blockchain_block_number = IntField(default=None)
    ai_predicted_category = StringField(default=None)
    ai_predicted_priority = StringField(default=None)
    ai_confidence_score = FloatField(default=0.0)
    is_duplicate = BooleanField(default=False)
    duplicate_of = ReferenceField('self', default=None)
    sentiment = StringField(choices=['positive', 'neutral', 'negative'], default='neutral')
    resolution_notes = StringField(max_length=2000, default='')
    resolved_at = DateTimeField(default=None)
    assigned_at = DateTimeField(default=None)
    created_at = DateTimeField(default=lambda: datetime.now(timezone.utc))
    updated_at = DateTimeField(default=lambda: datetime.now(timezone.utc))

    def to_json(self):
        return {
            'id': str(self.id),
            'complaint_id': self.complaint_id,
            'citizen': str(self.citizen.id) if self.citizen else None,
            'citizen_name': self.citizen.name if self.citizen else None,
            'assigned_officer': str(self.assigned_officer.id) if self.assigned_officer else None,
            'assigned_officer_name': self.assigned_officer.name if self.assigned_officer else None,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'sub_category': self.sub_category,
            'status': self.status,
            'priority': self.priority,
            'ward': self.ward,
            'location': self.location,
            'images': self.images,
            'completion_images': self.completion_images,
            'feedback': self.feedback,
            'blockchain_tx_hash': self.blockchain_tx_hash,
            'blockchain_block_number': self.blockchain_block_number,
            'ai_predicted_category': self.ai_predicted_category,
            'ai_predicted_priority': self.ai_predicted_priority,
            'ai_confidence_score': self.ai_confidence_score,
            'is_duplicate': self.is_duplicate,
            'sentiment': self.sentiment,
            'resolution_notes': self.resolution_notes,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'assigned_at': self.assigned_at.isoformat() if self.assigned_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class ActivityLog(Document):
    meta = {'collection': 'activity_logs', 'indexes': ['complaint', 'user', 'created_at']}

    complaint = ReferenceField(Complaint, required=True)
    user = ReferenceField(User, required=True)
    action = StringField(required=True, max_length=50)
    description = StringField(max_length=500)
    old_value = StringField(default=None)
    new_value = StringField(default=None)
    created_at = DateTimeField(default=lambda: datetime.now(timezone.utc))

    def to_json(self):
        return {
            'id': str(self.id),
            'complaint_id': str(self.complaint.id) if self.complaint else None,
            'user_id': str(self.user.id) if self.user else None,
            'user_name': self.user.name if self.user else None,
            'action': self.action,
            'description': self.description,
            'old_value': self.old_value,
            'new_value': self.new_value,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Ward(Document):
    meta = {'collection': 'wards', 'indexes': ['ward_number']}

    ward_number = IntField(required=True, unique=True, min_value=1, max_value=100)
    ward_name = StringField(required=True, max_length=100)
    zone = StringField(max_length=100)
    ward_member = ReferenceField('User', default=None)
    boundaries = DictField(default={})
    population = IntField(default=0)
    area_sq_km = FloatField(default=0.0)
    is_active = BooleanField(default=True)
    created_at = DateTimeField(default=lambda: datetime.now(timezone.utc))

    def to_json(self):
        return {
            'id': str(self.id),
            'ward_number': self.ward_number,
            'ward_name': self.ward_name,
            'zone': self.zone,
            'ward_member': str(self.ward_member.id) if self.ward_member else None,
            'ward_member_name': self.ward_member.name if self.ward_member else None,
            'boundaries': self.boundaries,
            'population': self.population,
            'area_sq_km': self.area_sq_km,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class BlockchainRecord(Document):
    meta = {'collection': 'blockchain_records', 'indexes': ['complaint_id', 'tx_hash']}

    complaint_id = StringField(required=True)
    tx_hash = StringField(required=True)
    block_number = IntField()
    contract_address = StringField()
    function_name = StringField()
    gas_used = IntField()
    status = StringField(choices=['pending', 'confirmed', 'failed'], default='pending')
    created_at = DateTimeField(default=lambda: datetime.now(timezone.utc))

    def to_json(self):
        return {
            'id': str(self.id),
            'complaint_id': self.complaint_id,
            'tx_hash': self.tx_hash,
            'block_number': self.block_number,
            'contract_address': self.contract_address,
            'function_name': self.function_name,
            'gas_used': self.gas_used,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
