"use client";

import { useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { ImagePlus, Trash2, GripHorizontal } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface CloudinaryUploadProps {
  value: string[];
  onChange: (value: string[]) => void;
  onRemove: (value: string) => void;
  maxFiles?: number;
}

export function CloudinaryUpload({
  value,
  onChange,
  onRemove,
  maxFiles = 5,
}: CloudinaryUploadProps) {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const onUpload = (result: any) => {
    onChange([...value, result.info.secure_url]);
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

      {value.length < maxFiles && (
        <CldUploadWidget
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
          onSuccess={onUpload}
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
      )}
    </div>
  );
}
