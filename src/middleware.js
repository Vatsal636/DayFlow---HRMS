import { NextResponse } from 'next/server'
import { verifyToken } from './lib/auth'

const protectedRoutes = ['/dashboard', '/admin', '/profile']
const adminRoutes = ['/admin', '/api/admin']

export async function middleware(request) {
    const path = request.nextUrl.pathname
    const isProtected = protectedRoutes.some(route => path.startsWith(route))

    if (!isProtected) {
        return NextResponse.next()
    }

    const token = request.cookies.get('token')?.value

    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    const payload = await verifyToken(token)

    if (!payload) {
        // Invalid token
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check for First Login enforcement
    // We must allow the setup page itself content updates to API
    const isSetupPage = path === '/auth/setup'
    const isApiParams = path.startsWith('/api')

    if (payload.firstLogin && !isSetupPage && !isApiParams) {
        return NextResponse.redirect(new URL('/auth/setup', request.url))
    }

    // Admin Check
    if (path.startsWith('/admin') && payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url)) // Redirect generic dashboard
    }

    // Force Password Change Check if strictly required
    // if (payload.firstLogin && path !== '/change-password') {
    //   return NextResponse.redirect(new URL('/change-password', request.url))
    // }

    const response = NextResponse.next()

    // Inject user info into headers for convenient access in Server Components (optional)
    response.headers.set('x-user-id', payload.id)
    response.headers.set('x-user-role', payload.role)

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/auth (auth routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public (public files)
         */
        '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
    ],
}
