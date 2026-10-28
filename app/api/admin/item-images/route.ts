import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { requireAdminSession } from "@/lib/admin-auth";
import { compressItemImage, MAX_IMAGE_BYTES } from "@/lib/inventory/images";
import { InventoryError } from "@/lib/inventory/errors";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const denied = requireAdminSession(request); if (denied) return denied;
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  if (Number(request.headers.get("content-length")) > MAX_IMAGE_BYTES * 5 + 65536) return NextResponse.json({ error: "Upload at most five images, each no more than 1 MB." }, { status: 413 });
  try {
    const form = await request.formData();
    const files = form.getAll("images");
    if (!files.length || files.length > 5 || files.some((file) => !(file instanceof File) || file.size > MAX_IMAGE_BYTES)) throw new InventoryError("Upload at most five images, each no more than 1 MB.", 413);
    const processed = await Promise.all((files as File[]).map(async (file) => compressItemImage(new Uint8Array(await file.arrayBuffer()))));
    const directory = resolve(/* turbopackIgnore: true */ process.env.INVENTORY_MEDIA_PATH || ".data/item-images");
    await mkdir(directory, { recursive: true });
    const images = [];
    for (const bytes of processed) { const filename = `${randomUUID()}.webp`; await writeFile(join(directory, filename), bytes); images.push(`/api/item-images/${filename}`); }
    return NextResponse.json({ images });
  } catch (error) { return NextResponse.json({ error: error instanceof InventoryError ? error.message : "Could not upload images." }, { status: error instanceof InventoryError ? error.status : 400 }); }
}
