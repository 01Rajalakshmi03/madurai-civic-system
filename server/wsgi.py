import os
import nltk

print("Booting Madurai Civic API...")
print(f"  PORT={os.getenv('PORT', 5000)}")
print(f"  MONGO_URI={'set' if os.getenv('MONGO_URI') else 'not set'}")
print(f"  SECRET_KEY={'set' if os.getenv('SECRET_KEY') else 'not set'}")
print(f"  JWT_SECRET={'set' if os.getenv('JWT_SECRET') else 'not set'}")

try:
    nltk.download('stopwords', quiet=True)
    nltk.download('punkt', quiet=True)
    nltk.download('punkt_tab', quiet=True)
except Exception as e:
    print(f"  NLTK download warning: {e}")

from app import create_app

app = create_app()
