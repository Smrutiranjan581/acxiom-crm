import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { Role, User } from '@/types'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'acxiomcrm-secure-jwt-secret-key-32-chars-long-prod-2025'
)

export const AUTH_COOKIE_NAME = 'acxiomcrm_session'

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Session Token
export async function createSessionToken(user: { id: string; email: string; role: Role; name: string }) {
  return new SignJWT({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { id: string; email: string; role: Role; name: string }
  } catch {
    return null
  }
}

// Get authenticated user from request cookies or Authorization header
export async function getSessionUser(req?: Request): Promise<{ id: string; email: string; role: Role; name: string } | null> {
  // Check Authorization header first
  if (req) {
    const authHeader = req.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const user = await verifySessionToken(token)
      if (user) return user
    }
  }

  // Check cookie
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME)?.value
    if (sessionCookie) {
      return await verifySessionToken(sessionCookie)
    }
  } catch {
    // Next.js static or external context
  }

  return null
}
