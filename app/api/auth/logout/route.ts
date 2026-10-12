import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME, getSessionUser } from '@/lib/auth'
import { auditLogsRepo } from '@/lib/db/repo'

export async function POST(req: Request) {
  const sessionUser = await getSessionUser(req)

  if (sessionUser) {
    await auditLogsRepo.create({
      userId: sessionUser.id,
      action: 'Logout',
      entity: 'Session',
      recordId: sessionUser.id,
      newValue: 'User logged out',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
    })
  }

  const response = NextResponse.json({ message: 'Logged out successfully' })
  response.cookies.delete(AUTH_COOKIE_NAME)
  return response
}
