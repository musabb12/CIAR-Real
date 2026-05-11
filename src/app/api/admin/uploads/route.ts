import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { uploadBufferToFirebaseStorage } from '@/lib/firebase-storage';

const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: 'Unsupported image type' }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Image is too large (max 8MB)' }, { status: 400 });
    }

    const folderField = formData.get('folder');
    const buffer = Buffer.from(await file.arrayBuffer());
    const subFolder =
      folderField === 'properties' ? 'uploads/properties' : 'uploads/page-backgrounds';
    const uploaded = await uploadBufferToFirebaseStorage({
      folder: subFolder,
      fileName: `${Date.now()}-${randomUUID()}.${file.name.split('.').pop()?.toLowerCase() || 'jpg'}`,
      contentType: file.type,
      buffer,
    });

    return NextResponse.json({
      ok: true,
      url: uploaded.url,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
