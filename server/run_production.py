import os
from waitress import serve
from app import create_app

if __name__ == '__main__':
    app = create_app()
    print("=" * 60)
    print("  Madurai Civic System - Production Server")
    print("  Backend API: http://localhost:5000")
    print("  Frontend:    http://localhost:3000")
    print("=" * 60)
    serve(app, host='0.0.0.0', port=5000, threads=4)
