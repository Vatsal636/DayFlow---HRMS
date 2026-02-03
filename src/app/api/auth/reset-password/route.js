import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { hashToken, isTokenExpired, validatePasswordStrength } from "@/lib/security"
import { createAuditLog, AuditActions, AuditResources } from "@/lib/audit"

export async function POST(request) {
    try {
        const { token, newPassword } = await request.json()
        
        if (!token || !newPassword) {
            return NextResponse.json(
                { error: "Token and new password are required" },
                { status: 400 }
            )
        }
        
        // Validate password strength
        const passwordValidation = validatePasswordStrength(newPassword)
        if (!passwordValidation.isValid) {
            return NextResponse.json(
                { error: "Password does not meet security requirements", details: passwordValidation.errors },
                { status: 400 }
            )
        }
        
        // Hash the token to match database
        const hashedToken = hashToken(token)
        
        // Find user with this reset token
        const user = await prisma.user.findFirst({
            where: {
                passwordResetToken: hashedToken
            },
            include: {
                details: true
            }
        })
        
        if (!user) {
            return NextResponse.json(
                { error: "Invalid or expired reset token" },
                { status: 400 }
            )
        }
        
        // Check if token is expired
        if (isTokenExpired(user.passwordResetExpiry)) {
            // Clear expired token
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordResetToken: null,
                    passwordResetExpiry: null
                }
            })
            
            return NextResponse.json(
                { error: "Reset token has expired. Please request a new one" },
                { status: 400 }
            )
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        
        // Update password and clear reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpiry: null,
                firstLogin: false,
                failedLoginAttempts: 0,
                accountLockedUntil: null
            }
        })
        
        // Audit log
        await createAuditLog({
            userId: user.id,
            action: AuditActions.PASSWORD_RESET_COMPLETED,
            resource: AuditResources.AUTHENTICATION,
            resourceId: user.id.toString(),
            details: "Password successfully reset",
            request
        })
        
        return NextResponse.json(
            { message: "Password reset successful. You can now login with your new password" },
            { status: 200 }
        )
        
    } catch (error) {
        console.error("Password reset error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
