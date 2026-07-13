from flask import Blueprint, request, jsonify, g
from models.complaint import Complaint, ActivityLog, ComplaintStatus, ComplaintPriority
from models.user import User
from utils.auth import token_required, role_required
from services.blockchain_service import blockchain_service
from services.notification_service import notification_service
from ai.classifier import classifier
from datetime import datetime, timezone
import uuid
import os
import json
import hashlib

complaints_bp = Blueprint('complaints', __name__)

def generate_complaint_id():
    return f"MDU-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"

@complaints_bp.route('', methods=['POST'])
@token_required
def create_complaint():
    user = g.current_user

    if user.role != 'citizen':
        return jsonify({'error': 'Only citizens can file complaints'}), 403

    data = request.form.to_dict() if request.form else request.get_json() or {}

    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    category = data.get('category', '').strip()
    ward = int(data.get('ward', 0) or 0)
    location_str = data.get('location', '{}')

    try:
        location = json.loads(location_str) if isinstance(location_str, str) else location_str
    except:
        location = {'type': 'Point', 'coordinates': [78.1198, 9.9252], 'address': 'Madurai'}

    if not title or not description:
        return jsonify({'error': 'Title and description are required'}), 400

    if not ward or ward < 1 or ward > 100:
        return jsonify({'error': 'Valid ward number (1-100) is required'}), 400

    complaint_id = generate_complaint_id()

    existing_complaints = list(Complaint.objects().limit(50))

    if category:
        ai_category = {'category': category, 'confidence': 1.0, 'method': 'manual'}
    else:
        ai_category = classifier.predict_category(description, title)

    ai_priority = classifier.predict_priority(description, title, ai_category['category'])

    duplicate_check = classifier.detect_duplicate(description, location, [c.to_json() for c in existing_complaints])
    sentiment = classifier.analyze_sentiment(description)

    images = []
    uploaded_files = request.files
    if uploaded_files:
        upload_dir = os.path.join(os.getenv('UPLOAD_FOLDER', '../uploads'), 'complaints', complaint_id)
        os.makedirs(upload_dir, exist_ok=True)
        for key in uploaded_files:
            file = uploaded_files[key]
            if file and allowed_file(file.filename):
                filename = f"{uuid.uuid4().hex}{os.path.splitext(file.filename)[1]}"
                filepath = os.path.join(upload_dir, filename)
                file.save(filepath)
                images.append(f"/uploads/complaints/{complaint_id}/{filename}")

    complaint = Complaint(
        complaint_id=complaint_id,
        citizen=user,
        title=title,
        description=description,
        category=ai_category['category'],
        status=ComplaintStatus.FILED.value,
        priority=ai_priority['priority'],
        ward=ward,
        location=location,
        images=images,
        ai_predicted_category=ai_category['category'],
        ai_predicted_priority=ai_priority['priority'],
        ai_confidence_score=ai_category['confidence'],
        is_duplicate=duplicate_check['is_duplicate'],
        duplicate_of=duplicate_check.get('duplicate_of', None),
        sentiment=sentiment
    ).save()

    blockchain_result = blockchain_service.register_complaint(
        complaint_id, description, ai_category['category'],
        str(location.get('coordinates', [])), str(ward)
    )

    if blockchain_result:
        complaint.blockchain_tx_hash = blockchain_result.get('tx_hash')
        complaint.blockchain_block_number = blockchain_result.get('block_number')
        complaint.save()

    ActivityLog(
        complaint=complaint,
        user=user,
        action='created',
        description=f"Complaint filed: {title}"
    ).save()

    notification_service.notify_complaint_update(
        str(user.id), complaint_id,
        ComplaintStatus.FILED.value, title
    )

    return jsonify({
        'message': 'Complaint filed successfully',
        'complaint': complaint.to_json(),
        'blockchain': blockchain_result
    }), 201

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@complaints_bp.route('', methods=['GET'])
@token_required
def get_complaints():
    user = g.current_user
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')
    category = request.args.get('category')
    ward = request.args.get('ward', type=int)
    priority = request.args.get('priority')
    search = request.args.get('search')

    query = {}

    if user.role == 'citizen':
        query['citizen'] = user
    elif user.role == 'ward_member':
        query['ward'] = user.ward
    elif user.role == 'corporation_official':
        pass  # Can see all
    elif user.role == 'admin':
        pass  # Can see all

    if status:
        query['status'] = status
    if category:
        query['category'] = category
    if ward:
        query['ward'] = ward
    if priority:
        query['priority'] = priority
    if search:
        query['$or'] = [
            {'title__icontains': search},
            {'description__icontains': search},
            {'complaint_id__icontains': search}
        ]

    complaints = Complaint.objects(**query).order_by('-created_at').skip((page - 1) * per_page).limit(per_page)
    total = Complaint.objects(**query).count()

    return jsonify({
        'complaints': [c.to_json() for c in complaints],
        'total': total,
        'page': page,
        'per_page': per_page,
        'pages': (total + per_page - 1) // per_page
    }), 200

@complaints_bp.route('/<complaint_id>', methods=['GET'])
@token_required
def get_complaint(complaint_id):
    complaint = Complaint.objects(complaint_id=complaint_id).first()
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404

    logs = ActivityLog.objects(complaint=complaint).order_by('-created_at')
    blockchain_info = blockchain_service.verify_complaint(complaint_id)

    return jsonify({
        'complaint': complaint.to_json(),
        'activity_logs': [log.to_json() for log in logs],
        'blockchain_verification': blockchain_info
    }), 200

@complaints_bp.route('/<complaint_id>', methods=['PUT'])
@token_required
def update_complaint(complaint_id):
    user = g.current_user
    complaint = Complaint.objects(complaint_id=complaint_id).first()
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404

    data = request.get_json() or {}
    action = data.get('action', '')
    old_status = complaint.status

    if action == 'assign':
        if user.role not in ['corporation_official', 'admin']:
            return jsonify({'error': 'Unauthorized'}), 403
        officer_id = data.get('officer_id')
        officer = User.objects(id=officer_id).first() if officer_id else None
        if not officer:
            return jsonify({'error': 'Officer not found'}), 404
        complaint.assigned_officer = officer
        complaint.status = ComplaintStatus.ASSIGNED.value
        complaint.assigned_at = datetime.now(timezone.utc)
        notification_service.notify_assignment(str(officer.id), complaint_id, complaint.title)

    elif action == 'accept':
        if user.role != 'ward_member' or user.ward != complaint.ward:
            return jsonify({'error': 'Unauthorized'}), 403
        complaint.assigned_officer = user
        complaint.status = ComplaintStatus.ASSIGNED.value
        complaint.assigned_at = datetime.now(timezone.utc)

    elif action == 'start_work':
        if user.role != 'ward_member' or not complaint.assigned_officer or str(complaint.assigned_officer.id) != str(user.id):
            return jsonify({'error': 'Unauthorized'}), 403
        complaint.status = ComplaintStatus.IN_PROGRESS.value

    elif action == 'resolve':
        if user.role != 'ward_member' or not complaint.assigned_officer or str(complaint.assigned_officer.id) != str(user.id):
            return jsonify({'error': 'Unauthorized'}), 403
        complaint.status = ComplaintStatus.RESOLVED.value
        complaint.resolved_at = datetime.now(timezone.utc)
        complaint.resolution_notes = data.get('notes', '')

    elif action == 'reject':
        if user.role not in ['corporation_official', 'admin', 'ward_member']:
            return jsonify({'error': 'Unauthorized'}), 403
        complaint.status = ComplaintStatus.REJECTED.value
        complaint.resolution_notes = data.get('reason', '')

    elif action == 'update_priority':
        if user.role not in ['corporation_official', 'admin']:
            return jsonify({'error': 'Unauthorized'}), 403
        new_priority = data.get('priority')
        if new_priority in [p.value for p in ComplaintPriority]:
            complaint.priority = new_priority

    elif action == 'reassign':
        if user.role not in ['corporation_official', 'admin']:
            return jsonify({'error': 'Unauthorized'}), 403
        new_ward = data.get('ward')
        if new_ward:
            complaint.ward = int(new_ward)

    elif action == 'escalate':
        if user.role not in ['corporation_official', 'admin', 'ward_member']:
            return jsonify({'error': 'Unauthorized'}), 403
        complaint.priority = ComplaintPriority.EMERGENCY.value

    elif action == 'feedback':
        if str(complaint.citizen.id) != str(user.id):
            return jsonify({'error': 'Only the complaint owner can submit feedback'}), 403
        complaint.feedback = {
            'rating': data.get('rating', 0),
            'comment': data.get('comment', ''),
            'submitted_at': datetime.now(timezone.utc).isoformat()
        }

    else:
        return jsonify({'error': 'Invalid action'}), 400

    complaint.updated_at = datetime.now(timezone.utc)
    complaint.save()

    if action in ('assign', 'accept', 'start_work', 'resolve', 'reject'):
        status_map = {'filed': 0, 'assigned': 1, 'in_progress': 2, 'resolved': 3, 'rejected': 4}
        officer_address = '0x0000000000000000000000000000000000000000'
        if complaint.assigned_officer:
            officer_id_str = str(complaint.assigned_officer.id)
            officer_address = '0x' + hashlib.sha256(officer_id_str.encode()).hexdigest()[:40]
        blockchain_service.update_complaint_status(
            complaint_id, status_map.get(complaint.status, 0), officer_address
        )

    ActivityLog(
        complaint=complaint,
        user=user,
        action=action,
        description=f"Status changed from {old_status} to {complaint.status}",
        old_value=old_status,
        new_value=complaint.status
    ).save()

    notification_service.notify_complaint_update(
        str(complaint.citizen.id), complaint_id, complaint.status, complaint.title
    )

    return jsonify({
        'message': 'Complaint updated successfully',
        'complaint': complaint.to_json()
    }), 200

@complaints_bp.route('/<complaint_id>/images', methods=['POST'])
@token_required
def upload_completion_images(complaint_id):
    user = g.current_user
    complaint = Complaint.objects(complaint_id=complaint_id).first()
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404

    if user.role != 'ward_member' or not complaint.assigned_officer or str(complaint.assigned_officer.id) != str(user.id):
        return jsonify({'error': 'Unauthorized'}), 403

    uploaded_files = request.files
    if not uploaded_files:
        return jsonify({'error': 'No files provided'}), 400

    upload_dir = os.path.join(os.getenv('UPLOAD_FOLDER', '../uploads'), 'complaints', complaint_id, 'completion')
    os.makedirs(upload_dir, exist_ok=True)

    new_images = []
    for key in uploaded_files:
        file = uploaded_files[key]
        if file and allowed_file(file.filename):
            filename = f"comp_{uuid.uuid4().hex}{os.path.splitext(file.filename)[1]}"
            filepath = os.path.join(upload_dir, filename)
            file.save(filepath)
            new_images.append(f"/uploads/complaints/{complaint_id}/completion/{filename}")

    if new_images:
        complaint.completion_images = (complaint.completion_images or []) + new_images
        complaint.updated_at = datetime.now(timezone.utc)
        complaint.save()

    return jsonify({
        'message': 'Images uploaded',
        'completion_images': complaint.completion_images
    }), 200

@complaints_bp.route('/stats', methods=['GET'])
@token_required
def get_complaint_stats():
    user = g.current_user
    query = {}
    if user.role == 'citizen':
        query['citizen'] = user
    elif user.role == 'ward_member':
        query['ward'] = user.ward

    total = Complaint.objects(**query).count()
    filed = Complaint.objects(**query, status='filed').count()
    assigned = Complaint.objects(**query, status='assigned').count()
    in_progress = Complaint.objects(**query, status='in_progress').count()
    resolved = Complaint.objects(**query, status='resolved').count()
    rejected = Complaint.objects(**query, status='rejected').count()

    return jsonify({
        'total': total,
        'filed': filed,
        'assigned': assigned,
        'in_progress': in_progress,
        'resolved': resolved,
        'rejected': rejected
    }), 200

@complaints_bp.route('/<complaint_id>/timeline', methods=['GET'])
@token_required
def get_complaint_timeline(complaint_id):
    complaint = Complaint.objects(complaint_id=complaint_id).first()
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404

    logs = ActivityLog.objects(complaint=complaint).order_by('created_at')
    return jsonify({
        'timeline': [log.to_json() for log in logs]
    }), 200
