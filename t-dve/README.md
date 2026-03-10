# 🚗 TDRIVERS – System Architecture

TDrivers follows a **modern cloud-based full stack architecture** connecting mobile and web users to scalable backend services and cloud infrastructure.

-------------------------------------------------------------------------------

ARCHITECTURE OVERVIEW

                Mobile App (Android / iOS)
                         │
                         │
                Web Application (Browser)
                         │
                         ▼
                ┌────────────────────────────┐
                │  Frontend (Ionic + React)  │
                │  Built with Vite + TS      │
                └─────────────┬──────────────┘
                              │ REST APIs
                              ▼
                ┌────────────────────────────┐
                │   Backend API (Node.js)    │
                │   Express + Socket.IO      │
                └─────────────┬──────────────┘
                              │
        ┌─────────────────────┼──────────────────────┐
        ▼                     ▼                      ▼
 ┌───────────────┐    ┌───────────────┐     ┌────────────────┐
 │ PostgreSQL DB │    │   AWS S3      │     │  Razorpay      │
 │ (Main Data)   │    │ (File Store)  │     │  Payments      │
 └───────────────┘    └───────────────┘     └────────────────┘
                              │
                              ▼
                         OneSignal Push

-------------------------------------------------------------------------------

REQUEST FLOW

User Action (App/Web)
        │
        ▼
Frontend (Ionic React App)
        │
        ▼
REST API Request → Backend (Express Server)
        │
        ├── Read/Write → PostgreSQL Database
        ├── File Upload → AWS S3
        ├── Payment Process → Razorpay
        ├── Push Notification → OneSignal
        └── Realtime Updates → Socket.IO
        │
        ▼
Response Returned to Frontend
        │
        ▼
UI Updates Instantly

-------------------------------------------------------------------------------

DEPLOYMENT ARCHITECTURE

Developer Pushes Code
        │
        ▼
GitLab CI/CD Pipeline
        │
        ├── Install Dependencies
        ├── Build Docker Image
        ├── Push Image to AWS ECR
        └── Deploy to AWS EC2 Instance
                      │
                      ▼
             Docker Container (Backend)
                      │
                      ▼
            Public API → https://app.tdrivers.in

Frontend is built and deployed as a web build served via Capacitor and browser.

-------------------------------------------------------------------------------

ARCHITECTURE HIGHLIGHTS

| Area        | Technology Choice |
|-------------|------------------|
| Frontend    | Ionic React + TypeScript |
| Backend     | Node.js + Express |
| Realtime    | Socket.IO |
| Database    | PostgreSQL |
| Storage     | AWS S3 |
| Payments    | Razorpay |
| Push        | OneSignal |
| Deployment  | Docker + AWS ECR + EC2 |
| CI/CD       | GitLab Pipelines |

-------------------------------------------------------------------------------

CROSS-PLATFORM SUPPORT

Built using Ionic React + Capacitor (Single Codebase)

| Platform | Support |
|----------|---------|
| Web      | ✅ |
| Android  | ✅ |
| iOS      | ✅ |

-------------------------------------------------------------------------------

FRONTEND TECH STACK

| Technology | Purpose |
|------------|---------|
| React 18 | UI library |
| Ionic React 8 | Mobile-ready components |
| TypeScript | Type safety |
| Vite | Fast dev + build |
| Tailwind CSS | Styling |
| React Hook Form | Form handling |
| i18next | Multi-language |
| Capacitor 7 | Native bridge |
| Sentry | Error tracking |
| Socket.IO Client | Realtime updates |
| Google Maps API | Location services |

-------------------------------------------------------------------------------

CORE APPLICATION MODULES

AUTH & USER SYSTEM
- OTP Login
- Role-based access (Driver / Owner / Admin / Super Admin)
- Profile & KYC Management

DRIVER MODULE
- Driver Dashboard
- Trip Requests & Accept Flow
- Booking Management
- Earnings
- Trip Completion Summary

CAR OWNER MODULE
- Post Driver Requirement
- View Interested Drivers
- Booking Status Tracking
- Payment History

ADMIN MODULE
- Driver & Owner Approval
- Role & Permission Management
- Trip Monitoring
- Reports & Analytics
- Platform Configuration

PAYMENT SYSTEM
- Driver wallet
- Owner booking payments
- Razorpay integration
- Payment success/failure tracking

REALTIME & ALERTS
- Trip status updates via Socket.IO
- Push notifications via OneSignal
- Live booking updates

FILE MANAGEMENT
- Document uploads (DL, RC, Profile Docs)
- Stored securely in AWS S3

-------------------------------------------------------------------------------

FRONTEND NAVIGATION ARCHITECTURE

The app dynamically changes bottom tabs based on user role:

| User Role | Bottom Tabs |
|-----------|-------------|
| Driver    | Home • Booking • Payment • Profile |
| Owner     | Home • Booking • Profile |
| Admin     | Home • Approval • Configure • Report • Roles |

Routing handled using:
- IonReactRouter
- ProtectedRoute (Role-based access)
- Context-driven auth (UserContext)

-------------------------------------------------------------------------------

RUNNING FRONTEND LOCALLY

Install dependencies:
npm install

Start dev server:
npm run dev

App runs at:
http://localhost:5173

-------------------------------------------------------------------------------

PRODUCTION BUILD

npm run build

-------------------------------------------------------------------------------

RUN ON MOBILE

Android:
npx cap sync android
npx cap open android

iOS:
npx cap sync ios
npx cap open ios

-------------------------------------------------------------------------------

BACKEND TECH STACK

| Technology | Purpose |
|------------|---------|
| Node.js | Server runtime |
| Express.js | REST API framework |
| PostgreSQL | Relational database |
| Socket.IO | Realtime communication |
| AWS SDK | S3 file uploads |
| JWT | Authentication |
| Docker | Containerization |

-------------------------------------------------------------------------------

BACKEND RESPONSE STANDARD

All APIs return structured responses:

{
  "status": true,
  "statusCode": 200,
  "message": "Success",
  "data": { }
}

Errors:

{
  "status": false,
  "statusCode": 400,
  "error": "Error message"
}

-------------------------------------------------------------------------------

SERVER STARTUP

Server runs on:
http://localhost:3000/service
Public API:
https://service.tdrivers.in/service

-------------------------------------------------------------------------------

TDrivers = Scalable • Realtime • Cloud-Native Driver Booking Platform
