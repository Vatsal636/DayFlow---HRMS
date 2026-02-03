import nodemailer from 'nodemailer'

// Check if email is properly configured
const isEmailConfigured = process.env.EMAIL_HOST && 
                          process.env.EMAIL_USER && 
                          process.env.EMAIL_PASSWORD

// Create a transporter only if email is configured
// Otherwise, use a mock transport that logs to console
const transporter = isEmailConfigured 
    ? nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || "587"),
        secure: process.env.EMAIL_PORT === "465", // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    })
    : nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true
    })

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
const FROM_EMAIL = process.env.EMAIL_FROM || '"Dayflow HR" <noreply@dayflow.app>'

export async function sendWelcomeEmail(to, name, employeeId, password, verificationToken) {
    const loginUrl = `${APP_URL}/login`
    const verificationUrl = `${APP_URL}/auth/verify-email?token=${verificationToken}`

    const mailOptions = {
        from: FROM_EMAIL,
        to,
        subject: 'Welcome to Dayflow - Verify Your Email',
        text: `Hello ${name},\n\nWelcome to Dayflow! Your account has been created.\n\nLogin ID: ${employeeId}\nTemporary Password: ${password}\n\nPlease verify your email by clicking: ${verificationUrl}\n\nAfter verification, login at: ${loginUrl}\n\nYou will be required to change your password upon first login.\n\nRegards,\nHR Team`,
        html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Welcome to Dayflow, ${name}!</h2>
        <p>Your account has been successfully created.</p>
        <div style="background: #f4f6f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Login ID:</strong> ${employeeId}</p>
            <p><strong>Temporary Password:</strong> ${password}</p>
        </div>
        <p style="margin: 25px 0;">
          <a href="${verificationUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </p>
        <p>After verification, please login at <a href="${loginUrl}">${loginUrl}</a></p>
        <p><em>You will be asked to change your password immediately.</em></p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours.</p>
      </div>
    `
    }

    try {
        const info = await transporter.sendMail(mailOptions)
        
        if (!isEmailConfigured) {
            // Mock mode - just log the credentials
            console.log("\n" + "=".repeat(60))
            console.log("📧 [EMAIL - MOCK MODE] Email would be sent to:", to)
            console.log("=".repeat(60))
            console.log("Subject:", mailOptions.subject)
            console.log("Employee ID:", employeeId)
            console.log("Temporary Password:", password)
            console.log("Verification URL:", verificationUrl)
            console.log("Login URL:", loginUrl)
            console.log("=".repeat(60) + "\n")
        } else {
            console.log("✅ Welcome email sent successfully to:", to)
        }
        return true
    } catch (error) {
        console.error("❌ Failed to send welcome email:", error.message)
        // Log credentials to console as fallback
        console.log("\n" + "=".repeat(60))
        console.log("⚠️ EMAIL FAILED - Credentials for manual delivery:")
        console.log("=".repeat(60))
        console.log("Employee Email:", to)
        console.log("Employee ID:", employeeId)
        console.log("Temporary Password:", password)
        console.log("Verification URL:", verificationUrl)
        console.log("Login URL:", loginUrl)
        console.log("=".repeat(60) + "\n")
        return false
    }
}

export async function sendPasswordResetEmail(to, name, resetToken) {
    const resetUrl = `${APP_URL}/auth/reset-password?token=${resetToken}`

    const mailOptions = {
        from: FROM_EMAIL,
        to,
        subject: 'Password Reset Request - Dayflow',
        text: `Hello ${name},\n\nWe received a request to reset your password.\n\nClick here to reset: ${resetUrl}\n\nIf you didn't request this, please ignore this email.\n\nThis link expires in 1 hour.\n\nRegards,\nHR Team`,
        html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your Dayflow password.</p>
        <p style="margin: 25px 0;">
          <a href="${resetUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">This link will expire in 1 hour.</p>
      </div>
    `
    }

    try {
        const info = await transporter.sendMail(mailOptions)
        
        if (!isEmailConfigured) {
            console.log("\n📧 [MOCK] Password reset email:", to)
            console.log("Reset URL:", resetUrl, "\n")
        } else {
            console.log("✅ Password reset email sent to:", to)
        }
        return true
    } catch (error) {
        console.error("❌ Failed to send password reset email:", error.message)
        return false
    }
}

export async function sendEmailVerificationEmail(to, name, verificationToken) {
    const verificationUrl = `${APP_URL}/auth/verify-email?token=${verificationToken}`

    const mailOptions = {
        from: FROM_EMAIL,
        to,
        subject: 'Verify Your Email - Dayflow',
        text: `Hello ${name},\n\nPlease verify your email address by clicking: ${verificationUrl}\n\nThis link expires in 24 hours.\n\nRegards,\nHR Team`,
        html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Verify Your Email</h2>
        <p>Hello ${name},</p>
        <p>Please verify your email address to complete your Dayflow registration.</p>
        <p style="margin: 25px 0;">
          <a href="${verificationUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email
          </a>
        </p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">This link will expire in 24 hours.</p>
      </div>
    `
    }

    try {
        const info = await transporter.sendMail(mailOptions)
        
        if (!isEmailConfigured) {
            console.log("\n📧 [MOCK] Email verification:", to)
            console.log("Verification URL:", verificationUrl, "\n")
        } else {
            console.log("✅ Verification email sent to:", to)
        }
        return true
    } catch (error) {
        console.error("❌ Failed to send verification email:", error.message)
        return false
    }
}

export async function sendTwoFactorCodeEmail(to, name, code) {
    const mailOptions = {
        from: FROM_EMAIL,
        to,
        subject: 'Two-Factor Authentication Code - Dayflow',
        text: `Hello ${name},\n\nYour verification code is: ${code}\n\nThis code expires in 5 minutes.\n\nRegards,\nHR Team`,
        html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Two-Factor Authentication</h2>
        <p>Hello ${name},</p>
        <p>Your verification code is:</p>
        <div style="background: #f4f6f8; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h1 style="margin: 0; font-size: 32px; letter-spacing: 8px; color: #3b82f6;">${code}</h1>
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">This code expires in 5 minutes.</p>
      </div>
    `
    }

    try {
        const info = await transporter.sendMail(mailOptions)
        
        if (!isEmailConfigured) {
            console.log("\n📧 [MOCK] 2FA code for", to, ":", code, "\n")
        } else {
            console.log("✅ 2FA code sent to:", to)
        }
        return true
    } catch (error) {
        console.error("❌ Failed to send 2FA code:", error.message)
        return false
    }
}
