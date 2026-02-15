# DayFlow Deployment Guide

## Deploying to Vercel

### Prerequisites

1. **GitHub Repository** ✅ (Already set up at https://github.com/Vatsal636/DayFlow---HRMS.git)
2. **Production Database** - You'll need a PostgreSQL database

### Step 1: Set Up Production Database

Choose one of these hosted PostgreSQL services:

#### Option A: Supabase (Recommended - Free Tier)
1. Go to https://supabase.com
2. Sign up / Sign in
3. Create a new project
4. Go to **Settings** → **Database**
5. Copy the **Connection String** (URI format)
   - It looks like: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

#### Option B: Neon (Free Tier)
1. Go to https://neon.tech
2. Sign up / Sign in
3. Create a new project
4. Copy the connection string from the dashboard

#### Option C: Railway (Pay as you go)
1. Go to https://railway.app
2. Sign up / Sign in
3. Create a new PostgreSQL database
4. Copy the connection string

### Step 2: Deploy to Vercel

1. **Go to Vercel**
   - Visit https://vercel.com
   - Sign up / Sign in with your GitHub account

2. **Import Project**
   - Click "Add New" → "Project"
   - Select your GitHub repository: `Vatsal636/DayFlow---HRMS`
   - Click "Import"

3. **Configure Environment Variables**
   
   Click "Environment Variables" and add the following:

   | Name | Value | Description |
   |------|-------|-------------|
   | `DATABASE_URL` | `postgresql://...` | Your production database connection string from Step 1 |
   | `JWT_SECRET` | Generate random string | Use: `openssl rand -base64 32` or any random 32+ char string |
   | `EMAIL_HOST` | `smtp.gmail.com` | SMTP host for email |
   | `EMAIL_PORT` | `587` | SMTP port |
   | `EMAIL_USER` | `your-email@gmail.com` | Your Gmail address |
   | `EMAIL_PASSWORD` | App-specific password | Gmail App Password (see below) |
   | `EMAIL_FROM` | `DayFlow HR <your-email@gmail.com>` | From address |

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for the build to complete
   - Your app will be live at `https://your-project-name.vercel.app`

### Step 3: Initialize Database

After deployment, you need to set up your database schema:

1. **Install Vercel CLI** (if not already installed)
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Link to your project**
   ```bash
   vercel link
   ```

4. **Run Prisma migrations**
   ```bash
   npx vercel env pull .env.production
   DATABASE_URL="your-production-db-url" npx prisma db push
   DATABASE_URL="your-production-db-url" npx prisma db seed
   ```

   Or use Vercel's online shell:
   - Go to your project in Vercel Dashboard
   - Navigate to **Settings** → **Functions**
   - Use the CLI or create a one-time function to run migrations

### Step 4: Create Admin Account

After database setup, create your first admin account:

1. Visit your deployed site: `https://your-site.vercel.app/auth/setup`
2. Fill in the admin details
3. Complete setup

### Gmail App Password Setup

To send emails, you need a Gmail App Password:

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security**
3. Enable **2-Step Verification** (if not already enabled)
4. Go to **App passwords**
5. Create a new app password for "Mail"
6. Copy the 16-character password
7. Use this in the `EMAIL_PASSWORD` environment variable

### Step 5: Custom Domain (Optional)

1. Go to your project in Vercel
2. Navigate to **Settings** → **Domains**
3. Add your custom domain
4. Follow DNS configuration instructions

### Continuous Deployment

Now your app is set up with automatic deployments:
- Every push to `master` branch will automatically deploy to production
- Preview deployments are created for pull requests

### Environment Management

To update environment variables:
1. Go to Vercel Dashboard → Your Project
2. Navigate to **Settings** → **Environment Variables**
3. Add/Edit variables
4. Redeploy to apply changes

### Monitoring

- **Logs**: View real-time logs in Vercel Dashboard → Your Project → Logs
- **Analytics**: Enable Vercel Analytics in Settings
- **Performance**: Check Vercel Speed Insights

### Troubleshooting

**Build Fails:**
- Check Vercel build logs for errors
- Ensure all environment variables are set
- Verify DATABASE_URL is correct

**Database Connection Issues:**
- Verify DATABASE_URL format
- Check if database allows external connections
- Ensure connection string includes SSL parameters if required

**Email Not Sending:**
- Verify EMAIL_* variables are correct
- Check Gmail App Password is valid
- Ensure 2FA is enabled on Gmail

**Prisma Client Issues:**
- The `postinstall` script should generate Prisma Client automatically
- If issues persist, add `prisma generate` to the build command

### Production Checklist

- [ ] Production database set up and accessible
- [ ] All environment variables configured
- [ ] Database schema migrated
- [ ] Seed data loaded (optional)
- [ ] Admin account created
- [ ] Email notifications working
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Error monitoring set up
- [ ] Backup strategy defined for database

### Cost Estimation

**Vercel:**
- Hobby Plan: Free
  - 100GB bandwidth/month
  - Unlimited deployments
  - Automatic HTTPS
  
**Database (Supabase Free Tier):**
- 500MB storage
- 2GB bandwidth
- Up to 10,000 rows

**Total:** FREE for small teams! 🎉

### Getting Help

- Vercel Documentation: https://vercel.com/docs
- Prisma Documentation: https://www.prisma.io/docs
- DayFlow Issues: https://github.com/Vatsal636/DayFlow---HRMS/issues

---

**Happy Deploying! 🚀**
