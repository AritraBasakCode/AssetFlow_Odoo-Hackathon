# 🚀 AssetFlow
### Enterprise Asset & Resource Management System

AssetFlow is a modern ERP-inspired web application designed to simplify how organizations manage physical assets and shared resources.

It provides a centralized platform to register assets, allocate them to employees, manage maintenance workflows, schedule audits, and book shared resources while maintaining complete activity history and role-based access control.

Built for Hackathons, Portfolio Projects, and Enterprise Demonstrations.

---

## 📌 Features

### 🔐 Authentication

- Secure Login & Signup
- JWT Authentication
- Password Hashing
- Forgot Password
- Session Management
- Role-Based Access Control (RBAC)

---

### 👥 User Roles

- Administrator
- Asset Manager
- Department Head
- Employee

---

### 🏢 Organization Management

- Department Management
- Asset Categories
- Employee Directory
- Department Hierarchy
- Role Promotion

---

### 💻 Asset Management

- Register Assets
- QR Code Generation
- Asset Tag Generation
- Asset Lifecycle Tracking

Asset States

- Available
- Allocated
- Reserved
- Under Maintenance
- Lost
- Retired
- Disposed

---

### 🔄 Asset Allocation

- Allocate Assets
- Transfer Requests
- Approval Workflow
- Return Assets
- Conflict Prevention
- Allocation History

---

### 📅 Resource Booking

- Calendar Interface
- Shared Resources
- Time Slot Booking
- Overlap Detection
- Booking Reminders

---

### 🔧 Maintenance Module

- Raise Requests
- Priority Levels
- Approval Workflow
- Technician Assignment
- Maintenance History

---

### 📋 Audit Management

- Audit Cycles
- Auditor Assignment
- Verification
- Missing Assets
- Discrepancy Reports

---

### 📊 Dashboard

- Live KPIs
- Asset Statistics
- Department Summary
- Maintenance Overview
- Upcoming Returns
- Active Bookings

---

### 🔔 Notifications

- Asset Allocation
- Booking Confirmation
- Maintenance Updates
- Transfer Approval
- Audit Alerts
- Overdue Returns

---

### 📈 Reports

- Asset Utilization
- Maintenance Trends
- Booking Heatmaps
- Department Reports
- Export to CSV/PDF

---

## 🏗️ System Architecture

```
                        Internet
                            │
                    Next.js Frontend
                            │
                  HTTPS REST API
                            │
                     FastAPI Backend
                            │
     ┌──────────────┬──────────────┬──────────────┐
     │              │              │
 Supabase DB   Supabase Auth   Supabase Storage
     │
 Activity Logs
 Notifications
```

---

## 🛠️ Tech Stack

### Frontend

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand
- TanStack Query
- React Hook Form
- Zod
- FullCalendar
- Recharts
- Lucide Icons
- Figma

---

### Backend

- FastAPI
- SQLAlchemy
- Alembic
- JWT
- bcrypt
- Pydantic

---

### Database

- PostgreSQL
- Supabase

---

### Storage

- Supabase Storage

---

### Deployment

Frontend

- Vercel

Backend

- Render

Database

- Supabase

---

## 📂 Project Structure

```
AssetFlow/

├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── store/
│   ├── lib/
│   └── types/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── database/
│   │   └── schemas/
│   │
│   └── migrations/
│
├── docs/
├── assets/
└── README.md
```

---

## 🔐 Authentication Flow

```
Signup

↓

Employee Account Created

↓

Pending Employee

↓

Admin Promotion

↓

Role Assigned

↓

Dashboard Access
```

---

## 🗄 Database

Main Tables

- users
- roles
- departments
- asset_categories
- assets
- asset_history
- allocations
- transfer_requests
- bookings
- maintenance_requests
- audit_cycles
- audit_records
- notifications
- activity_logs

---

## 🔄 Workflows

### Asset Allocation

```
Allocate

↓

Available?

↓

Yes

↓

Allocate

↓

History Updated

↓

Notification

↓

Dashboard Updated
```

---

### Resource Booking

```
Select Resource

↓

Check Calendar

↓

Conflict?

↓

Reject

↓

Otherwise

↓

Booking Created
```

---

### Maintenance

```
Request

↓

Pending

↓

Approved

↓

Technician Assigned

↓

Resolved

↓

Available Again
```

---

## 🔒 Security

- JWT Authentication
- Password Hashing
- Role-Based Authorization
- Protected API Routes
- Input Validation
- SQL Injection Protection
- Audit Logging
- Secure File Uploads