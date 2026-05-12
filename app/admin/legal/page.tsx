"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Shield, Lock, Cookie } from "lucide-react";
import { LegalConfig, SiteConfigKey } from "@/types";

const LEGAL_PAGES: { key: SiteConfigKey; label: string; icon: any }[] = [
  { key: "terms", label: "Terms & Conditions", icon: Shield },
  { key: "privacy", label: "Privacy Policy", icon: Lock },
  { key: "cookies", label: "Cookie Policy", icon: Cookie },
];

export default function AdminLegalPage() {
  const [activeTab, setActiveTab] = useState<SiteConfigKey>("terms");
  const [configs, setConfigs] = useState<Partial<Record<SiteConfigKey, LegalConfig>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const results = await Promise.all(
          LEGAL_PAGES.map(async (p) => {
            const res = await fetch(`/api/admin/site-config?key=${p.key}`);
            const data = await res.json();
            return { key: p.key, data: data.value };
          })
        );
        const newConfigs: any = {};
        results.forEach((r) => {
          newConfigs[r.key] = r.data || { content: "" };
        });
        setConfigs(newConfigs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/site-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: activeTab,
          value: configs[activeTab],
        }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Page content saved successfully!" });
      } else {
        setMessage({ type: "error", text: "Failed to save content." });
      }
    } catch {
      setMessage({ type: "error", text: "Connection error." });
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
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Legal Pages</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Edit Terms, Privacy, and Cookie policies using HTML.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Tabs */}
        <div className="space-y-1">
          {LEGAL_PAGES.map((page) => (
            <button
              key={page.key}
              onClick={() => {
                setActiveTab(page.key);
                setMessage(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === page.key
                  ? "bg-brand/10 text-brand border border-brand/20 shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
              }`}
            >
              <page.icon className="size-4" />
              {page.label}
            </button>
          ))}
        </div>

        {/* Content Editor */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground uppercase tracking-wider">
                {LEGAL_PAGES.find((p) => p.key === activeTab)?.label}
              </span>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Save Changes
              </button>
            </div>
            
            <div className="p-6">
              {message && (
                <div className={`mb-6 p-4 rounded-xl text-sm border ${
                  message.type === "success" 
                    ? "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
                    : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                }`}>
                  {message.text}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Page Content (HTML)
                  </label>
                  <textarea
                    value={configs[activeTab]?.content || ""}
                    onChange={(e) => 
                      setConfigs({
                        ...configs,
                        [activeTab]: { content: e.target.value }
                      })
                    }
                    rows={20}
                    className="w-full bg-muted/50 border border-border rounded-xl p-4 text-sm font-mono focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/50 transition-all"
                    placeholder="<h1>Your Title</h1><p>Your content here...</p>"
                  />
                </div>
                
                <div className="bg-muted/30 rounded-xl p-4 border border-border">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Editor Tip</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You can use standard HTML tags like <code>&lt;h1&gt;</code>, <code>&lt;p&gt;</code>, <code>&lt;ul&gt;</code>, etc. 
                    The storefront will automatically apply consistent styling to your content.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
