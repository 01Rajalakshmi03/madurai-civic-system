import json
import os
import hashlib
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

class BlockchainService:
    def __init__(self):
        self.rpc_url = os.getenv('BLOCKCHAIN_RPC_URL', 'http://127.0.0.1:7545')
        self.contract_address = os.getenv('CONTRACT_ADDRESS')
        self.ganache_account = os.getenv('GANACHE_ACCOUNT')
        self.private_key = os.getenv('GANACHE_PRIVATE_KEY')

        self.w3 = None
        self.contract = None
        self.connected = False

    def connect(self):
        try:
            self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
            if not self.w3.is_connected():
                print("Warning: Blockchain not connected")
                return False

            contract_path = os.path.join(os.path.dirname(__file__), '..', '..', 'contracts', 'ComplaintRegistry.json')
            if os.path.exists(contract_path):
                with open(contract_path, 'r') as f:
                    contract_data = json.load(f)
                    abi = contract_data.get('abi', [])
                    if self.contract_address and self.contract_address != '0x0000000000000000000000000000000000000000' and abi:
                        self.contract = self.w3.eth.contract(
                            address=Web3.to_checksum_address(self.contract_address),
                            abi=abi
                        )
                        self.connected = True
                        print("Blockchain connected successfully")
                        return True

            print("Contract ABI not found. Blockchain will be simulated.")
            return False
        except Exception as e:
            print(f"Blockchain connection error: {e}")
            return False

    def register_complaint(self, complaint_id, description, category, location, ward):
        if not self.connected or not self.contract:
            return self._simulate_transaction(complaint_id, 'registerComplaint')

        try:
            nonce = self.w3.eth.get_transaction_count(self.ganache_account)
            txn = self.contract.functions.registerComplaint(
                complaint_id, description, category, location, str(ward)
            ).build_transaction({
                'from': self.ganache_account,
                'nonce': nonce,
                'gas': 2000000,
                'gasPrice': self.w3.eth.gas_price
            })

            signed_txn = self.w3.eth.account.sign_transaction(txn, private_key=self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

            return {
                'success': True,
                'tx_hash': tx_hash.hex(),
                'block_number': receipt.blockNumber,
                'gas_used': receipt.gasUsed
            }
        except Exception as e:
            print(f"Blockchain register error: {e}")
            return self._simulate_transaction(complaint_id, 'registerComplaint')

    def update_complaint_status(self, complaint_id, status_code, officer_address):
        if not self.connected or not self.contract:
            return self._simulate_transaction(complaint_id, 'updateComplaintStatus')

        try:
            nonce = self.w3.eth.get_transaction_count(self.ganache_account)
            txn = self.contract.functions.updateComplaintStatus(
                complaint_id, status_code, officer_address
            ).build_transaction({
                'from': self.ganache_account,
                'nonce': nonce,
                'gas': 2000000,
                'gasPrice': self.w3.eth.gas_price
            })

            signed_txn = self.w3.eth.account.sign_transaction(txn, private_key=self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

            return {
                'success': True,
                'tx_hash': tx_hash.hex(),
                'block_number': receipt.blockNumber,
                'gas_used': receipt.gasUsed
            }
        except Exception as e:
            print(f"Blockchain update error: {e}")
            return self._simulate_transaction(complaint_id, 'updateComplaintStatus')

    def verify_complaint(self, complaint_id):
        if not self.connected or not self.contract:
            return self._simulate_verification(complaint_id)

        try:
            result = self.contract.functions.verifyComplaint(complaint_id).call()
            return {
                'success': result[0],
                'complaint_hash': f'0x{result[1].hex()}',
                'timestamp': result[2],
                'status': result[3]
            }
        except Exception as e:
            print(f"Blockchain verify error: {e}")
            return self._simulate_verification(complaint_id)

    def get_complaint(self, complaint_id):
        if not self.connected or not self.contract:
            return None

        try:
            result = self.contract.functions.getComplaint(complaint_id).call()
            return {
                'id': result[0],
                'category': result[1],
                'location': result[2],
                'ward': result[3],
                'timestamp': result[4],
                'status': result[5],
                'assigned_officer': result[6],
                'complaint_hash': f'0x{result[7].hex()}'
            }
        except Exception as e:
            print(f"Blockchain get error: {e}")
            return None

    def _simulate_transaction(self, complaint_id, function_name):
        deterministic = int(hashlib.sha256(complaint_id.encode()).hexdigest(), 16)
        return {
            'success': True,
            'tx_hash': '0x' + hashlib.sha256(complaint_id.encode()).hexdigest(),
            'block_number': deterministic % 1000000,
            'gas_used': 50000,
            'simulated': True
        }

    def _simulate_verification(self, complaint_id):
        return {
            'success': True,
            'complaint_hash': '0x' + hashlib.sha256((complaint_id + 'blockchain').encode()).hexdigest(),
            'timestamp': 1700000000,
            'status': 0,
            'simulated': True
        }

blockchain_service = BlockchainService()
