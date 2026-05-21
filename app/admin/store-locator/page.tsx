"use client";

import { useEffect, useState } from "react";
import { MapPin, Save, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { DEFAULT_STORE_LOCATOR } from "@/lib/config-defaults";
import type { StoreLocatorConfig } from "@/types";

export default function AdminStoreLocatorPage() {
  const [config, setConfig] = useState<StoreLocatorConfig>(DEFAULT_STORE_LOCATOR);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/site-config?key=store_locator");
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
        body: JSON.stringify({ key: "store_locator", value: config }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Store locator updated!");
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  }

  function update(patch: Partial<StoreLocatorConfig>) {
    setConfig((prev) => ({ ...prev, ...patch }));
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
            <h1 className="text-2xl font-black text-foreground">Store Locator</h1>
            <p className="text-muted-foreground text-sm">Show your physical store on the website</p>
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

      <div className="admin-card p-6 space-y-6">
        <div className="flex items-center gap-2 text-brand mb-2">
          <MapPin className="size-5" />
          <h2 className="font-bold uppercase tracking-wider text-xs">Store Settings</h2>
        </div>

        {/* Enable toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
          <div>
            <p className="text-sm font-semibold text-foreground">Show Store Section</p>
            <p className="text-xs text-muted-foreground mt-0.5">Display the store locator on the homepage and footer</p>
          </div>
          <button
            type="button"
            onClick={() => update({ enabled: !config.enabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              config.enabled ? "bg-brand" : "bg-muted-foreground/30"
            }`}
          >
            <span
              className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${
                config.enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="admin-label">Store Name</label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => update({ name: e.target.value })}
              className="admin-input"
              placeholder="Clyfar Fashion"
            />
          </div>

          <div className="space-y-1.5">
            <label className="admin-label">Address</label>
            <textarea
              value={config.address}
              onChange={(e) => update({ address: e.target.value })}
              className="admin-input min-h-[80px] resize-none"
              placeholder="Road 12, House 5, Dhanmondi, Dhaka 1205"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <label className="admin-label">Google Maps URL</label>
            <input
              type="url"
              value={config.mapUrl}
              onChange={(e) => update({ mapUrl: e.target.value })}
              className="admin-input"
              placeholder="https://maps.app.goo.gl/..."
            />
            <p className="text-[10px] text-muted-foreground italic">Paste the share link from Google Maps</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="admin-label">Phone Number</label>
              <input
                type="tel"
                value={config.phone ?? ""}
                onChange={(e) => update({ phone: e.target.value })}
                className="admin-input"
                placeholder="01XXXXXXXXX"
              />
            </div>

            <div className="space-y-1.5">
              <label className="admin-label">Opening Hours</label>
              <input
                type="text"
                value={config.hours ?? ""}
                onChange={(e) => update({ hours: e.target.value })}
                className="admin-input"
                placeholder="Sat–Thu: 10am–9pm"
              />
            </div>
          </div>
        </div>
      </div>

      {config.mapUrl && (
        <div className="rounded-2xl overflow-hidden border aspect-video">
          <iframe
            src={`https://maps.google.com/maps?q=${encodeURIComponent(config.address || config.name)}&output=embed`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Store location preview"
          />
        </div>
      )}
    </div>
  );
}
