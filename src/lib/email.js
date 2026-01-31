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

export async function sendWelcomeEmail(to, name, employeeId, password) {
    const loginUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/login"

    const mailOptions = {
        from: '"Dayflow HR" <admin@dayflow.app>',
        to,
        subject: 'Welcome to Dayflow - Your Credentials',
        text: `Hello ${name},\n\nWelcome to Dayflow! Your account has been created.\n\nLogin ID: ${employeeId}\nTemporary Password: ${password}\n\nPlease login at: ${loginUrl}\n\nYou will be required to change your password upon first login.\n\nRegards,\nHR Team`,
        html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Welcome to Dayflow, ${name}!</h2>
        <p>Your account has been successfully created.</p>
        <div style="background: #f4f6f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Login ID:</strong> ${employeeId}</p>
            <p><strong>Temporary Password:</strong> ${password}</p>
        </div>
        <p>Please login at <a href="${loginUrl}">${loginUrl}</a></p>
        <p><em>You will be asked to change your password immediately.</em></p>
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
            console.log("Login URL:", loginUrl)
            console.log("=".repeat(60) + "\n")
        } else {
            console.log("✅ Email sent successfully to:", to)
        }
        return true
    } catch (error) {
        console.error("❌ Failed to send email:", error.message)
        // Log credentials to console as fallback
        console.log("\n" + "=".repeat(60))
        console.log("⚠️ EMAIL FAILED - Credentials for manual delivery:")
        console.log("=".repeat(60))
        console.log("Employee Email:", to)
        console.log("Employee ID:", employeeId)
        console.log("Temporary Password:", password)
        console.log("Login URL:", loginUrl)
        console.log("=".repeat(60) + "\n")
        return false
    }
}
