import type { H3Event } from 'h3'

const COOKIE_NAME = 'zyyv_admin_session'
const SESSION_DURATION = 60 * 60 * 24 * 7

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function stringToBase64Url(value: string) {
  return bytesToBase64Url(new TextEncoder().encode(value))
}

function base64UrlToString(value: string) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)))
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return bytesToBase64Url(
    new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))),
  )
}

async function constantTimeEqual(left: string, right: string) {
  const leftHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(left))
  const rightHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(right))
  const a = new Uint8Array(leftHash)
  const b = new Uint8Array(rightHash)
  let difference = 0
  for (let index = 0; index < a.length; index++) difference |= a[index]! ^ b[index]!
  return difference === 0
}

function getAuthConfig(event: H3Event) {
  const config = useRuntimeConfig(event)
  const cloudflareEnv = event.context.cloudflare?.env
  const adminPassword = String(
    cloudflareEnv?.NUXT_ADMIN_PASSWORD ||
      config.adminPassword ||
      process.env.NUXT_ADMIN_PASSWORD ||
      '',
  ).trim()
  const sessionSecret = String(
    cloudflareEnv?.NUXT_SESSION_SECRET ||
      config.sessionSecret ||
      process.env.NUXT_SESSION_SECRET ||
      '',
  ).trim()

  if (!adminPassword || !sessionSecret || sessionSecret.length < 32) {
    throw createError({
      statusCode: 503,
      statusMessage: 'NUXT_ADMIN_PASSWORD and a 32+ character NUXT_SESSION_SECRET are required',
    })
  }

  return { adminPassword, sessionSecret }
}

export async function createAdminSession(event: H3Event, password: string) {
  const { adminPassword, sessionSecret } = getAuthConfig(event)
  if (!(await constantTimeEqual(password, adminPassword))) {
    throw createError({ statusCode: 401, statusMessage: '密码不正确' })
  }

  const payload = stringToBase64Url(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_DURATION }),
  )
  const token = `${payload}.${await sign(payload, sessionSecret)}`

  setCookie(event, COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: !import.meta.dev,
    path: '/',
    maxAge: SESSION_DURATION,
  })
}

export function clearAdminSession(event: H3Event) {
  deleteCookie(event, COOKIE_NAME, { path: '/' })
}

export async function isAdmin(event: H3Event) {
  const token = getCookie(event, COOKIE_NAME)
  if (!token) return false

  try {
    const { sessionSecret } = getAuthConfig(event)
    const [payload, signature] = token.split('.')
    if (!payload || !signature) return false
    if (!(await constantTimeEqual(signature, await sign(payload, sessionSecret)))) return false
    const parsed = JSON.parse(base64UrlToString(payload)) as { exp?: number }
    return typeof parsed.exp === 'number' && parsed.exp > Date.now() / 1000
  } catch {
    return false
  }
}

export async function requireAdmin(event: H3Event) {
  if (!(await isAdmin(event))) {
    throw createError({ statusCode: 401, statusMessage: '请先登录管理后台' })
  }
}
