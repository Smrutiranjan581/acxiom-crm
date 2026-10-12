import { NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth'
import { auditLogsRepo, usersRepo } from '@/lib/db/repo'
import type { User } from '@/types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^\+?[0-9\s-]{10,15}$/
const PASSWORD_POLICY_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

export async function POST(req: Request) {
  try {
    const { name, email, phone, password } = await req.json()

    // Validation
    if (!name || name.trim().length < 3) {
      return NextResponse.json({ message: 'Full name must be at least 3 characters' }, { status: 400 })
    }

    if (!email || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json({ message: 'Enter a valid work email address' }, { status: 400 })
    }

    if (!phone || !PHONE_RE.test(phone.trim())) {
      return NextResponse.json({ message: 'Enter a valid phone number (10–15 digits)' }, { status: 400 })
    }

    if (!password || !PASSWORD_POLICY_RE.test(password)) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters with upper, lower, number and special character' },
        { status: 400 }
      )
    }

    const cleanEmail = email.trim().toLowerCase()
    const existing = await usersRepo.findByEmail(cleanEmail)
    if (existing) {
      return NextResponse.json({ message: 'An account with this email already exists' }, { status: 409 })
    }

    // Hash password
    const passwordHash = await hashPassword(password)
    const newUser: User = {
      id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      role: 'SalesExecutive',
      active: true,
      lockedOut: false,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    }

    await usersRepo.create(newUser, passwordHash)

    // Audit log
    await auditLogsRepo.create({
      userId: newUser.id,
      action: 'Create',
      entity: 'User',
      recordId: newUser.id,
      newValue: `New user registered: ${newUser.name} (${newUser.email})`,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    })

    return NextResponse.json({
      message: 'Account created successfully',
      user: newUser,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 })
  }
}
