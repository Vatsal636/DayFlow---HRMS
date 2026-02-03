import crypto from 'crypto'

// Generate secure random token
export function generateSecureToken() {
    return crypto.randomBytes(32).toString('hex')
}

// Generate 6-digit OTP for 2FA
export function generate2FACode() {
    return crypto.randomInt(100000, 999999).toString()
}

// Hash token for database storage
export function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex')
}

// Check if account is locked
export function isAccountLocked(user) {
    if (!user.accountLockedUntil) return false
    return new Date() < new Date(user.accountLockedUntil)
}

// Calculate lockout duration based on failed attempts
export function calculateLockoutDuration(attempts) {
    if (attempts < 5) return 0 // No lockout
    if (attempts < 10) return 15 // 15 minutes
    if (attempts < 20) return 60 // 1 hour
    return 1440 // 24 hours
}

// Check if token is expired
export function isTokenExpired(expiryDate) {
    if (!expiryDate) return true
    return new Date() > new Date(expiryDate)
}

// Get IP address from request
export function getClientIP(request) {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    
    if (forwarded) {
        return forwarded.split(',')[0].trim()
    }
    if (realIp) {
        return realIp
    }
    return 'unknown'
}

// Get user agent from request
export function getUserAgent(request) {
    return request.headers.get('user-agent') || 'unknown'
}

// Validate password strength
export function validatePasswordStrength(password) {
    const errors = []
    
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long')
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter')
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter')
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number')
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character')
    }
    
    return {
        isValid: errors.length === 0,
        errors
    }
}

// Sanitize user input to prevent XSS
export function sanitizeInput(input) {
    if (typeof input !== 'string') return input
    
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
}

// Rate limiting helper
const rateLimitStore = new Map()

export function checkRateLimit(identifier, maxRequests = 5, windowMs = 60000) {
    const now = Date.now()
    const key = identifier
    
    if (!rateLimitStore.has(key)) {
        rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
        return { allowed: true, remaining: maxRequests - 1 }
    }
    
    const record = rateLimitStore.get(key)
    
    if (now > record.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
        return { allowed: true, remaining: maxRequests - 1 }
    }
    
    if (record.count >= maxRequests) {
        return { 
            allowed: false, 
            remaining: 0,
            resetIn: Math.ceil((record.resetTime - now) / 1000)
        }
    }
    
    record.count++
    return { allowed: true, remaining: maxRequests - record.count }
}

// Clean up old rate limit records periodically
setInterval(() => {
    const now = Date.now()
    for (const [key, record] of rateLimitStore.entries()) {
        if (now > record.resetTime) {
            rateLimitStore.delete(key)
        }
    }
}, 300000) // Clean up every 5 minutes
