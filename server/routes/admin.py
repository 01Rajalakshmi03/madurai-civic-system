from flask import Blueprint, request, jsonify, g
from models.user import User
from models.complaint import Complaint, Ward, ActivityLog, BlockchainRecord
from utils.auth import token_required, role_required
from datetime import datetime, timezone

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/users', methods=['GET'])
@token_required
@role_required('admin')
def get_users():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    role = request.args.get('role')
    search = request.args.get('search')

    query = {}
    if role:
        query['role'] = role
    if search:
        query['$or'] = [
            {'name__icontains': search},
            {'email__icontains': search},
            {'phone__icontains': search}
        ]

    users = User.objects(**query).order_by('-created_at').skip((page - 1) * per_page).limit(per_page)
    total = User.objects(**query).count()

    return jsonify({
        'users': [u.to_json() for u in users],
        'total': total,
        'page': page,
        'per_page': per_page
    }), 200

@admin_bp.route('/users/<user_id>', methods=['PUT'])
@token_required
@role_required('admin')
def update_user(user_id):
    user = User.objects(id=user_id).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data'}), 400

    if 'name' in data:
        user.name = data['name']
    if 'role' in data:
        user.role = data['role']
    if 'ward' in data:
        user.ward = data['ward']
    if 'phone' in data:
        user.phone = data['phone']
    if 'is_active' in data:
        user.is_active = data['is_active']

    user.updated_at = datetime.now(timezone.utc)
    user.save()

    return jsonify({'message': 'User updated', 'user': user.to_json()}), 200

@admin_bp.route('/wards', methods=['GET'])
@token_required
@role_required('admin')
def get_wards():
    wards = Ward.objects().order_by('ward_number')
    return jsonify({
        'wards': [w.to_json() for w in wards]
    }), 200

@admin_bp.route('/wards', methods=['POST'])
@token_required
@role_required('admin')
def create_ward():
    data = request.get_json()
    if not data or not data.get('ward_number') or not data.get('ward_name'):
        return jsonify({'error': 'ward_number and ward_name required'}), 400

    if Ward.objects(ward_number=data['ward_number']).first():
        return jsonify({'error': 'Ward already exists'}), 409

    ward = Ward(
        ward_number=data['ward_number'],
        ward_name=data['ward_name'],
        zone=data.get('zone', ''),
        population=data.get('population', 0),
        area_sq_km=data.get('area_sq_km', 0.0)
    ).save()

    return jsonify({'message': 'Ward created', 'ward': ward.to_json()}), 201

@admin_bp.route('/wards/<ward_id>', methods=['PUT'])
@token_required
@role_required('admin')
def update_ward(ward_id):
    ward = Ward.objects(id=ward_id).first()
    if not ward:
        return jsonify({'error': 'Ward not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data'}), 400

    if 'ward_number' in data:
        ward.ward_number = data['ward_number']
    if 'ward_name' in data:
        ward.ward_name = data['ward_name']
    if 'zone' in data:
        ward.zone = data['zone']
    if 'population' in data:
        ward.population = data['population']
    if 'area_sq_km' in data or 'area' in data:
        ward.area_sq_km = data.get('area_sq_km') or data.get('area')

    ward.save()
    return jsonify({'message': 'Ward updated', 'ward': ward.to_json()}), 200

@admin_bp.route('/officials', methods=['GET'])
@token_required
@role_required('admin')
def get_officials():
    officials = User.objects(role__in=['ward_member', 'corporation_official']).order_by('name')
    return jsonify({
        'officials': [o.to_json() for o in officials]
    }), 200

@admin_bp.route('/officials', methods=['POST'])
@token_required
@role_required('admin')
def create_official():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('email'):
        return jsonify({'error': 'Name and email required'}), 400

    if User.objects(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409

    user = User(
        name=data['name'],
        email=data['email'],
        role=data.get('role', 'ward_member'),
        phone=data.get('phone', ''),
        ward=data.get('ward'),
        address=data.get('address', '')
    )
    user.set_password(data.get('password', 'default123'))
    user.save()

    return jsonify({'message': 'Official created', 'user': user.to_json()}), 201

@admin_bp.route('/stats', methods=['GET'])
@token_required
@role_required('admin')
def get_admin_stats():
    total_users = User.objects().count()
    total_complaints = Complaint.objects().count()
    total_wards = Ward.objects().count()
    resolved = Complaint.objects(status='resolved').count()
    pending = Complaint.objects(status__in=['filed', 'assigned', 'in_progress']).count()
    blockchain_records = BlockchainRecord.objects().count()

    citizens = User.objects(role='citizen').count()
    ward_members = User.objects(role='ward_member').count()
    officials = User.objects(role='corporation_official').count()

    return jsonify({
        'total_users': total_users,
        'total_complaints': total_complaints,
        'total_wards': total_wards,
        'resolved_complaints': resolved,
        'pending_complaints': pending,
        'blockchain_records': blockchain_records,
        'citizens': citizens,
        'ward_members': ward_members,
        'corporation_officials': officials
    }), 200

@admin_bp.route('/activity-log', methods=['GET'])
@token_required
@role_required('admin')
def get_activity_log():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    logs = ActivityLog.objects().order_by('-created_at').skip((page - 1) * per_page).limit(per_page)
    total = ActivityLog.objects().count()

    return jsonify({
        'logs': [l.to_json() for l in logs],
        'total': total,
        'page': page,
        'per_page': per_page
    }), 200
