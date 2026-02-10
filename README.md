<div align="center">
  
# 🌊 DayFlow HRMS

**A Modern Human Resource Management System**

*Streamline your workforce management with powerful attendance tracking, leave management, payroll processing, and real-time analytics.*

[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.19.0-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4.1-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

---

</div>

## 📋 Table of Contents

- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Database Setup](#database-setup)
- [📁 Project Structure](#-project-structure)
- [🔐 Security Features](#-security-features)
- [🎯 Key Modules](#-key-modules)
- [📸 Screenshots](#-screenshots)
- [🔧 API Documentation](#-api-documentation)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

### 👥 Employee Management
- **Comprehensive Employee Profiles** - Personal details, job information, and profile pictures
- **Role-Based Access Control** - Admin and Employee roles with granular permissions
- **Email Verification** - Secure account activation with email verification
- **Account Security** - Rate limiting, account lockout after failed attempts, password strength requirements

### ⏰ Attendance System
- **Real-Time Check-In/Check-Out** - One-click attendance marking with automatic time tracking
- **Visual Attendance Calendar** - Monthly view with color-coded status indicators
- **Attendance History** - Comprehensive logs with date filtering and search
- **Late Detection** - Automatic flagging of late arrivals (after 9:00 AM)
- **Leave Integration** - Approved leaves automatically reflected in attendance

### 🏖️ Leave Management
- **Multiple Leave Types** - Paid, Sick, Unpaid, and Casual leave categories
- **Leave Balance Tracking** - Real-time leave quota monitoring
- **Approval Workflow** - Admin approval/rejection with comments
- **Email Notifications** - Automated notifications for leave requests and status updates
- **Leave Calendar** - Visual representation of approved leaves

### 💰 Payroll System
- **Flexible Salary Structure** - Customizable components (Basic, HRA, Medical, Transport, Special Allowance)
- **Automated Calculations** - Leave-based deductions, tax calculations, and net salary computation
- **Payroll Processing** - Monthly salary generation with one-click processing
- **Payroll History** - Complete payment records with downloadable reports
- **Salary Simulator** - Preview salary calculations before processing

### 🔔 Notifications
- **In-App Notifications** - Real-time bell icon with unread count
- **Email Integration** - Automated email notifications for critical events
- **Notification Preferences** - User-configurable notification settings
- **Notification Categories** - Leave requests, approvals, rejections, payroll updates, system alerts

### 💬 Internal Messaging
- **Real-Time Chat** - Instant messaging between admins and employees
- **Message History** - Persistent chat with timestamp tracking
- **Admin Broadcast** - Send messages to individual employees

### 📊 Analytics & Reporting
- **Admin Dashboard** - Real-time stats (total employees, attendance, leave requests, payroll)
- **Employee Dashboard** - Personal stats (present days, late days, total hours, leave balance)
- **Leaderboard** - Gamified work hours ranking system
- **Attendance Analytics** - Detailed attendance breakdown with charts

### 🔐 Advanced Security
- **JWT Authentication** - Secure token-based authentication
- **CSRF Protection** - Double-submit cookie pattern for state-changing operations
- **Audit Logging** - Complete audit trail of all system activities
- **Password Security** - Bcrypt hashing, strength validation, mandatory password change on first login
- **Rate Limiting** - Protection against brute force attacks
- **Account Lockout** - Automatic locking after 5 failed login attempts

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16.1.1 (App Router)
- **UI Library**: React 19
- **Styling**: TailwindCSS 3.4.1
- **Animations**: Framer Motion 11.15.0
- **Icons**: Lucide React 0.468.0
- **Date Handling**: date-fns 4.1.0

### Backend
- **Runtime**: Node.js with Edge Runtime support
- **API**: Next.js API Routes (REST)
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Password Hashing**: bcrypt 5.1.1
- **Email**: Nodemailer 6.9.16

### Database
- **Database**: PostgreSQL
- **ORM**: Prisma 5.19.0
- **Migration Management**: Prisma Migrate

### Development Tools
- **Linting**: ESLint 9
- **Dev Server**: Turbopack
- **Package Manager**: npm

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 10.x or higher
- **PostgreSQL** 15.x or higher
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Vatsal636/DayFlow---HRMS.git
   cd DayFlow---HRMS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

### Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dayflow"

# JWT Secret (generate strong random string)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Email Configuration (Gmail example)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-specific-password"
EMAIL_FROM="DayFlow HRMS <noreply@dayflow.com>"
```

**⚠️ Security Note**: 
- Generate a strong `JWT_SECRET` using: `openssl rand -base64 32`
- For Gmail, use [App Passwords](https://support.google.com/accounts/answer/185833) instead of your account password

### Database Setup

1. **Create PostgreSQL database**
   ```bash
   createdb dayflow
   ```

2. **Run Prisma migrations**
   ```bash
   npx prisma migrate dev
   ```

3. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

4. **Seed the database (Optional)**
   ```bash
   # Seed default payroll structure
   curl http://localhost:3000/api/seed/payroll
   ```

### Running the Application

**Development Mode**
```bash
npm run dev
```

**Production Build**
```bash
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### First Login

1. Navigate to `/auth/setup` to create the first admin account
2. Complete email verification
3. Change password on first login
4. Start adding employees!

---

## 📁 Project Structure

```
dayflow/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.mjs              # Database seeding scripts
├── public/                    # Static assets
├── src/
│   ├── app/
│   │   ├── admin/            # Admin dashboard pages
│   │   │   ├── attendance/   # Admin attendance management
│   │   │   ├── chat/         # Admin messaging
│   │   │   ├── employees/    # Employee CRUD
│   │   │   ├── leaves/       # Leave approval
│   │   │   └── payroll/      # Payroll processing
│   │   ├── api/              # API routes
│   │   │   ├── admin/        # Admin-only endpoints
│   │   │   ├── attendance/   # Attendance APIs
│   │   │   ├── auth/         # Authentication
│   │   │   ├── chat/         # Messaging APIs
│   │   │   ├── leaves/       # Leave management
│   │   │   ├── notifications/# Notification APIs
│   │   │   └── payroll/      # Payroll APIs
│   │   ├── auth/             # Authentication pages
│   │   ├── dashboard/        # Employee dashboard pages
│   │   │   ├── attendance/   # Personal attendance
│   │   │   ├── chat/         # Employee messaging
│   │   │   ├── leaves/       # Leave requests
│   │   │   ├── payroll/      # Payroll history
│   │   │   ├── profile/      # User profile
│   │   │   └── simulator/    # Salary simulator
│   │   ├── login/            # Login page
│   │   ├── layout.js         # Root layout
│   │   ├── page.js           # Landing page
│   │   └── globals.css       # Global styles
│   ├── components/           # Reusable components
│   │   ├── AddEmployeeModal.js
│   │   ├── AttendanceCalendar.js
│   │   ├── ChatInterface.js
│   │   ├── EditEmployeeModal.js
│   │   ├── FloatingNavbar.js
│   │   ├── NotificationBell.js
│   │   └── Toast.js          # Toast notification system
│   ├── lib/
│   │   ├── auth.js           # JWT utilities, CSRF tokens
│   │   ├── audit.js          # Audit logging
│   │   ├── email.js          # Email service
│   │   ├── notifications.js  # Notification utilities
│   │   ├── prisma.js         # Prisma client
│   │   └── utils.js          # Helper functions
│   └── middleware.js         # Auth & CSRF middleware
├── .env                      # Environment variables
├── .eslintrc.json           # ESLint configuration
├── next.config.mjs          # Next.js configuration
├── postcss.config.mjs       # PostCSS configuration
├── tailwind.config.mjs      # Tailwind configuration
└── package.json             # Dependencies
```

---

## 🔐 Security Features

### 🛡️ Authentication & Authorization
- **JWT-based Authentication** - Secure token storage in HTTP-only cookies
- **Role-Based Access Control (RBAC)** - Admin vs Employee permissions
- **Email Verification** - Account activation via email token
- **Password Security** - Bcrypt hashing with 10 salt rounds
- **First Login Password Change** - Mandatory password update
- **Password Strength Validation** - Minimum 8 characters with complexity requirements

### 🔒 Attack Prevention
- **CSRF Protection** - Double-submit cookie pattern on all state-changing operations
- **Rate Limiting** - Login attempt throttling (5 attempts per 15 minutes)
- **Account Lockout** - Automatic 15-minute lockout after 5 failed attempts
- **SQL Injection Prevention** - Parameterized queries via Prisma ORM
- **XSS Protection** - React's built-in escaping + Content Security Policy headers

### 📝 Audit & Compliance
- **Comprehensive Audit Logging** - All CRUD operations logged with:
  - User ID and IP address
  - Action type and resource
  - Timestamp and request metadata
- **Audit Actions Tracked**:
  - Employee CRUD (CREATE, UPDATE, DELETE)
  - Attendance (CHECK_IN, CHECK_OUT)
  - Leave management (APPLY, APPROVE, REJECT)
  - Payroll processing
  - Authentication events (LOGIN, LOGOUT, PASSWORD_CHANGE)

### 🔑 Token Management
- **JWT Expiry** - 7-day token lifetime
- **CSRF Token Generation** - Cryptographically secure random tokens
- **Token Validation** - Middleware-level verification on protected routes

---

## 🎯 Key Modules

### Employee Module
- Create, Read, Update, Delete employees
- Upload profile pictures (base64 encoded)
- Assign departments and job titles
- Set salary structures
- Email verification and resend functionality
- Filter by verification status

### Attendance Module
- Real-time check-in/check-out with live timer
- Automatic "PRESENT" status on check-in
- Late detection (after 9:00 AM)
- "ABSENT" marking for missed days
- "LEAVE" status for approved leaves
- Monthly calendar view with color-coded status
- Attendance history with date range filtering

### Leave Module
- Apply for leaves with date range and reason
- Multiple leave types: PAID, SICK, UNPAID, CASUAL
- Leave balance tracking per type
- Admin approval/rejection workflow
- Email notifications for all status changes
- Leave deduction from quota
- Automatic attendance record creation for approved leaves

### Payroll Module
- Flexible salary structure configuration
- Components: Basic Pay, HRA, Medical, Transport, Special Allowance
- Automated calculations:
  - Gross Salary = Sum of all components
  - Deductions = (Days Absent × Daily Rate)
  - Net Salary = Gross - Deductions
- Monthly payroll processing
- Payroll history with filtering
- Salary simulator for employees

### Notification Module
- In-app notification center with bell icon
- Real-time unread count badge
- Email notifications for:
  - Leave requests (to admin)
  - Leave approvals/rejections (to employee)
  - Payroll processing (to employee)
  - Account activation
- Notification preferences per user
- Mark as read/unread functionality

---

## 📸 Screenshots

### 🏠 Employee Dashboard
*Real-time attendance tracking with live work timer and gamified leaderboard*

### 👨‍💼 Admin Dashboard
*Comprehensive overview with employee stats, pending approvals, and quick actions*

### 📅 Attendance Calendar
*Visual monthly calendar with color-coded attendance status*

### 💸 Payroll Management
*Flexible salary structure configuration and automated payroll processing*

### 🔔 Notification Center
*In-app notification bell with real-time updates and email integration*

---

## 🔧 API Documentation

### Authentication Endpoints

#### `POST /api/auth/login`
**Description**: User login  
**Request Body**:
```json
{
  "employeeId": "OIVG20250001",
  "password": "SecurePass123!"
}
```
**Response**:
```json
{
  "user": {
    "id": 1,
    "employeeId": "OIVG20250001",
    "role": "EMPLOYEE",
    "emailVerified": true
  },
  "token": "eyJhbGc..."
}
```

#### `POST /api/auth/register` (Admin Only)
**Description**: Create new user  
**Headers**: `x-csrf-token: <token>`  
**Request Body**:
```json
{
  "employeeId": "OIVG20250002",
  "email": "john.doe@company.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "jobTitle": "Software Engineer",
  "department": "Engineering",
  "joiningDate": "2026-02-10"
}
```

### Attendance Endpoints

#### `GET /api/attendance`
**Description**: Get today's attendance status  
**Response**:
```json
{
  "checkedIn": true,
  "checkedOut": false,
  "checkInTime": "2026-02-10T09:15:00.000Z",
  "checkOutTime": null,
  "status": "PRESENT"
}
```

#### `POST /api/attendance`
**Description**: Check in  
**Headers**: `x-csrf-token: <token>`  
**Response**:
```json
{
  "attendance": {
    "id": 42,
    "userId": 1,
    "date": "2026-02-10T00:00:00.000Z",
    "checkIn": "2026-02-10T09:15:00.000Z",
    "status": "PRESENT"
  }
}
```

#### `PUT /api/attendance`
**Description**: Check out  
**Headers**: `x-csrf-token: <token>`

### Leave Endpoints

#### `POST /api/leaves`
**Description**: Apply for leave  
**Headers**: `x-csrf-token: <token>`  
**Request Body**:
```json
{
  "type": "SICK",
  "startDate": "2026-02-12",
  "endDate": "2026-02-13",
  "reason": "Medical appointment"
}
```

#### `GET /api/admin/leaves` (Admin Only)
**Description**: Get all leave requests  
**Query Params**: `status=PENDING|APPROVED|REJECTED`

#### `PUT /api/admin/leaves` (Admin Only)
**Description**: Approve/Reject leave  
**Headers**: `x-csrf-token: <token>`  
**Request Body**:
```json
{
  "leaveId": 5,
  "status": "APPROVED",
  "adminComments": "Approved for medical reasons"
}
```

### Payroll Endpoints

#### `GET /api/payroll/history`
**Description**: Get employee payroll history  
**Query Params**: `year=2026&month=02`

#### `POST /api/admin/payroll/process` (Admin Only)
**Description**: Process monthly payroll  
**Headers**: `x-csrf-token: <token>`  
**Request Body**:
```json
{
  "month": 2,
  "year": 2026
}
```

### Notification Endpoints

#### `GET /api/notifications`
**Description**: Get user notifications  
**Query Params**: `unreadOnly=true`

#### `PUT /api/notifications/:id`
**Description**: Mark notification as read  
**Headers**: `x-csrf-token: <token>`

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Development Guidelines
- Follow existing code structure and naming conventions
- Write descriptive commit messages
- Test thoroughly before submitting PRs
- Update documentation for new features
- Ensure no ESLint errors

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### 🌟 If you find this project helpful, please give it a star!

**Built with ❤️ by the DayFlow Team**

[Report Bug](https://github.com/Vatsal636/DayFlow---HRMS/issues) · [Request Feature](https://github.com/Vatsal636/DayFlow---HRMS/issues)

</div>

