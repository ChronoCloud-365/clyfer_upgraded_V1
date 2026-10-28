import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import sharp from "sharp";
export const runtime = "nodejs";
export async function GET(request: NextRequest, context: { params: Promise<{ filename: string }> }) {
  const { filename } = await context.params;
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$/.test(filename)) return new NextResponse(null, { status: 404 });
  const width = Number(request.nextUrl.searchParams.get("w") || 1600);
  if (![160, 480, 960, 1600].includes(width)) return new NextResponse(null, { status: 400 });
  try {
    const directory = resolve(/* turbopackIgnore: true */ process.env.INVENTORY_MEDIA_PATH || ".data/item-images");
    const bytes = await readFile(/* turbopackIgnore: true */ join(directory, filename));
    const output = width === 1600 ? bytes : await sharp(bytes).resize({ width, withoutEnlargement: true }).webp({ quality: 75 }).toBuffer();
    return new NextResponse(new Uint8Array(output), { headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
  } catch { return new NextResponse(null, { status: 404 }); }
}
