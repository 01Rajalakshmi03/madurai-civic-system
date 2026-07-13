from flask import Blueprint, request, jsonify
from utils.auth import token_required, role_required
from services.blockchain_service import blockchain_service
from models.complaint import BlockchainRecord, Complaint
from datetime import datetime, timezone

blockchain_bp = Blueprint('blockchain', __name__)

@blockchain_bp.route('/connect', methods=['GET'])
@token_required
@role_required('admin')
def connect_blockchain():
    result = blockchain_service.connect()
    return jsonify({
        'connected': result,
        'message': 'Blockchain connected' if result else 'Blockchain not available'
    }), 200

@blockchain_bp.route('/status', methods=['GET'])
@token_required
def blockchain_status():
    return jsonify({
        'connected': blockchain_service.connected,
        'contract_address': blockchain_service.contract_address,
        'rpc_url': blockchain_service.rpc_url
    }), 200

@blockchain_bp.route('/store', methods=['POST'])
@token_required
@role_required('admin')
def store_on_blockchain():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    complaint_id = data.get('complaint_id')
    if not complaint_id:
        return jsonify({'error': 'complaint_id required'}), 400

    complaint = Complaint.objects(complaint_id=complaint_id).first()
    if not complaint:
        return jsonify({'error': 'Complaint not found'}), 404

    result = blockchain_service.register_complaint(
        complaint_id,
        complaint.description,
        complaint.category,
        str(complaint.location.get('coordinates', [])),
        str(complaint.ward)
    )

    if result and result.get('success'):
        complaint.blockchain_tx_hash = result.get('tx_hash')
        complaint.blockchain_block_number = result.get('block_number')
        complaint.save()

        record = BlockchainRecord(
            complaint_id=complaint_id,
            tx_hash=result.get('tx_hash', ''),
            block_number=result.get('block_number'),
            contract_address=blockchain_service.contract_address,
            function_name='registerComplaint',
            gas_used=result.get('gas_used'),
            status='confirmed'
        ).save()

        return jsonify({
            'message': 'Stored on blockchain',
            'record': record.to_json()
        }), 200

    return jsonify({'error': 'Failed to store on blockchain'}), 500

@blockchain_bp.route('/verify/<complaint_id>', methods=['GET'])
@token_required
def verify_complaint(complaint_id):
    result = blockchain_service.verify_complaint(complaint_id)

    blockchain_record = BlockchainRecord.objects(complaint_id=complaint_id).first()

    return jsonify({
        'complaint_id': complaint_id,
        'verification': result,
        'blockchain_record': blockchain_record.to_json() if blockchain_record else None
    }), 200

@blockchain_bp.route('/records', methods=['GET'])
@token_required
def get_blockchain_records():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    records = BlockchainRecord.objects().order_by('-created_at').skip((page - 1) * per_page).limit(per_page)
    total = BlockchainRecord.objects().count()

    if total == 0:
        complaints = Complaint.objects(
            blockchain_tx_hash__ne=None
        ).order_by('-created_at').skip((page - 1) * per_page).limit(per_page)
        complaint_total = Complaint.objects(blockchain_tx_hash__ne=None).count()

        return jsonify({
            'records': [{
                'complaint_id': c.complaint_id,
                'tx_hash': c.blockchain_tx_hash,
                'block_number': c.blockchain_block_number,
                'function_name': 'registerComplaint',
                'status': 'confirmed',
                'created_at': c.created_at.isoformat() if c.created_at else None
            } for c in complaints],
            'total': complaint_total,
            'page': page,
            'per_page': per_page
        }), 200

    return jsonify({
        'records': [r.to_json() for r in records],
        'total': total,
        'page': page,
        'per_page': per_page
    }), 200

@blockchain_bp.route('/complaint/<complaint_id>', methods=['GET'])
@token_required
def get_blockchain_complaint(complaint_id):
    result = blockchain_service.get_complaint(complaint_id)
    if result:
        return jsonify({'complaint': result}), 200
    return jsonify({'error': 'Not found on blockchain'}), 404
