TDrivers – System Architecture

TDrivers is a cloud-native driver booking platform connecting drivers, car owners, and administrators through a scalable backend and cross-platform frontend applications.

The platform supports Web, Android, and iOS using a single Ionic React codebase, powered by a Node.js backend with PostgreSQL, deployed on AWS infrastructure.

Architecture Overview
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
┌───────────────┐ ┌───────────────┐ ┌────────────────┐
│ PostgreSQL DB │ │ AWS S3        │ │ Razorpay       │
│ (Main Data)   │ │ (File Store)  │ │ Payments       │
└───────────────┘ └───────────────┘ └────────────────┘
                          │
                          ▼
                   OneSignal Push
Architecture Highlights
Area	Technology
Frontend	Ionic React + TypeScript
Backend	Node.js + Express
Realtime	Socket.IO
Database	PostgreSQL
Storage	AWS S3
Payments	Razorpay
Push Notifications	OneSignal
Deployment	Docker + AWS EC2
CI/CD	GitLab Pipelines
Request Flow

User performs action in Mobile App / Web

Request sent from Frontend (Ionic React App)

REST API request reaches Backend (Express Server)

Backend processes request

Database / external services accessed

Response returned to frontend

UI updates instantly

Example flow:

Frontend → Backend API → Database / Services → Response → UI Update
Frontend – Ionic React Application

The frontend is built using Ionic React + Capacitor, enabling a single codebase for Web, Android, and iOS.

Frontend Tech Stack
Technology	Purpose
React 18	UI library
Ionic React 8	Mobile-ready components
TypeScript	Type safety
Vite	Fast dev server & build
Tailwind CSS	Styling
React Hook Form	Form management
i18next	Multi-language support
Capacitor 7	Native mobile bridge
Socket.IO Client	Real-time updates
Google Maps API	Location services
Sentry	Error monitoring
Cross Platform Support
Platform	Supported
Web	✅
Android	✅
iOS	✅
Core Application Modules
Authentication & User System

Features:

OTP based login

Role-based access control

Profile management

KYC verification

Supported Roles:

Driver

Owner

Admin

Super Admin

Driver Module

Features:

Driver dashboard

Trip request accept flow

Booking management

Earnings overview

Trip completion summary

Car Owner Module

Features:

Post driver requirements

View interested drivers

Track booking status

View payment history

Admin Module

Features:

Driver & owner approval

Role and permission management

Trip monitoring

Reports and analytics

Platform configuration

Payment System

Payments are integrated using Razorpay.

Features:

Driver wallet

Owner booking payments

Payment success/failure tracking

Realtime Updates

Realtime features powered by Socket.IO.

Features:

Trip status updates

Live booking notifications

Instant alerts

Push Notifications

Push notifications are handled via OneSignal.

Used for:

Booking updates

Payment confirmations

Driver alerts

File Management

Files are stored securely using AWS S3.

Supported uploads:

Driver License

Vehicle RC

Profile documents

Backend – Node.js + Express API

The TDrivers backend powers authentication, business logic, payments, realtime communication, and file storage.

Backend Overview
Layer	Technology
Runtime	Node.js
Framework	Express 5
Database	PostgreSQL
Realtime	Socket.IO
Authentication	JWT
Cloud Storage	AWS S3
Payments	Razorpay
Backend Architecture

The backend follows a modular middleware-driven architecture.

Request Lifecycle

Request received

CORS & body parsing

Request logging (latency + status)

Validation middleware

Route controller

Response sent & logged

Authentication System

The system uses JWT-based authentication.

Feature	Description
Token Type	Bearer Token
Validation	Middleware-based
Roles Supported	admin, owner, driver
Error Handling	Expired, invalid, malformed tokens
Auth Header Format
Authorization: Bearer <token>
Database
Feature	Technology
Primary Database	PostgreSQL
Query Handling	PostgreSQL
File Storage

Files such as documents and uploads are stored using:

Service	Purpose
AWS S3	Secure file storage
Pre-signed URLs	Secure upload/download
Backend Project Structure
src/
 ├── routes/        # API route definitions
 ├── controllers/   # Business logic
 ├── middleware/    # Auth, validation, logging
 ├── config/        # App configuration
 └── utils/         # Helper utilities
Running Backend Locally
Install Dependencies
npm install
Start Development Server
npm run dev

Server runs at:

http://localhost:PORT/service
Production Build
npm run build
npm start
Docker Support
Build Docker Image
docker build -t tdrivers-backend .
Run Container
docker run -p 3000:3000 tdrivers-backend
CI/CD Pipeline

The backend uses GitLab CI/CD for automated deployment.

Stage	Purpose
Test	Install dependencies & verify build
Build	Build Docker image
Push	Push image to AWS ECR
Deploy	SSH to EC2 and run latest container
Deployment Flow
Git Push → GitLab CI → Docker Build → Push to AWS ECR → Deploy to EC2
AWS Infrastructure
Service	Purpose
EC2	Backend hosting
ECR	Docker image registry
S3	File storage
Cloud Infra	Scalable hosting environment
Security Features

JWT authentication

Role-based access control

Request validation middleware

Secure file uploads

CORS protection

Running Frontend Locally
Install Dependencies
npm install
Start Development Server
npm run dev

Application runs at:

http://localhost:5173
Production Build
npm run build
Run On Mobile
Android
npx cap sync android
npx cap open android
iOS
npx cap sync ios
npx cap open ios
