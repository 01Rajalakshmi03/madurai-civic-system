import os

print("Booting Madurai Civic API...")
print(f"  PORT={os.getenv('PORT', 5000)}")
print(f"  MONGO_URI={'set' if os.getenv('MONGO_URI') else 'not set'}")
print(f"  SECRET_KEY={'set' if os.getenv('SECRET_KEY') else 'not set'}")
print(f"  JWT_SECRET={'set' if os.getenv('JWT_SECRET') else 'not set'}")

from app import create_app

app = create_app()
