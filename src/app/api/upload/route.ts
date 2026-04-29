// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const imgbbApiKey = process.env.IMGBB_API_KEY;
    if (!imgbbApiKey) {
      return NextResponse.json({ error: 'Server configuration error: ImgBB API key missing' }, { status: 500 });
    }

    // Konversi file ke base64 agar aman dikirim melalui API Next.js
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    const formDataToSend = new FormData();
    formDataToSend.append('image', base64Image);

    // Upload gambar ke ImgBB
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
      method: 'POST',
      body: formDataToSend,
    });

    const data = await response.json();

    if (data.success) {
      return NextResponse.json({ 
        success: true, 
        path: data.data.url, // URL gambar langsung dari ImgBB (misal: https://i.ibb.co/...)
        filename: file.name
      });
    } else {
      throw new Error(data.error?.message || 'Failed to upload to ImgBB');
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}