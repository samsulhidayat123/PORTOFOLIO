// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminCookieOptions, createAdminToken } from '@/lib/adminAuth';
import { getClientIp, rateLimit } from '@/lib/rateLimit';

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD?.trim();

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  const limiter = rateLimit(`login:${clientIp}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);

  if (limiter.limited) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(limiter.retryAfter) },
      },
    );
  }

  if (!ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: 'Admin password is not configured' },
      { status: 500 },
    );
  }

  try {
    const { password } = await request.json();

    if (typeof password === 'string' && password === ADMIN_PASSWORD) {
      const token = await createAdminToken();
      const response = NextResponse.json({ success: true });
      response.cookies.set('admin-token', token, adminCookieOptions);
      return response;
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
