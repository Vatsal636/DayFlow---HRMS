# 🌊 DayFlow HRMS

A modern Human Resource Management System built with Next.js, React, and PostgreSQL.

## ✨ Features

- **Employee Management** - Complete employee lifecycle management with role-based access control
- **Attendance Tracking** - Real-time check-in/check-out with visual calendar and history
- **Leave Management** - Apply, approve, and track various types of leaves with email notifications
- **Payroll System** - Automated salary calculations, monthly processing, and payroll history
- **Notifications** - In-app notification center with email integration
- **Internal Messaging** - Real-time chat between admins and employees
- **Security** - JWT authentication, CSRF protection, audit logging, and rate limiting

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS, Framer Motion
- **Backend**: Next.js API Routes, JWT, bcrypt
- **Database**: PostgreSQL with Prisma ORM
- **Email**: Nodemailer

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- PostgreSQL 15.x or higher
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/Vatsal636/DayFlow---HRMS.git
cd DayFlow---HRMS
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```env
DATABASE_URL="postgresql://username:password@localhost:5432/dayflow"
JWT_SECRET="your-secret-key"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="DayFlow HRMS <noreply@dayflow.com>"
```

4. Setup database
```bash
npx prisma migrate dev
npx prisma generate
```

5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### First Time Setup

1. Navigate to `/auth/setup` to create the first admin account
2. Complete email verification
3. Login and start managing your organization!

## 📁 Project Structure

```
src/
├── app/
│   ├── admin/          # Admin dashboard and management pages
│   ├── api/            # API routes for all features
│   ├── auth/           # Authentication pages
│   └── dashboard/      # Employee dashboard pages
├── components/         # Reusable React components
├── lib/                # Utility functions (auth, email, prisma)
└── middleware.js       # Authentication & CSRF middleware
```

## 🔐 Security

- JWT-based authentication with HTTP-only cookies
- CSRF protection using double-submit cookie pattern
- Password hashing with bcrypt
- Rate limiting and account lockout
- Email verification for new accounts
- Comprehensive audit logging

## 📝 License

MIT License - feel free to use this project for learning or production.

---

**Built with ❤️ using Next.js**

