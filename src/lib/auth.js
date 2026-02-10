import { SignJWT, jwtVerify } from 'jose'

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_key_change_me')

export async function signToken(payload) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h') // 1 day session
        .sign(secretKey)
}

export async function verifyToken(token) {
    try {
        const { payload } = await jwtVerify(token, secretKey)
        return payload
    } catch (err) {
        return null
    }
}

// CSRF Token Management
const csrfTokens = new Map()

export function generateCSRFToken(sessionId) {
    // Use Web Crypto API (Edge Runtime compatible)
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
    
    csrfTokens.set(sessionId, {
        token,
        createdAt: Date.now()
    })
    
    // Clean up old tokens (older than 24 hours)
    for (const [key, value] of csrfTokens.entries()) {
        if (Date.now() - value.createdAt > 24 * 60 * 60 * 1000) {
            csrfTokens.delete(key)
        }
    }
    
    return token
}

export function validateCSRFToken(sessionId, token) {
    const stored = csrfTokens.get(sessionId)
    if (!stored) return false
    if (stored.token !== token) return false
    if (Date.now() - stored.createdAt > 24 * 60 * 60 * 1000) {
        csrfTokens.delete(sessionId)
        return false
    }
    return true
}

export function clearCSRFToken(sessionId) {
    csrfTokens.delete(sessionId)
}
