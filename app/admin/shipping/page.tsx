"use client";

import { useEffect, useState } from "react";
import { Truck, Save, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { DEFAULT_SHIPPING } from "@/lib/config-defaults";
import type { ShippingConfig } from "@/types";

export default function AdminShippingPage() {
  const [config, setConfig] = useState<ShippingConfig>(DEFAULT_SHIPPING);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/site-config?key=shipping");
      if (res.ok) {
        const data = await res.json();
        if (data.value) setConfig(data.value);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "shipping", value: config }),
      });

      if (!res.ok) throw new Error("Failed to save");
      toast.success("Shipping configuration updated!");
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="size-9 rounded-xl border border-border flex items-center justify-center hover:bg-accent transition-colors"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-foreground">Shipping Setup</h1>
            <p className="text-muted-foreground text-sm">Manage delivery costs</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-foreground text-background transition-all hover:opacity-90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid gap-6">
        <div className="admin-card p-6 space-y-6">
          <div className="flex items-center gap-2 text-brand mb-2">
            <Truck className="size-5" />
            <h2 className="font-bold uppercase tracking-wider text-xs">Delivery Rates (BDT)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="admin-label">Inside Dhaka</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">৳</span>
                <input
                  type="number"
                  value={config.insideDhaka}
                  onChange={(e) => setConfig({ ...config, insideDhaka: Number(e.target.value) })}
                  className="admin-input pl-10"
                  placeholder="80"
                />
              </div>
              <p className="text-[10px] text-muted-foreground italic">Standard rate for Dhaka City</p>
            </div>

            <div className="space-y-2">
              <label className="admin-label">Outside Dhaka</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">৳</span>
                <input
                  type="number"
                  value={config.outsideDhaka}
                  onChange={(e) => setConfig({ ...config, outsideDhaka: Number(e.target.value) })}
                  className="admin-input pl-10"
                  placeholder="120"
                />
              </div>
              <p className="text-[10px] text-muted-foreground italic">Rate for all other districts</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-brand/5 border border-brand/10 p-5">
          <p className="text-sm text-brand font-medium">
            💡 These rates will be automatically applied at checkout based on the customer&apos;s selected area.
          </p>
        </div>
      </div>
    </div>
  );
}
