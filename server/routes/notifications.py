from flask import Blueprint, request, jsonify, g
from models.user import Notification, User
from utils.auth import token_required
from datetime import datetime, timezone

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('', methods=['GET'])
@token_required
def get_notifications():
    user = g.current_user
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'

    query = {'user': user}
    if unread_only:
        query['is_read'] = False

    notifications = Notification.objects(**query).order_by('-created_at').skip((page - 1) * per_page).limit(per_page)
    total = Notification.objects(**query).count()
    unread_count = Notification.objects(user=user, is_read=False).count()

    return jsonify({
        'notifications': [n.to_json() for n in notifications],
        'total': total,
        'unread_count': unread_count,
        'page': page,
        'per_page': per_page
    }), 200

@notifications_bp.route('/read-all', methods=['POST'])
@token_required
def mark_all_read():
    user = g.current_user
    Notification.objects(user=user, is_read=False).update(set__is_read=True)

    return jsonify({'message': 'All notifications marked as read'}), 200

@notifications_bp.route('/<notification_id>/read', methods=['POST'])
@token_required
def mark_read(notification_id):
    notification = Notification.objects(id=notification_id).first()
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404

    if str(notification.user.id) != str(g.user_id):
        return jsonify({'error': 'Unauthorized'}), 403

    notification.is_read = True
    notification.save()

    return jsonify({'message': 'Marked as read'}), 200

@notifications_bp.route('/unread-count', methods=['GET'])
@token_required
def unread_count():
    user = g.current_user
    count = Notification.objects(user=user, is_read=False).count()

    return jsonify({'unread_count': count}), 200

@notifications_bp.route('/<notification_id>', methods=['DELETE'])
@token_required
def delete_notification(notification_id):
    notification = Notification.objects(id=notification_id).first()
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404

    if str(notification.user.id) != str(g.user_id):
        return jsonify({'error': 'Unauthorized'}), 403

    notification.delete()
    return jsonify({'message': 'Notification deleted'}), 200
