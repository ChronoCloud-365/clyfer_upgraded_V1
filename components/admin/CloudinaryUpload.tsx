"use client";

import { useState } from "react";
import { CldUploadWidget, type CloudinaryUploadWidgetResults } from "next-cloudinary";
import { ImagePlus, Trash2, GripHorizontal } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface CloudinaryUploadProps {
  value: string[];
  onChange: (value: string[]) => void;
  onAddImage: (url: string) => void;
  onRemove: (value: string) => void;
  maxFiles?: number;
}

export function CloudinaryUpload({
  value,
  onChange,
  onAddImage,
  onRemove,
  maxFiles = 5,
}: CloudinaryUploadProps) {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState("");

  const onUpload = (result: CloudinaryUploadWidgetResults) => {
    const url =
      typeof result.info === "object" && result.info && "secure_url" in result.info
        ? result.info.secure_url
        : undefined;
    if (url) onAddImage(url);
  };

  const handleDragStart = (idx: number) => setDraggedIdx(idx);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (idx: number) => {
    if (draggedIdx === null) return;
    const newArr = [...value];
    const item = newArr.splice(draggedIdx, 1)[0];
    newArr.splice(idx, 0, item);
    onChange(newArr);
    setDraggedIdx(null);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-4">
        {value.map((url, idx) => (
          <div
            key={url}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(idx)}
            className={cn(
              "relative w-[150px] h-[150px] rounded-xl overflow-hidden border-2 group cursor-grab active:cursor-grabbing",
              idx === 0 ? "border-brand" : "border-border",
              draggedIdx === idx && "opacity-50"
            )}
          >
            <Image
              fill
              unoptimized
              src={url}
              alt="Uploaded Image"
              className="object-cover"
            />
            {/* Thumbnail Badge */}
            {idx === 0 && (
              <div className="absolute top-2 left-2 bg-brand text-brand-foreground text-[10px] font-bold px-2 py-1 rounded-md z-10 shadow-sm">
                Thumbnail
              </div>
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <GripHorizontal className="text-white/70 size-6" />
              <button
                type="button"
                onClick={() => onRemove(url)}
                className="bg-destructive text-white p-2 rounded-lg hover:bg-destructive/90 transition"
                title="Remove image"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {value.length < maxFiles && (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? (
        <CldUploadWidget
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
          onSuccess={(result) => onUpload(result)}
          options={{ multiple: true }}
        >
          {({ open }) => {
            const onClick = (e: React.MouseEvent) => {
              e.preventDefault();
              open();
            };

            return (
              <button
                type="button"
                onClick={onClick}
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground"
              >
                <ImagePlus className="size-8 mb-2 opacity-50" />
                <span className="text-sm font-medium">Click to upload image(s)</span>
                <span className="text-xs mt-1 text-muted-foreground">Drag to reorder after uploading</span>
              </button>
            );
          }}
        </CldUploadWidget>
      ) : <div className="space-y-2"><label className="block text-sm font-medium" htmlFor="manual-product-image">Image URL</label><div className="flex gap-2"><input id="manual-product-image" type="url" value={imageUrl} placeholder="https://…" onChange={(e) => setImageUrl(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" /><button type="button" className="rounded-lg border border-border px-3 py-2 text-sm" onClick={() => {
        try { const url = new URL(imageUrl.trim()); if (!["http:", "https:"].includes(url.protocol)) throw new Error(); onAddImage(url.href); setImageUrl(""); setImageError(""); }
        catch { setImageError("Enter a valid HTTP or HTTPS image URL."); }
      }}>Add image</button></div>{imageError && <p role="alert" className="text-xs text-red-500">{imageError}</p>}</div>)}
    </div>
  );
}
