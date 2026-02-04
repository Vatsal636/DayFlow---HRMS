# Email Configuration Guide

## Gmail SMTP Setup (Recommended for Development)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification**
3. Enable 2-Step Verification if not already enabled

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select **App**: Mail
3. Select **Device**: Other (Custom name)
4. Enter name: "Dayflow HRMS"
5. Click **Generate**
6. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 3: Update .env File
Add these variables to your `.env` file (remove spaces from app password):

```env
# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop
EMAIL_FROM="Dayflow HR <your-email@gmail.com>"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Restart Development Server
```bash
# Stop the server (Ctrl+C)
npm run dev
```

---

## Alternative SMTP Services

### Outlook/Office 365
```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### SendGrid (Production Recommended)
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

### Mailgun
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASSWORD=your-mailgun-password
```

---

## Testing Email Configuration

### Option 1: Create Test Employee
1. Login as admin
2. Navigate to Employees page
3. Add a new employee
4. Check terminal for email logs

### Option 2: Test Password Reset
1. Go to login page
2. Click "Forgot Password"
3. Enter your email
4. Check terminal for email logs

---

## Troubleshooting

### Error: "Invalid login: 535 Username and Password not accepted"
- **Solution**: Use App Password, not regular password
- Make sure 2FA is enabled on Google Account
- Remove spaces from the 16-character app password

### Error: "Connection timeout"
- Check if port 587 is blocked by firewall
- Try port 465 with `EMAIL_PORT=465`

### Error: "Self-signed certificate"
- Add to .env: `NODE_TLS_REJECT_UNAUTHORIZED=0` (development only)

### Emails not being sent but no errors
- Check spam folder
- Verify EMAIL_USER matches the FROM email
- Check Gmail "Sent" folder

---

## Mock Mode (No Configuration Required)

If you don't configure email settings, Dayflow runs in **mock mode**:
- Emails are logged to terminal instead of being sent
- Employee credentials appear in console
- Useful for development/testing

---

## Production Recommendations

For production, use a dedicated email service:
1. **SendGrid**: 100 emails/day free, easy setup
2. **Mailgun**: 5,000 emails/month free
3. **AWS SES**: Very cheap, requires AWS account
4. **Postmark**: Reliable, great deliverability

Never use personal Gmail for production!
