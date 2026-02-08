import { timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import type { Session } from 'next-auth'
import { auth } from '@/lib/auth'

type SecretMatchOptions = {
  allowQuerySecret?: boolean
}

type AdminAccessOptions = {
  secrets?: Array<string | undefined>
  allowQuerySecret?: boolean
}

function parseCsvEnv(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}

function normalizeSecrets(secrets: Array<string | undefined>): string[] {
  return secrets.map((secret) => (secret || '').trim()).filter(Boolean)
}

function safeEquals(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)
  if (aBuffer.length !== bBuffer.length) return false
  return timingSafeEqual(aBuffer, bBuffer)
}

function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return null

  const [scheme, value] = authHeader.split(' ')
  if (!scheme || !value || scheme.toLowerCase() !== 'bearer') return null
  return value
}

function getCandidateSecrets(
  request: Request,
  options: SecretMatchOptions = {}
): string[] {
  const candidates: string[] = []
  const bearerToken = getBearerToken(request)
  if (bearerToken) candidates.push(bearerToken)

  const headerSecret = request.headers.get('x-cron-secret')
  if (headerSecret) candidates.push(headerSecret)

  const internalSecret = request.headers.get('x-internal-secret')
  if (internalSecret) candidates.push(internalSecret)

  if (options.allowQuerySecret) {
    const url = new URL(request.url)
    const querySecret = url.searchParams.get('secret') || url.searchParams.get('token')
    if (querySecret) candidates.push(querySecret)
  }

  return candidates
}

function hasAdminSession(session: Session): boolean {
  const adminEmails = parseCsvEnv(process.env.ADMIN_EMAILS)
  const adminUserIds = parseCsvEnv(process.env.ADMIN_USER_IDS)

  const sessionEmail = session.user?.email?.toLowerCase().trim() || ''
  const rawId = (session.user as any)?.id
  const sessionUserId = (rawId ? String(rawId) : '').toLowerCase().trim()

  const matchedByEmail = sessionEmail ? adminEmails.includes(sessionEmail) : false
  const matchedById = sessionUserId ? adminUserIds.includes(sessionUserId) : false

  if (matchedByEmail || matchedById) {
    return true
  }

  // Keep local development usable without forcing env setup.
  if (process.env.NODE_ENV === 'development' && adminEmails.length === 0 && adminUserIds.length === 0) {
    return true
  }

  return false
}

export function requestMatchesAnySecret(
  request: Request,
  secrets: Array<string | undefined>,
  options: SecretMatchOptions = {}
): boolean {
  const expectedSecrets = normalizeSecrets(secrets)
  if (expectedSecrets.length === 0) return false

  const candidates = getCandidateSecrets(request, options)
  for (const expected of expectedSecrets) {
    for (const candidate of candidates) {
      if (safeEquals(expected, candidate)) {
        return true
      }
    }
  }

  return false
}

export async function requireAuthenticatedSession(): Promise<{
  session?: Session
  response?: NextResponse
}> {
  const session = await auth()
  if (!session) {
    return {
      response: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    }
  }

  return { session }
}

export async function requireAdminAccess(
  request: Request,
  options: AdminAccessOptions = {}
): Promise<{ session?: Session; response?: NextResponse }> {
  const defaultSecrets = [process.env.INTERNAL_API_SECRET]
  const secretSources = [...defaultSecrets, ...(options.secrets || [])]

  if (requestMatchesAnySecret(request, secretSources, { allowQuerySecret: options.allowQuerySecret })) {
    return {}
  }

  const session = await auth()
  if (!session) {
    return {
      response: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    }
  }

  if (!hasAdminSession(session)) {
    return {
      response: NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      ),
    }
  }

  return { session }
}
