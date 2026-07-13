from flask import Blueprint, request, jsonify, g
from models.complaint import Complaint, ComplaintStatus
from models.user import User
from utils.auth import token_required, role_required
from datetime import datetime, timedelta, timezone
from collections import Counter

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/monthly-summary', methods=['GET'])
@token_required
def monthly_summary():
    now = datetime.now(timezone.utc)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    end_of_month = (start_of_month + timedelta(days=32)).replace(day=1)

    base_query = {'created_at': {'$gte': start_of_month, '$lt': end_of_month}}

    category_pipeline = [
        {'$match': base_query},
        {'$group': {'_id': '$category', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}}
    ]
    category_results = list(Complaint.objects.aggregate(category_pipeline))

    status_pipeline = [
        {'$match': base_query},
        {'$group': {'_id': '$status', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}}
    ]
    status_results = list(Complaint.objects.aggregate(status_pipeline))

    total_pipeline = [
        {'$match': base_query},
        {'$group': {'_id': None, 'count': {'$sum': 1}}}
    ]
    total_result = list(Complaint.objects.aggregate(total_pipeline))
    total = total_result[0]['count'] if total_result else 0

    return jsonify({
        'total': total,
        'by_category': [{'name': r['_id'], 'value': r['count']} for r in category_results],
        'by_status': [{'name': r['_id'], 'value': r['count']} for r in status_results],
        'month': start_of_month.month,
        'year': start_of_month.year
    }), 200

@analytics_bp.route('/complaints-by-category', methods=['GET'])
@token_required
def complaints_by_category():
    query = _get_role_query()

    pipeline = [
        {'$match': query},
        {'$group': {'_id': '$category', 'count': {'$sum': 1}}},
        {'$sort': {'count': -1}}
    ]
    results = list(Complaint.objects.aggregate(pipeline))

    return jsonify({
        'categories': [{'_id': r['_id'], 'count': r['count']} for r in results]
    }), 200

@analytics_bp.route('/complaints-by-ward', methods=['GET'])
@token_required
def complaints_by_ward():
    pipeline = [
        {'$group': {'_id': '$ward', 'total': {'$sum': 1}, 'resolved': {
            '$sum': {'$cond': [{'$eq': ['$status', 'resolved']}, 1, 0]}
        }}},
        {'$sort': {'_id': 1}}
    ]
    results = list(Complaint.objects.aggregate(pipeline))

    return jsonify({
        'wards': [{'_id': r['_id'], 'total': r['total'], 'resolved': r['resolved']} for r in results]
    }), 200

@analytics_bp.route('/monthly-trends', methods=['GET'])
@token_required
def monthly_trends():
    months = int(request.args.get('months', 12))
    since = datetime.now(timezone.utc) - timedelta(days=months * 30)

    pipeline = [
        {'$match': {'created_at': {'$gte': since}}},
        {'$group': {
            '_id': {'year': {'$year': '$created_at'}, 'month': {'$month': '$created_at'}},
            'count': {'$sum': 1}
        }},
        {'$sort': {'_id.year': 1, '_id.month': 1}}
    ]
    results = list(Complaint.objects.aggregate(pipeline))

    return jsonify({
        'trends': results
    }), 200

@analytics_bp.route('/resolution-time', methods=['GET'])
@token_required
@role_required('admin', 'corporation_official', 'ward_member')
def resolution_time():
    pipeline = [
        {'$match': {'status': 'resolved', 'resolved_at': {'$ne': None}, 'assigned_at': {'$ne': None}}},
        {'$project': {
            'resolution_time': {
                '$divide': [{'$subtract': ['$resolved_at', '$assigned_at']}, 3600000]
            },
            'category': 1,
            'ward': 1
        }},
        {'$group': {
            '_id': '$category',
            'avg_hours': {'$avg': '$resolution_time'},
            'count': {'$sum': 1}
        }}
    ]
    results = list(Complaint.objects.aggregate(pipeline))

    overall_pipeline = [
        {'$match': {'status': 'resolved', 'resolved_at': {'$ne': None}, 'assigned_at': {'$ne': None}}},
        {'$project': {
            'resolution_time': {
                '$divide': [{'$subtract': ['$resolved_at', '$assigned_at']}, 3600000]
            }
        }},
        {'$group': {'_id': None, 'avg': {'$avg': '$resolution_time'}}}
    ]
    overall = list(Complaint.objects.aggregate(overall_pipeline))

    return jsonify({
        'by_category': results,
        'overall_avg_hours': overall[0]['avg'] if overall else 0
    }), 200

@analytics_bp.route('/ward-ranking', methods=['GET'])
@token_required
@role_required('admin', 'corporation_official', 'ward_member')
def ward_ranking():
    pipeline = [
        {'$group': {
            '_id': '$ward',
            'total': {'$sum': 1},
            'resolved': {'$sum': {'$cond': [{'$eq': ['$status', 'resolved']}, 1, 0]}},
            'pending': {'$sum': {'$cond': [{'$in': ['$status', ['filed', 'assigned', 'in_progress']]}, 1, 0]}}
        }},
        {'$addFields': {
            'resolution_rate': {
                '$cond': [{'$gt': ['$total', 0]}, {'$divide': ['$resolved', '$total']}, 0]
            }
        }},
        {'$sort': {'resolution_rate': -1}}
    ]
    results = list(Complaint.objects.aggregate(pipeline))

    return jsonify({
        'wards': results
    }), 200

@analytics_bp.route('/sentiment-analysis', methods=['GET'])
@token_required
def sentiment_analysis():
    pipeline = [
        {'$group': {'_id': '$sentiment', 'count': {'$sum': 1}}}
    ]
    results = list(Complaint.objects.aggregate(pipeline))

    return jsonify({
        'sentiments': results
    }), 200

@analytics_bp.route('/priority-distribution', methods=['GET'])
@token_required
def priority_distribution():
    pipeline = [
        {'$group': {'_id': '$priority', 'count': {'$sum': 1}}}
    ]
    results = list(Complaint.objects.aggregate(pipeline))

    return jsonify({
        'priorities': results
    }), 200

@analytics_bp.route('/citizen-stats', methods=['GET'])
@token_required
def citizen_stats():
    user = g.current_user
    if user.role != 'citizen':
        return jsonify({'error': 'Citizen only'}), 403

    total = Complaint.objects(citizen=user).count()
    resolved = Complaint.objects(citizen=user, status='resolved').count()
    pending = Complaint.objects(citizen=user, status__in=['filed', 'assigned', 'in_progress']).count()
    rejected = Complaint.objects(citizen=user, status='rejected').count()

    return jsonify({
        'total': total,
        'resolved': resolved,
        'pending': pending,
        'rejected': rejected
    }), 200

@analytics_bp.route('/ward-member-stats', methods=['GET'])
@token_required
def ward_member_stats():
    user = g.current_user
    if user.role != 'ward_member':
        return jsonify({'error': 'Ward member only'}), 403

    assigned = Complaint.objects(assigned_officer=user).count()
    completed = Complaint.objects(assigned_officer=user, status='resolved').count()
    in_progress = Complaint.objects(assigned_officer=user, status='in_progress').count()

    return jsonify({
        'assigned': assigned,
        'completed': completed,
        'in_progress': in_progress
    }), 200

def _get_role_query():
    user = g.current_user
    if user.role == 'citizen':
        return {'citizen': user}
    elif user.role == 'ward_member':
        return {'ward': user.ward}
    return {}
