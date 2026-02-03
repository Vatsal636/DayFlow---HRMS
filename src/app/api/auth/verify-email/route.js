import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hashToken, isTokenExpired } from "@/lib/security"
import { createAuditLog, AuditActions, AuditResources } from "@/lib/audit"

export async function POST(request) {
    try {
        const { token } = await request.json()
        
        if (!token) {
            return NextResponse.json(
                { error: "Verification token is required" },
                { status: 400 }
            )
        }
        
        // Hash the token to match database
        const hashedToken = hashToken(token)
        
        // Find user with this verification token
        const user = await prisma.user.findFirst({
            where: {
                emailVerificationToken: hashedToken
            }
        })
        
        if (!user) {
            return NextResponse.json(
                { error: "Invalid verification token" },
                { status: 400 }
            )
        }
        
        // Check if already verified
        if (user.emailVerified) {
            return NextResponse.json(
                { message: "Email already verified. You can login now" },
                { status: 200 }
            )
        }
        
        // Check if token is expired
        if (isTokenExpired(user.emailVerificationExpiry)) {
            return NextResponse.json(
                { error: "Verification token has expired. Please request a new one" },
                { status: 400 }
            )
        }
        
        // Mark email as verified
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                emailVerificationToken: null,
                emailVerificationExpiry: null
            }
        })
        
        // Audit log
        await createAuditLog({
            userId: user.id,
            action: AuditActions.EMAIL_VERIFIED,
            resource: AuditResources.AUTHENTICATION,
            resourceId: user.id.toString(),
            details: `Email verified: ${user.email}`,
            request
        })
        
        return NextResponse.json(
            { message: "Email verified successfully! You can now login" },
            { status: 200 }
        )
        
    } catch (error) {
        console.error("Email verification error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
