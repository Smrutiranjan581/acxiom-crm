import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { usersRepo } from '@/lib/db/repo'

export async function GET(req: Request) {
  const session = await getSessionUser(req)
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const user = await usersRepo.findById(session.id)
  if (!user || !user.active) {
    return NextResponse.json({ message: 'User not found or deactivated' }, { status: 401 })
  }

  return NextResponse.json({ user })
}
