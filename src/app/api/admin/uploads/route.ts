import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

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

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = extension.replace(/[^a-z0-9]/g, '') || 'jpg';
    const fileName = `${Date.now()}-${randomUUID()}.${safeExt}`;

    const folderField = formData.get('folder');
    const subFolder =
      folderField === 'properties' ? path.join('uploads', 'properties') : path.join('uploads', 'page-backgrounds');
    const relativeDir = subFolder;
    const absoluteDir = path.join(process.cwd(), 'public', relativeDir);
    await mkdir(absoluteDir, { recursive: true });

    const absolutePath = path.join(absoluteDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, buffer);

    return NextResponse.json({
      ok: true,
      url: `/${relativeDir}/${fileName}`,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
