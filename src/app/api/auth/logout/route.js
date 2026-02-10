import { NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { createAuditLog, AuditActions, AuditResources } from "@/lib/audit"

export async function POST(request) {
    try {
        const token = request.cookies.get('token')?.value
        
        if (token) {
            const payload = await verifyToken(token)
            
            if (payload) {
                // Audit log
                await createAuditLog({
                    userId: payload.id,
                    action: AuditActions.LOGOUT,
                    resource: AuditResources.AUTHENTICATION,
                    resourceId: payload.id.toString(),
                    details: "User logged out",
                    request
                })
            }
        }
        
        const response = NextResponse.json(
            { message: "Logged out successfully" },
            { status: 200 }
        )
        
        // Clear the token cookie
        response.cookies.set('token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 0,
            path: '/',
        })
        
        // Clear the CSRF cookie
        response.cookies.set('csrf-token', '', {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 0,
            path: '/',
        })
        
        return response
        
    } catch (error) {
        console.error("Logout error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
