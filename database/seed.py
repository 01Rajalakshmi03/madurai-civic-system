import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'server'))

from mongoengine import connect
from models.user import User
from models.complaint import Complaint, Ward
from datetime import datetime, timezone, timedelta
import random
from faker import Faker

fake = Faker('en_IN')

connect(host='mongodb://localhost:27017/madurai_civic_db')

CATEGORIES = ['road_damage', 'garbage_accumulation', 'water_leakage',
              'drainage_problem', 'streetlight_failure', 'illegal_dumping',
              'infrastructure_damage', 'other']
STATUSES = ['filed', 'assigned', 'in_progress', 'resolved', 'rejected']
PRIORITIES = ['low', 'medium', 'high', 'emergency']

def seed():
    print("Seeding database...")

    # Clear existing data
    User.drop_collection()
    Complaint.drop_collection()
    Ward.drop_collection()

    # Create admin
    admin = User(
        email='admin@madurai.gov.in',
        name='Admin User',
        phone='9999999999',
        role='admin',
        address='Madurai Corporation, Madurai',
        is_active=True
    )
    admin.set_password('admin123')
    admin.save()
    print(f"Admin created: admin@madurai.gov.in / admin123")

    # Create citizens
    citizens = []
    for i in range(1, 11):
        user = User(
            email=f'citizen{i}@test.com',
            name=fake.name(),
            phone=fake.phone_number()[:15],
            role='citizen',
            ward=random.randint(1, 20),
            address=fake.address()[:500],
            is_active=True
        )
        user.set_password('password123')
        user.save()
        citizens.append(user)
    print(f"Created {len(citizens)} citizens")

    # Demo citizen
    demo_citizen = User(
        email='citizen@test.com',
        name='Ravi Kumar',
        phone='9876543210',
        role='citizen',
        ward=5,
        address='12, North Street, Madurai - 625001',
        is_active=True
    )
    demo_citizen.set_password('password123')
    demo_citizen.save()
    citizens.append(demo_citizen)

    # Create ward members
    ward_members = []
    for i in range(1, 11):
        user = User(
            email=f'ward{i}@madurai.gov.in',
            name=fake.name(),
            phone=fake.phone_number()[:15],
            role='ward_member',
            ward=i,
            address=f'Ward {i} Office, Madurai',
            is_active=True
        )
        user.set_password('password123')
        user.save()
        ward_members.append(user)

    # Demo ward member
    demo_ward = User(
        email='ward@test.com',
        name='Murugan S',
        phone='9876543211',
        role='ward_member',
        ward=5,
        address='Ward 5 Office, Madurai',
        is_active=True
    )
    demo_ward.set_password('password123')
    demo_ward.save()
    ward_members.append(demo_ward)
    print(f"Created {len(ward_members)} ward members")

    # Create corporation officials
    officials = []
    for i in range(1, 4):
        user = User(
            email=f'official{i}@madurai.gov.in',
            name=fake.name(),
            phone=fake.phone_number()[:15],
            role='corporation_official',
            ward=None,
            address='Madurai Corporation Main Office',
            is_active=True
        )
        user.set_password('password123')
        user.save()
        officials.append(user)
    print(f"Created {len(officials)} corporation officials")

    # Create wards
    ward_names = [
        'Arappalayam', 'Thathaneri', 'Sellur', 'Thiruparankundram',
        'Koodal Nagar', 'Annanagar', 'Villapuram', 'Simmakkal',
        'Yanaikkal', 'Theni Main Road', 'Pasumalai', 'Tirunagar',
        'Pudur', 'Vadamadurai', 'Kochadai', 'Othakadai',
        'Vilachery', 'Narimedu', 'Koodal Alagar', 'South Gate'
    ]

    wards = []
    for i in range(1, 21):
        ward = Ward(
            ward_number=i,
            ward_name=ward_names[i-1] if i <= len(ward_names) else f'Ward {i}',
            zone=random.choice(['North', 'South', 'East', 'West', 'Central']),
            population=random.randint(5000, 25000),
            area_sq_km=round(random.uniform(0.5, 5.0), 2),
            is_active=True
        )
        ward.save()
        wards.append(ward)
    print(f"Created {len(wards)} wards")

    # Create complaints
    complaint_descriptions = {
        'road_damage': [
            'Deep pothole on main road causing accidents',
            'Road surface completely damaged near bus stop',
            'Cracked road needs immediate repair',
            'Footpath broken and unsafe for pedestrians',
        ],
        'garbage_accumulation': [
            'Garbage not collected for over a week',
            'Waste dumped on street corner attracting stray dogs',
            'Overflowing dustbin needs immediate emptying',
            'Solid waste piled up near residential area',
        ],
        'water_leakage': [
            'Main water pipe burst flooding the street',
            'Continuous water leak from junction wasting water',
            'Tap broken at public water point',
            'Water pipeline leaking for several days',
        ],
        'drainage_problem': [
            'Drainage blocked causing water stagnation',
            'Sewage overflow on main road',
            'Manhole cover missing dangerous for vehicles',
            'Stagnant water breeding mosquitoes',
        ],
        'streetlight_failure': [
            'Street light not working for a month',
            'Multiple lights broken on this road',
            'No street lighting causing safety concerns',
            'Street lamp damaged after storm',
        ],
        'illegal_dumping': [
            'Construction debris dumped illegally',
            'Hazardous waste dumped near residential area',
            'Unauthorized dumping of industrial waste',
            'Night-time illegal dumping reported',
        ],
        'infrastructure_damage': [
            'Park bench broken and unsafe',
            'Public toilet damaged and unhygienic',
            'Bus shelter roof damaged',
            'Playground equipment broken',
        ],
        'other': [
            'Public nuisance near community hall',
            'Unauthorized construction blocking pathway',
            'Noise pollution from nearby construction',
        ]
    }

    complaints = []
    complaint_id_counter = 0

    for i in range(1, 101):
        category = random.choice(CATEGORIES)
        status = random.choice(STATUSES)
        priority = random.choice(PRIORITIES)
        ward = random.randint(1, 20)
        citizen = random.choice(citizens)
        officer = random.choice(ward_members) if status != 'filed' else None

        complaint_id = f"MDU-2024{random.randint(1,12):02d}-{random.randint(100000, 999999)}"

        desc = random.choice(complaint_descriptions[category])

        days_ago = random.randint(1, 60)
        created = datetime.now(timezone.utc) - timedelta(days=days_ago)
        assigned = created + timedelta(hours=random.randint(2, 48)) if officer else None
        resolved = assigned + timedelta(hours=random.randint(4, 168)) if status == 'resolved' and assigned else None

        sentiment = random.choice(['positive', 'neutral', 'negative']) if status == 'resolved' else 'neutral'

        complaint = Complaint(
            complaint_id=complaint_id,
            citizen=citizen,
            assigned_officer=officer,
            title=desc[:100],
            description=desc,
            category=category,
            sub_category='',
            status=status,
            priority=priority,
            ward=ward,
            location={
                'type': 'Point',
                'coordinates': [
                    round(78.1198 + random.uniform(-0.05, 0.05), 6),
                    round(9.9252 + random.uniform(-0.05, 0.05), 6)
                ],
                'address': f'Ward {ward}, Madurai',
                'pincode': '6250' + str(random.randint(10, 20))
            },
            images=[],
            completion_images=[],
            feedback={
                'rating': random.randint(3, 5) if status == 'resolved' else 0,
                'comment': fake.sentence() if status == 'resolved' else '',
                'submitted_at': datetime.now(timezone.utc).isoformat() if status == 'resolved' else None
            } if status == 'resolved' else {},
            blockchain_tx_hash=f'0x{random.randint(0, 0xFFFFFFFFFFFFFFFF):064x}',
            blockchain_block_number=random.randint(1000000, 9999999),
            ai_predicted_category=category,
            ai_predicted_priority=priority,
            ai_confidence_score=random.uniform(0.6, 0.99),
            is_duplicate=False,
            sentiment=sentiment,
            resolution_notes=f'Issue resolved by ward team' if status == 'resolved' else '',
            resolved_at=resolved,
            assigned_at=assigned,
            created_at=created,
            updated_at=datetime.now(timezone.utc)
        )
        compliance = complaint.save()
        complaint_id_counter += 1

    print(f"Created {complaint_id_counter} complaints")
    print("\n=== Seed Complete ===")
    print("\nDemo Credentials:")
    print("Citizen: citizen@test.com / password123")
    print("Ward Member: ward@test.com / password123")
    print("Admin: admin@madurai.gov.in / admin123")

if __name__ == '__main__':
    seed()
