from flask import Blueprint, request, jsonify, g
from models.user import User
from utils.auth import generate_token, token_required
from datetime import datetime, timezone
import re

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', 'citizen')
    phone = data.get('phone', '')
    ward = data.get('ward')
    address = data.get('address', '')

    if not name or not email or not password:
        return jsonify({'error': 'Name, email and password are required'}), 400

    if not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
        return jsonify({'error': 'Invalid email format'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    if User.objects(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    user = User(
        name=name,
        email=email,
        role=role if role in ['citizen', 'ward_member', 'corporation_official', 'admin'] else 'citizen',
        phone=phone,
        ward=ward,
        address=address
    )
    user.set_password(password)
    user.save()

    token = generate_token(str(user.id), user.role)

    return jsonify({
        'message': 'Registration successful',
        'token': token,
        'user': user.to_json()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.objects(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401

    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 403

    user.last_login = datetime.now(timezone.utc)
    user.save()

    token = generate_token(str(user.id), user.role)

    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_json()
    }), 200

@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile():
    user = g.current_user
    return jsonify({'user': user.to_json()}), 200

@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile():
    user = g.current_user
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    updatable = ['name', 'phone', 'address', 'profile_image']
    for field in updatable:
        if field in data:
            setattr(user, field, data[field])

    user.updated_at = datetime.now(timezone.utc)
    user.save()

    return jsonify({'message': 'Profile updated', 'user': user.to_json()}), 200

@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password():
    user = g.current_user
    data = request.get_json()

    if not data or not data.get('current_password') or not data.get('new_password'):
        return jsonify({'error': 'Current and new password required'}), 400

    if not user.check_password(data['current_password']):
        return jsonify({'error': 'Current password is incorrect'}), 401

    if len(data['new_password']) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400

    user.set_password(data['new_password'])
    user.updated_at = datetime.now(timezone.utc)
    user.save()

    return jsonify({'message': 'Password changed successfully'}), 200
