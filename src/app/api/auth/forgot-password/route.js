import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { sendPasswordResetEmail } from "@/lib/email"
import { generateSecureToken, hashToken, checkRateLimit, getClientIP } from "@/lib/security"
import { createAuditLog, AuditActions, AuditResources } from "@/lib/audit"

export async function POST(request) {
    try {
        const { email } = await request.json()
        
        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            )
        }
        
        // Rate limiting - 3 requests per 15 minutes per IP
        const clientIP = getClientIP(request)
        const rateLimit = checkRateLimit(`reset-${clientIP}`, 3, 15 * 60 * 1000)
        
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: `Too many reset requests. Try again in ${rateLimit.resetIn} seconds` },
                { status: 429 }
            )
        }
        
        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                details: true
            }
        })
        
        // Always return success to prevent email enumeration
        if (!user) {
            console.log("Password reset requested for non-existent email:", email)
            return NextResponse.json(
                { message: "If the email exists, a reset link has been sent" },
                { status: 200 }
            )
        }
        
        // Check if account is active
        if (!user.isActive) {
            return NextResponse.json(
                { message: "If the email exists, a reset link has been sent" },
                { status: 200 }
            )
        }
        
        // Generate reset token
        const resetToken = generateSecureToken()
        const hashedToken = hashToken(resetToken)
        const expiryDate = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
        
        // Save token to database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: hashedToken,
                passwordResetExpiry: expiryDate
            }
        })
        
        // Send reset email
        const name = user.details ? `${user.details.firstName} ${user.details.lastName}` : user.employeeId
        const emailSent = await sendPasswordResetEmail(user.email, name, resetToken)
        
        // Audit log
        await createAuditLog({
            userId: user.id,
            action: AuditActions.PASSWORD_RESET_REQUESTED,
            resource: AuditResources.AUTHENTICATION,
            resourceId: user.id.toString(),
            details: `Password reset requested for email: ${email}`,
            request
        })
        
        return NextResponse.json(
            { message: "If the email exists, a reset link has been sent" },
            { status: 200 }
        )
        
    } catch (error) {
        console.error("Password reset request error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
