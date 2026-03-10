# Backend – Node.js + Express API

The T Drivers backend powers all core platform features including authentication services, payments, and real-time communication.

---

## Backend Overview

| Layer | Technology |
|------|------------|
| **Runtime** | Node.js |
| **Framework** | Express 5 |
| **Database** | Postgresql |
| **Realtime** | Socket.IO |
| **Authentication** | JWT |
| **Cloud Storage** | AWS S3 |
| **Payments** | Razorpay |

---

## Backend Architecture

The backend follows a **modular and middleware-driven architecture**.

### Request Lifecycle

1. Request received  
2. CORS & body parsing  
3. Request logging (latency + status)  
4. Validation middleware  
5. Route controller  
6. Response sent & logged  

---

## Authentication System

The system uses **JWT-based authentication**.

| Feature | Description |
|--------|-------------|
| Token Type | Bearer Token |
| Validation | Middleware-based |
| Roles Supported | `admin`, `Owner`, `Driver` |
| Error Handling | Expired, invalid, malformed tokens |

### Auth Header Format

```
Authorization: Bearer <token>
```

---

##  Database

| Feature | Technology |
|--------|------------|
| Primary Database | postgresql |
| Query Handling | postgresql |

---

## File Storage

Files such as documents and uploads are stored using:

| Service | Purpose |
|--------|---------|
| AWS S3 | Secure file storage |
| Pre-signed URLs | Secure upload/download |

---

## Running Backend Locally

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

Server runs at:

```
http://localhost:PORT/service
```

---

## Production Build

```bash
npm run build
npm start
```

---

## 🐳 Docker Support

### Build Docker Image

```bash
docker build -t college-backend .
```

### Run Container

```bash
docker run -p 3000:3000 college-backend
```

---

## 🚀 CI/CD Pipeline

The backend uses **GitLab CI/CD** for automated deployment.

| Stage | Purpose |
|------|---------|
| **Test** | Install dependencies & verify build |
| **Build** | Build Docker image |
| **Push** | Push image to AWS ECR |
| **Deploy** | SSH to EC2 and run latest container |

### Deployment Flow

```
Git Push → GitLab CI → Docker Build → Push to ECR → Deploy to EC2
```

---

## AWS Infrastructure

| Service | Purpose |
|--------|---------|
| EC2 | Backend hosting |
| ECR | Docker image registry |
| S3 | File storage |
| Cloud Infra | Scalable hosting environment |

---

## Security Features

- JWT authentication  
- Role-based access control  
- Request validation middleware  
- Secure file uploads  
- CORS protection  

---

## 📂 Backend Project Structure

```
src/
 ├── routes/        # API route definitions
 ├── controllers/   # Business logic
 ├── middleware/    # Auth, validation, logging
 ├── config/        # App configuration
 └── utils/         # Helper utilities
```
