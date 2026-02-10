import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signToken, generateCSRFToken } from '@/lib/auth'
import { isAccountLocked, calculateLockoutDuration, checkRateLimit, getClientIP } from '@/lib/security'
import { createAuditLog, AuditActions, AuditResources } from '@/lib/audit'

export async function POST(request) {
    try {
        const { loginId, password } = await request.json()
        
        // Rate limiting - 5 login attempts per minute per IP
        const clientIP = getClientIP(request)
        const rateLimit = checkRateLimit(`login-${clientIP}`, 10, 60 * 1000)
        
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: `Too many login attempts. Try again in ${rateLimit.resetIn} seconds` }, 
                { status: 429 }
            )
        }

        // LoginID can be email OR employeeId
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: loginId },
                    { employeeId: loginId }
                ]
            },
            include: {
                details: true
            }
        })

        if (!user) {
            // Audit log for failed attempt
            await createAuditLog({
                userId: null,
                action: AuditActions.LOGIN_FAILED,
                resource: AuditResources.AUTHENTICATION,
                resourceId: null,
                details: `Failed login attempt for: ${loginId}`,
                request
            })
            
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        if (!user.isActive) {
            await createAuditLog({
                userId: user.id,
                action: AuditActions.LOGIN_FAILED,
                resource: AuditResources.AUTHENTICATION,
                resourceId: user.id.toString(),
                details: 'Login attempt on inactive account',
                request
            })
            
            return NextResponse.json({ error: 'Account is inactive. Please contact HR' }, { status: 403 })
        }
        
        // Check if email is verified
        if (!user.emailVerified) {
            await createAuditLog({
                userId: user.id,
                action: AuditActions.LOGIN_FAILED,
                resource: AuditResources.AUTHENTICATION,
                resourceId: user.id.toString(),
                details: 'Login attempt with unverified email',
                request
            })
            
            return NextResponse.json({ 
                error: 'Email not verified', 
                code: 'EMAIL_NOT_VERIFIED',
                email: user.email 
            }, { status: 403 })
        }
        
        // Check if account is locked
        if (isAccountLocked(user)) {
            const lockExpiry = new Date(user.accountLockedUntil)
            const minutesRemaining = Math.ceil((lockExpiry - new Date()) / 60000)
            
            await createAuditLog({
                userId: user.id,
                action: AuditActions.LOGIN_FAILED,
                resource: AuditResources.AUTHENTICATION,
                resourceId: user.id.toString(),
                details: 'Login attempt on locked account',
                request
            })
            
            return NextResponse.json(
                { error: `Account is locked. Try again in ${minutesRemaining} minutes` }, 
                { status: 403 }
            )
        }

        const isValid = await bcrypt.compare(password, user.password)
        
        if (!isValid) {
            // Increment failed login attempts
            const newFailedAttempts = user.failedLoginAttempts + 1
            const lockoutMinutes = calculateLockoutDuration(newFailedAttempts)
            
            const updateData = {
                failedLoginAttempts: newFailedAttempts
            }
            
            if (lockoutMinutes > 0) {
                updateData.accountLockedUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000)
            }
            
            await prisma.user.update({
                where: { id: user.id },
                data: updateData
            })
            
            await createAuditLog({
                userId: user.id,
                action: AuditActions.LOGIN_FAILED,
                resource: AuditResources.AUTHENTICATION,
                resourceId: user.id.toString(),
                details: `Invalid password. Failed attempts: ${newFailedAttempts}`,
                request
            })
            
            if (lockoutMinutes > 0) {
                await createAuditLog({
                    userId: user.id,
                    action: AuditActions.ACCOUNT_LOCKED,
                    resource: AuditResources.AUTHENTICATION,
                    resourceId: user.id.toString(),
                    details: `Account locked for ${lockoutMinutes} minutes after ${newFailedAttempts} failed attempts`,
                    request
                })
                
                return NextResponse.json(
                    { error: `Account locked for ${lockoutMinutes} minutes due to multiple failed attempts` }, 
                    { status: 403 }
                )
            }
            
            const remainingAttempts = 5 - newFailedAttempts
            return NextResponse.json(
                { error: `Invalid credentials. ${remainingAttempts} attempts remaining before lockout` }, 
                { status: 401 }
            )
        }
        
        // Successful login - reset failed attempts and update last login
        await prisma.user.update({
            where: { id: user.id },
            data: {
                failedLoginAttempts: 0,
                accountLockedUntil: null,
                lastLoginAt: new Date()
            }
        })

        // Generate JWT
        const token = await signToken({
            id: user.id,
            role: user.role,
            firstLogin: user.firstLogin
        })
        
        // Generate CSRF token
        const csrfToken = generateCSRFToken(user.id.toString())
        
        // Audit log
        await createAuditLog({
            userId: user.id,
            action: AuditActions.LOGIN_SUCCESS,
            resource: AuditResources.AUTHENTICATION,
            resourceId: user.id.toString(),
            details: `Successful login`,
            request
        })

        const response = NextResponse.json({
            success: true,
            csrfToken, // Include CSRF token in response
            user: {
                id: user.id,
                role: user.role,
                firstLogin: user.firstLogin,
                emailVerified: user.emailVerified,
                name: user.details?.firstName || 'User'
            }
        })

        // Set HTTP-only cookie
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        })

        // Set CSRF token as a cookie (double-submit pattern)
        response.cookies.set('csrf-token', csrfToken, {
            httpOnly: false, // Must be readable by JS
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        })

        return response

    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
