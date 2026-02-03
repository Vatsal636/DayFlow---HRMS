import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { sendEmailVerificationEmail } from "@/lib/email"
import { generateSecureToken, hashToken, checkRateLimit, getClientIP } from "@/lib/security"

export async function POST(request) {
    try {
        const { email } = await request.json()
        
        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            )
        }
        
        // Rate limiting - 3 requests per 15 minutes
        const clientIP = getClientIP(request)
        const rateLimit = checkRateLimit(`verify-${clientIP}`, 3, 15 * 60 * 1000)
        
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: `Too many requests. Try again in ${rateLimit.resetIn} seconds` },
                { status: 429 }
            )
        }
        
        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            include: { details: true }
        })
        
        if (!user) {
            return NextResponse.json(
                { message: "If the email exists, a verification link has been sent" },
                { status: 200 }
            )
        }
        
        if (user.emailVerified) {
            return NextResponse.json(
                { message: "Email is already verified" },
                { status: 200 }
            )
        }
        
        // Generate new verification token
        const verificationToken = generateSecureToken()
        const hashedToken = hashToken(verificationToken)
        const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        
        // Update user with new token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerificationToken: hashedToken,
                emailVerificationExpiry: expiryDate
            }
        })
        
        // Send verification email
        const name = user.details ? `${user.details.firstName} ${user.details.lastName}` : user.employeeId
        await sendEmailVerificationEmail(user.email, name, verificationToken)
        
        return NextResponse.json(
            { message: "Verification email sent successfully" },
            { status: 200 }
        )
        
    } catch (error) {
        console.error("Resend verification error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
