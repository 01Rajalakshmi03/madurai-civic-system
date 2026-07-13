# Blockchain-Based Civic Issues Reporting & Tracking System for Madurai Smart City

A modern blockchain-powered web application that enables citizens of Madurai Smart City to report civic issues such as road damage, garbage accumulation, water leakage, drainage problems, streetlight failure, illegal dumping, and public infrastructure damage. The system provides complete transparency, accountability, security, and tamper-proof complaint management using Ethereum Blockchain.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (React.js + Vite)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │  Citizen  │ │   Ward   │ │Corporation│ │   Admin       │  │
│  │ Dashboard │ │ Dashboard│ │Dashboard │ │   Dashboard   │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │ Map View │ │ Charts   │ │ AI Report│                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API (JWT Auth)
┌──────────────────────▼──────────────────────────────────────┐
│                 Backend (Flask + Python)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │  Auth    │ │Complaints│ │Blockchain│ │  Analytics     │  │
│  │  Routes  │ │  Routes  │ │  Routes  │ │  Routes        │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │  AI/ML   │ │Web3.py   │ │Notifica- │                    │
│  │  Service │ │ Service  │ │tion Svc  │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Database (MongoDB)                        │
│  Users │ Complaints │ Wards │ Notifications │ Blockchain    │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│               Blockchain (Ethereum / Ganache)                │
│          ComplaintRegistry.sol Smart Contract                │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Frontend
- **React.js 18** - UI Framework
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP Client
- **React Icons (Feather)** - Icons
- **Framer Motion** - Animations
- **Recharts / Chart.js** - Charts & Analytics
- **Leaflet / React-Leaflet** - Maps

### Backend
- **Python Flask** - Web Framework
- **Flask REST API** - API Architecture
- **JWT Authentication** - Security
- **Web3.py** - Blockchain Integration
- **Flask-Mail** - Email Notifications
- **MongoEngine** - MongoDB ODM
- **Gunicorn** - Production Server

### Database
- **MongoDB** - NoSQL Database

### Blockchain
- **Ethereum** - Blockchain Platform
- **Solidity** - Smart Contract Language
- **Ganache** - Local Blockchain
- **Web3.py** - Python Blockchain Integration

### AI/ML
- **Scikit-learn** - ML Models
- **NLTK** - Text Processing
- **Pandas / NumPy** - Data Processing

## Project Structure

```
blockchain-civic-system/
├── client/                    # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Admin/        # Admin dashboard components
│   │   │   ├── Auth/         # Authentication components
│   │   │   ├── Charts/       # Chart components
│   │   │   ├── Citizen/      # Citizen dashboard components
│   │   │   ├── Common/       # Shared components
│   │   │   ├── Corporation/  # Corporation dashboard components
│   │   │   ├── Layout/       # Layout components (Sidebar, Header)
│   │   │   ├── Map/          # Map components
│   │   │   ├── Notifications/# Notification components
│   │   │   ├── Reports/      # Report components
│   │   │   └── Ward/         # Ward member components
│   │   ├── context/          # React context (Auth)
│   │   ├── hooks/            # Custom hooks
│   │   ├── pages/            # Page components
│   │   ├── utils/            # Utility functions & API client
│   │   ├── App.jsx           # Main app with routing
│   │   ├── index.css         # Global styles (Tailwind)
│   │   └── main.jsx          # Entry point
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── server/                   # Flask Backend
│   ├── ai/                   # AI/ML services
│   │   └── classifier.py     # Complaint classifier, sentiment, duplicates
│   ├── models/               # MongoDB Models
│   │   ├── user.py           # User, Notification models
│   │   └── complaint.py      # Complaint, ActivityLog, Ward, BlockchainRecord
│   ├── routes/               # API Routes
│   │   ├── auth.py           # Authentication endpoints
│   │   ├── complaints.py     # Complaint CRUD endpoints
│   │   ├── blockchain.py     # Blockchain endpoints
│   │   ├── admin.py          # Admin endpoints
│   │   ├── analytics.py      # Analytics endpoints
│   │   └── notifications.py  # Notification endpoints
│   ├── services/             # Business Logic
│   │   ├── blockchain_service.py  # Web3 blockchain integration
│   │   └── notification_service.py # Email & push notifications
│   ├── utils/
│   │   └── auth.py           # JWT utilities & decorators
│   ├── app.py                # Flask application factory
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # Environment variables
│
├── contracts/                # Smart Contracts
│   └── ComplaintRegistry.sol # Ethereum smart contract
│
├── ai_models/                # Trained ML models
├── uploads/                  # File uploads
├── database/
│   └── seed.py               # Database seeding script
├── docs/                     # Documentation
├── screenshots/              # Application screenshots
└── README.md                 # Project documentation
```

## User Roles & Features

### 1. Citizen
- Register & Login with JWT Authentication
- Report civic issues with GPS location & photos
- Select issue location on interactive map
- Track complaint status in real-time
- View complaint timeline & history
- Submit feedback & rating for resolved complaints
- Notification center for complaint updates

### 2. Ward Member
- View assigned complaints for their ward
- Accept, update status, and manage complaints
- Upload work completion images
- Generate completion reports
- Dashboard with monthly performance metrics
- Complaint analytics & resolution tracking

### 3. Corporation Official
- View all complaints across wards
- Assign complaints to ward members
- Change priority levels (Low/Medium/High/Emergency)
- Escalate complaints when needed
- Allocate resources to critical issues
- Monitor ward performance metrics
- Comprehensive analytics & reports

### 4. Administrator
- User management (create, edit, deactivate)
- Ward management (create, configure)
- Officer management (assign roles & wards)
- Blockchain verification & monitoring
- AI-powered analytics & reports
- System-wide complaint monitoring
- Activity logs & audit trail

## Blockchain Features

Every complaint generates an immutable blockchain record stored on the Ethereum network:

### Smart Contract: `ComplaintRegistry.sol`
- **registerComplaint()** - Store complaint on blockchain with hash
- **updateComplaintStatus()** - Update status immutably
- **verifyComplaint()** - Verify complaint authenticity
- **getComplaint()** - Retrieve blockchain records

Blockchain records include: Complaint ID, Timestamp, Status, Assigned Officer, Cryptographic Hash

## AI/ML Features

### 1. Complaint Category Prediction
Automatically classifies complaints into 8 categories using keyword-based and ML (Naive Bayes) classification.

### 2. Priority Prediction
Predicts priority (Low/Medium/High/Emergency) based on description analysis.

### 3. Duplicate Detection
Detects duplicate complaints using:
- Text similarity (SequenceMatcher)
- Location proximity
- Combined scoring

### 4. Sentiment Analysis
Analyzes complaint descriptions for Positive/Neutral/Negative sentiment using keyword matching.

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/profile` | Get user profile |
| PUT | `/api/auth/profile` | Update profile |

### Complaints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/complaints` | Create complaint |
| GET | `/api/complaints` | List complaints |
| GET | `/api/complaints/:id` | Get complaint details |
| PUT | `/api/complaints/:id` | Update complaint |
| GET | `/api/complaints/stats` | Get complaint statistics |

### Blockchain
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blockchain/status` | Blockchain status |
| POST | `/api/blockchain/store` | Store on blockchain |
| GET | `/api/blockchain/verify/:id` | Verify complaint |
| GET | `/api/blockchain/records` | All blockchain records |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| PUT | `/api/admin/users/:id` | Update user |
| GET | `/api/admin/wards` | List wards |
| POST | `/api/admin/wards` | Create ward |
| GET | `/api/admin/officials` | List officials |
| GET | `/api/admin/stats` | Admin statistics |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/complaints-by-category` | Category distribution |
| GET | `/api/analytics/complaints-by-ward` | Ward distribution |
| GET | `/api/analytics/monthly-trends` | Monthly trends |
| GET | `/api/analytics/resolution-time` | Resolution analytics |
| GET | `/api/analytics/ward-ranking` | Ward performance ranking |

## Deployment Guide (Step by Step)

### Prerequisites

| Software | Version | Download |
|----------|---------|----------|
| Node.js | 18+ | https://nodejs.org |
| Python | 3.10+ | https://python.org |
| MongoDB | 6+ | https://mongodb.com/try/download |
| Ganache | Latest | https://trufflesuite.com/ganache |

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd blockchain-civic-system
```

### Step 2: Start MongoDB
```bash
# Windows - start MongoDB service
net start MongoDB

# Verify MongoDB is running
mongosh --eval "db.adminCommand('ping')"
```

### Step 3: Start Ganache (Blockchain)
```bash
# Open Ganache GUI and create a workspace
# OR use CLI:
npx ganache --port 7545
```
Note the **Account Address** and **Private Key** displayed — you'll need them in Step 5.

### Step 4: Setup Backend (Server)
```bash
cd server

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 5: Configure Environment Variables
Edit `server/.env` with your values:
```env
# Security
SECRET_KEY=your-random-secret-key
JWT_SECRET=your-random-jwt-secret
JWT_EXPIRATION_HOURS=24

# MongoDB
MONGO_URI=mongodb://localhost:27017/madurai_civic_db

# Blockchain (from Ganache)
BLOCKCHAIN_RPC_URL=http://127.0.0.1:7545
CONTRACT_ADDRESS=<deploy-contract-and-paste-address-here>
GANACHE_ACCOUNT=<your-ganache-account-address>
GANACHE_PRIVATE_KEY=<your-ganache-private-key>

# Email (optional)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=your-email@gmail.com

# App
FLASK_ENV=development
DEBUG=True
UPLOAD_FOLDER=../uploads
MAX_CONTENT_LENGTH=16777216
```

### Step 6: Deploy Smart Contract (Optional — Blockchain works in simulation mode without this)
1. Open [Remix IDE](https://remix.ethereum.org)
2. Paste `contracts/ComplaintRegistry.sol`
3. Compile with Solidity `0.8.0+`
4. Set environment to **Injected Provider** pointing to `http://127.0.0.1:7545`
5. Deploy the contract
6. Copy the deployed contract address
7. Paste it as `CONTRACT_ADDRESS` in `server/.env`

### Step 7: Seed the Database
```bash
cd database
python seed.py
```
This creates:
- **Admin:** admin@madurai.gov.in / admin123
- **Citizen:** citizen@test.com / password123
- **Ward Member:** ward@test.com / password123
- **Corporation Official:** official1@madurai.gov.in / password123
- Sample complaints, wards, and activity logs

### Step 8: Start the Backend Server
```bash
cd server
python app.py
```
Server runs at **http://localhost:5000**

### Step 9: Setup & Start Frontend (Client)
Open a **new terminal**:
```bash
cd client
npm install
npm run dev
```
Frontend runs at **http://localhost:3000**

### Step 10: Verify Everything Works
1. Open http://localhost:3000
2. Login with demo credentials (from Step 7)
3. File a complaint as Citizen
4. Assign it as Corporation Official
5. Resolve it as Ward Member
6. Check Admin Dashboard for analytics

### Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@madurai.gov.in | admin123 |
| Citizen | citizen@test.com | password123 |
| Ward Member | ward@test.com | password123 |
| Corporation Official | official1@madurai.gov.in | password123 |

### Troubleshooting

| Problem | Solution |
|---------|----------|
| `MongoDB connection error` | Ensure MongoDB is running: `net start MongoDB` |
| `ModuleNotFoundError` | Activate venv: `venv\Scripts\activate` then `pip install -r requirements.txt` |
| `npm error` | Delete `node_modules` and `package-lock.json`, then run `npm install` again |
| Blockchain errors | The app works in simulation mode without Ganache. Just ignore blockchain errors. |
| Port 3000 already in use | Run `npx kill-port 3000` or change port in `vite.config.js` |
| Port 5000 already in use | Change port in `server/app.py` line 57: `app.run(port=5001)` |
| `Failed to update priority` | Ensure priority values are lowercase: `low`, `medium`, `high`, `emergency` |

### Production Deployment

For production, use Gunicorn instead of Flask dev server:

```bash
cd server
gunicorn -w 4 -b 0.0.0.0:5000 app:create_app()
```

Build the frontend for production:
```bash
cd client
npm run build
```
Serve the `client/dist` folder with Nginx or any static file server.

## Security Features

- **JWT Authentication** - Token-based secure authentication
- **Password Hashing** - bcrypt password hashing
- **Role-Based Authorization** - Granular access control
- **Blockchain Verification** - Immutable complaint records
- **Input Validation** - Server-side validation
- **File Upload Validation** - Allowed file types & size limits
- **CORS Configuration** - Cross-origin security
- **Rate Limiting** - API abuse prevention

## UI/UX Design

- **Modern Government Portal** - Professional design language
- **Glassmorphism** - Modern glass-card UI elements
- **Responsive Design** - Mobile-first, fully responsive
- **Dark Mode** - Light/Dark theme toggle
- **Animations** - Smooth transitions & micro-interactions
- **Interactive Maps** - Leaflet-based complaint visualization
- **Real-time Charts** - Data visualization with Recharts

## License

This project is developed as a Final Year MCA Project.

## Support

For issues and feature requests, please create a GitHub issue.
