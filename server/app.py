import os
from flask import Flask
from flask_cors import CORS
from mongoengine import connect
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)

    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['MONGO_URI'] = os.getenv('MONGO_URI', 'mongodb://localhost:27017/madurai_civic_db')
    app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', '../uploads')
    app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', 16777216))

    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    allowed_origins = set()
    for origin in frontend_url.split(','):
        origin = origin.strip()
        if origin:
            allowed_origins.add(origin)
    allowed_origins.add('http://localhost:3000')
    allowed_origins.add('http://localhost:5173')
    allowed_origins.add('https://madurai-civic-system.vercel.app')
    CORS(app, resources={r"/api/*": {"origins": list(allowed_origins)}}, supports_credentials=True)

    try:
        connect(host=app.config['MONGO_URI'])
        print("MongoDB connected successfully")
    except Exception as e:
        print(f"MongoDB connection error: {e}")

    from routes.auth import auth_bp
    from routes.complaints import complaints_bp
    from routes.blockchain import blockchain_bp
    from routes.admin import admin_bp
    from routes.analytics import analytics_bp
    from routes.notifications import notifications_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(complaints_bp, url_prefix='/api/complaints')
    app.register_blueprint(blockchain_bp, url_prefix='/api/blockchain')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')

    @app.route('/api/health')
    def health():
        return {'status': 'healthy', 'version': '1.0.0'}

    return app

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app = create_app()
    app.run(debug=False, host='0.0.0.0', port=port)
