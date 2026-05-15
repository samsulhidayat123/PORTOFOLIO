import { NextRequest } from 'next/server';

const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const textEncoder = new TextEncoder();

type AdminTokenPayload = {
  sub: 'admin';
  exp: number;
};

function getAdminAuthSecret() {
  return (process.env.ADMIN_AUTH_SECRET || process.env.ADMIN_PASSWORD || '').trim();
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function stringToBase64Url(value: string) {
  return bytesToBase64Url(textEncoder.encode(value));
}

function base64UrlToString(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(value));

  return bytesToBase64Url(new Uint8Array(signature));
}

function signaturesMatch(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return diff === 0;
}

export async function createAdminToken() {
  const secret = getAdminAuthSecret();

  if (!secret) {
    throw new Error('Admin auth secret is not configured');
  }

  const payload: AdminTokenPayload = {
    sub: 'admin',
    exp: Math.floor(Date.now() / 1000) + TOKEN_MAX_AGE_SECONDS,
  };
  const encodedPayload = stringToBase64Url(JSON.stringify(payload));
  const signature = await sign(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export async function verifyAdminToken(token?: string) {
  const secret = getAdminAuthSecret();

  if (!secret || !token) {
    return false;
  }

  const [encodedPayload, signature, extra] = token.split('.');
  if (!encodedPayload || !signature || extra) {
    return false;
  }

  const expectedSignature = await sign(encodedPayload, secret);
  if (!signaturesMatch(signature, expectedSignature)) {
    return false;
  }

  try {
    const payload = JSON.parse(base64UrlToString(encodedPayload)) as Partial<AdminTokenPayload>;

    return payload.sub === 'admin'
      && typeof payload.exp === 'number'
      && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function verifyAdminRequest(request: NextRequest) {
  return verifyAdminToken(request.cookies.get('admin-token')?.value);
}

export const adminCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: TOKEN_MAX_AGE_SECONDS,
};
