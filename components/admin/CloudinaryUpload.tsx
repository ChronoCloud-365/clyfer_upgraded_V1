"use client";

import { CldUploadWidget } from "next-cloudinary";
import { ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";

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
  const onUpload = (result: any) => {
    onChange([...value, result.info.secure_url]);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-4">
        {value.map((url) => (
          <div
            key={url}
            className="relative w-[150px] h-[150px] rounded-xl overflow-hidden border border-border group"
          >
            <Image
              fill
              src={url}
              alt="Uploaded Image"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => onRemove(url)}
                className="bg-destructive text-white p-2 rounded-lg hover:bg-destructive/90 transition"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {value.length < maxFiles && (
        <CldUploadWidget
          uploadPreset="clyfer_preset" // Assumes you have an unsigned upload preset named 'clyfer_preset' in Cloudinary.
          onSuccess={onUpload}
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
                <span className="text-sm font-medium">Click to upload image</span>
              </button>
            );
          }}
        </CldUploadWidget>
      )}
    </div>
  );
}
