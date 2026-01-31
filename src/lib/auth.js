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
