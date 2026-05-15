// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { verifyAdminRequest } from '@/lib/adminAuth';
import { getClientIp, rateLimit } from '@/lib/rateLimit';

const UPLOAD_LIMIT = 20;
const UPLOAD_WINDOW_MS = 60 * 60 * 1000;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowedImageTypes: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

async function saveLocalImage(file: File, buffer: Buffer) {
  const extension = allowedImageTypes[file.type];
  const filename = `project-${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const uploadDir = path.join(process.cwd(), 'public', 'images');
  const uploadPath = path.join(uploadDir, filename);

  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(uploadPath, buffer);

  return `/images/${filename}`;
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  const limiter = rateLimit(`upload:${clientIp}`, UPLOAD_LIMIT, UPLOAD_WINDOW_MS);

  if (limiter.limited) {
    return NextResponse.json(
      { error: 'Too many upload attempts. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(limiter.retryAfter) },
      },
    );
  }

  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!allowedImageTypes[file.type]) {
      return NextResponse.json(
        { error: 'File must be a JPG, PNG, GIF, or WebP image' },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const imgbbApiKey = process.env.IMGBB_API_KEY?.trim();
    const allowLocalFallback = process.env.UPLOAD_STORAGE === 'local'
      || (process.env.NODE_ENV !== 'production' && !imgbbApiKey);

    if (!imgbbApiKey) {
      if (allowLocalFallback) {
        const path = await saveLocalImage(file, buffer);

        return NextResponse.json({
          success: true,
          path,
          filename: file.name,
          storage: 'local',
        });
      }

      return NextResponse.json(
        { error: 'Image storage is not configured. Set IMGBB_API_KEY or UPLOAD_STORAGE=local.' },
        { status: 500 },
      );
    }

    const formDataToSend = new FormData();
    formDataToSend.append('image', buffer.toString('base64'));

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
      method: 'POST',
      body: formDataToSend,
    });

    const data = await response.json().catch(() => null);

    if (response.ok && data?.success && typeof data.data?.url === 'string') {
      return NextResponse.json({ 
        success: true, 
        path: data.data.url,
        filename: file.name,
        storage: 'imgbb',
      });
    }

    if (allowLocalFallback) {
      const path = await saveLocalImage(file, buffer);

      return NextResponse.json({
        success: true,
        path,
        filename: file.name,
        storage: 'local',
        warning: data?.error?.message || 'ImgBB upload failed; saved locally instead.',
      });
    }

    return NextResponse.json(
      { error: data?.error?.message || 'ImgBB upload failed and no fallback storage is configured' },
      { status: 502 },
    );
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
