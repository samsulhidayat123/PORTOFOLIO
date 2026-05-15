// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { adminCookieOptions } from '@/lib/adminAuth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('admin-token', '', {
    ...adminCookieOptions,
    maxAge: 0,
  });

  return response;
}
