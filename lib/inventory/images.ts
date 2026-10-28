import sharp from "sharp";
import { InventoryError } from "./errors";
export const MAX_IMAGE_BYTES = 1024 * 1024;
export async function compressItemImage(bytes: Uint8Array) {
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new InventoryError("Each image must be no more than 1 MB.");
  try {
    const image = sharp(bytes, { limitInputPixels: 25_000_000 });
    const metadata = await image.metadata();
    const supported = ["jpeg", "png", "webp", "avif"].includes(metadata.format ?? "") || (metadata.format === "heif" && metadata.compression === "av1");
    if (!supported || (metadata.pages ?? 1) > 1) throw new InventoryError("Upload a still JPG, PNG, WebP or AVIF image.");
    const output = await image.rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
    if (output.length > MAX_IMAGE_BYTES) throw new InventoryError("This image is too large after compression. Choose a smaller image.");
    return output;
  } catch (error) { if (error instanceof InventoryError) throw error; throw new InventoryError("This file is not a valid supported image."); }
}
