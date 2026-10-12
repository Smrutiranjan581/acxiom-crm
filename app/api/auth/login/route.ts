import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, comparePassword, createSessionToken } from '@/lib/auth'
import { auditLogsRepo, usersRepo } from '@/lib/db/repo'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const user = await usersRepo.findByEmail(cleanEmail)

    if (!user) {
      await auditLogsRepo.create({
        userId: 'anonymous',
        action: 'Failed Login',
        entity: 'Session',
        newValue: `Failed login attempt for ${cleanEmail} (user not found)`,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      })
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 })
    }

    // Check account lockout
    if (user.lockedOut) {
      await auditLogsRepo.create({
        userId: user.id,
        action: 'Failed Login',
        entity: 'Session',
        newValue: `Login attempt on locked account ${cleanEmail}`,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      })
      return NextResponse.json(
        { message: 'This account is locked after repeated failed login attempts. Please contact your administrator.' },
        { status: 423 }
      )
    }

    // Check account active
    if (!user.active) {
      return NextResponse.json(
        { message: 'This account has been deactivated. Contact your administrator.' },
        { status: 403 }
      )
    }

    // Compare password
    const valid = await comparePassword(password, user.passwordHash)
    if (!valid) {
      const { failedCount, lockedOut } = await usersRepo.recordFailedLogin(user.id)
      await auditLogsRepo.create({
        userId: user.id,
        action: 'Failed Login',
        entity: 'Session',
        newValue: `Invalid password attempt #${failedCount} for ${cleanEmail}`,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      })

      if (lockedOut) {
        return NextResponse.json(
          { message: 'Too many failed login attempts. Your account has been temporarily locked for 15 minutes.' },
          { status: 423 }
        )
      }

      return NextResponse.json(
        { message: `Invalid email or password. Attempt ${failedCount} of 5 before lockout.` },
        { status: 401 }
      )
    }

    // Password is valid - reset lockout and failed count
    await usersRepo.resetFailedLogin(user.id)

    // Audit log successful login
    await auditLogsRepo.create({
      userId: user.id,
      action: 'Login',
      entity: 'Session',
      recordId: user.id,
      newValue: 'Successful authentication',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    })

    // Create session token
    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    })

    const { passwordHash, failedLoginCount, lockoutUntil, ...safeUser } = user

    const response = NextResponse.json({
      user: safeUser,
      token,
      message: 'Login successful',
    })

    // Set cookie
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 })
  }
}
