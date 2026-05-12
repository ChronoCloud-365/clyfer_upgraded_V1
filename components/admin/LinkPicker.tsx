"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";

const ROUTES = [
  { label: "Home", value: "/" },
  { label: "Shop - All", value: "/shop" },
  { label: "Shop - Running", value: "/shop/running" },
  { label: "Shop - Casual", value: "/shop/casual" },
  { label: "Shop - Formal", value: "/shop/formal" },
  { label: "Shop - Sports", value: "/shop/sports" },
  { label: "Shop - Limited", value: "/shop/limited" },
  { label: "About Us", value: "/about" },
  { label: "Contact", value: "/contact" },
  { label: "Privacy Policy", value: "/privacy" },
  { label: "Terms of Service", value: "/terms" },
  { label: "Cookie Policy", value: "/cookies" },
  { label: "Track Order", value: "/track" },
];

interface LinkPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function LinkPicker({ value, onChange, className }: LinkPickerProps) {
  const [isCustom, setIsCustom] = useState(() => !ROUTES.some(r => r.value === value) && value !== "");

  return (
    <div className={className}>
      {!isCustom ? (
        <div className="relative group">
          <select
            value={value}
            onChange={(e) => {
              if (e.target.value === "custom") {
                setIsCustom(true);
              } else {
                onChange(e.target.value);
              }
            }}
            className="w-full h-10 pl-3 pr-10 rounded-xl border border-border bg-background text-sm appearance-none focus:ring-1 focus:ring-brand/50 outline-none transition-all cursor-pointer hover:border-border/80"
          >
            <option value="" disabled>Select a page...</option>
            {ROUTES.map((route) => (
              <option key={route.value} value={route.value}>
                {route.label} ({route.value})
              </option>
            ))}
            <option value="custom">+ Custom URL...</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none group-hover:text-foreground transition-colors" />
        </div>
      ) : (
        <div className="relative">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-10 pl-3 pr-10 rounded-xl border border-border bg-background text-sm focus:ring-1 focus:ring-brand/50 outline-none transition-all"
            placeholder="Enter custom URL (e.g. /my-page)"
            autoFocus
          />
          <button
            onClick={() => setIsCustom(false)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
            title="Switch back to suggestions"
          >
            <ExternalLink className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

