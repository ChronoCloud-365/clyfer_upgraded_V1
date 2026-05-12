"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Save, ChevronDown, ChevronRight, Loader2, Image as ImageIcon } from "lucide-react";
import type { HeroConfig, HeroSlide } from "@/types";
import { DEFAULT_HERO } from "@/lib/config-defaults";
import { CloudinaryUpload } from "@/components/admin/CloudinaryUpload";
import { LinkPicker } from "@/components/admin/LinkPicker";

function generateId() {
  return "slide-" + Math.random().toString(36).slice(2);
}

function makeDefaultSlide(): HeroSlide {
  return {
    id: generateId(),
    badge: "New Drop",
    title: "Step Into",
    titleHighlight: "The Future.",
    subtitle: "Discover premium footwear built for those who move forward.",
    ctaPrimary: { label: "Shop Now", href: "/shop" },
    ctaSecondary: { label: "Explore", href: "/shop/limited" },
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=90",
    stats: [
      { value: "50K+", label: "Customers" },
      { value: "200+", label: "Styles" },
      { value: "4.9★", label: "Rating" },
    ],
  };
}

type FieldPath =
  | "badge"
  | "title"
  | "titleHighlight"
  | "subtitle"
  | "imageUrl"
  | "ctaPrimary.label"
  | "ctaPrimary.href"
  | "ctaSecondary.label"
  | "ctaSecondary.href";

export default function AdminHeroPage() {
  const [config, setConfig] = useState<HeroConfig>(DEFAULT_HERO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedSlide, setExpandedSlide] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/site-config?key=hero")
      .then((r) => r.json())
      .then((d) => {
        const cfg = d.value ?? DEFAULT_HERO;
        setConfig(cfg);
        if (cfg.slides?.length > 0) setExpandedSlide(cfg.slides[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/admin/site-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "hero", value: config }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function addSlide() {
    const slide = makeDefaultSlide();
    setConfig((c) => ({ ...c, slides: [...c.slides, slide] }));
    setExpandedSlide(slide.id);
  }

  function removeSlide(id: string) {
    setConfig((c) => ({ ...c, slides: c.slides.filter((s) => s.id !== id) }));
    if (expandedSlide === id) setExpandedSlide(null);
  }

  function updateSlide(id: string, field: FieldPath, value: string) {
    setConfig((c) => ({
      ...c,
      slides: c.slides.map((s) => {
        if (s.id !== id) return s;
        if (field.includes(".")) {
          const [top, sub] = field.split(".");
          return { ...s, [top]: { ...(s[top as keyof HeroSlide] as Record<string,string>), [sub]: value } };
        }
        return { ...s, [field]: value };
      }),
    }));
  }

  function updateStat(slideId: string, idx: number, field: "value" | "label", val: string) {
    setConfig((c) => ({
      ...c,
      slides: c.slides.map((s) =>
        s.id !== slideId
          ? s
          : {
              ...s,
              stats: s.stats.map((st, i) =>
                i === idx ? { ...st, [field]: val } : st
              ),
            }
      ),
    }));
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hero Slider Editor</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage hero slides — each slide has its own image, text, and CTAs
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-70"
          style={{ background: "oklch(0.78 0.18 72)", color: "oklch(0.09 0 0)" }}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saved ? "Saved!" : saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {/* Slides */}
      <div className="space-y-4 mb-6">
        {config.slides.map((slide, slideIdx) => (
          <div
            key={slide.id}
            className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
          >
            {/* Slide header */}
            <div className="flex items-center gap-3 p-4">
              <div className="size-10 rounded-xl overflow-hidden bg-muted shrink-0 border border-border">
                {slide.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={slide.imageUrl}
                    alt="slide"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="size-4 m-auto text-muted-foreground mt-3" />
                )}
              </div>
              <button
                onClick={() =>
                  setExpandedSlide(expandedSlide === slide.id ? null : slide.id)
                }
                className="flex-1 flex items-center gap-2 text-left hover:opacity-80 transition-opacity"
              >
                {expandedSlide === slide.id ? (
                  <ChevronDown className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
                <span className="text-sm font-semibold text-card-foreground">
                  Slide {slideIdx + 1}
                </span>
                <span className="text-xs text-muted-foreground ml-1 truncate max-w-[200px] lg:max-w-[300px]">
                  — {slide.title} {slide.titleHighlight}
                </span>
              </button>
              <button
                onClick={() => removeSlide(slide.id)}
                className="text-destructive hover:text-destructive/80 p-1"
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            {/* Slide editor */}
            <AnimatePresence>
              {expandedSlide === slide.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border p-5 space-y-6 bg-muted/30"
                >
                  {/* Image URL */}
                  <div>
                    <label className="admin-label mb-2">Slide Background Image</label>
                    <CloudinaryUpload
                      value={slide.imageUrl ? [slide.imageUrl] : []}
                      onChange={(urls) => updateSlide(slide.id, "imageUrl", urls[0] || "")}
                      onAddImage={(url) => updateSlide(slide.id, "imageUrl", url)}
                      onRemove={() => updateSlide(slide.id, "imageUrl", "")}
                      maxFiles={1}
                    />
                    <div className="flex gap-2 mt-3 items-center">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Or paste URL manually:</span>
                      <input
                        value={slide.imageUrl}
                        onChange={(e) => updateSlide(slide.id, "imageUrl", e.target.value)}
                        className="admin-input text-xs"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  {/* Text content */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="admin-label">Badge Text</label>
                      <input
                        value={slide.badge ?? ""}
                        onChange={(e) => updateSlide(slide.id, "badge", e.target.value)}
                        className="admin-input"
                        placeholder="New Season Drop"
                      />
                    </div>
                    <div>
                      <label className="admin-label">Title (line 1)</label>
                      <input
                        value={slide.title}
                        onChange={(e) => updateSlide(slide.id, "title", e.target.value)}
                        className="admin-input"
                        placeholder="Step Into"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="admin-label">Title Highlight (amber text)</label>
                      <input
                        value={slide.titleHighlight}
                        onChange={(e) => updateSlide(slide.id, "titleHighlight", e.target.value)}
                        className="admin-input"
                        placeholder="Your Era."
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="admin-label">Subtitle / Description</label>
                      <textarea
                        value={slide.subtitle}
                        onChange={(e) => updateSlide(slide.id, "subtitle", e.target.value)}
                        className="admin-input resize-none"
                        rows={2}
                        placeholder="Tagline text under the headline…"
                      />
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="admin-label">Primary CTA Label</label>
                      <input
                        value={slide.ctaPrimary.label}
                        onChange={(e) => updateSlide(slide.id, "ctaPrimary.label", e.target.value)}
                        className="admin-input"
                        placeholder="Shop Now"
                      />
                      <label className="admin-label">Primary CTA Link</label>
                      <LinkPicker
                        value={slide.ctaPrimary.href}
                        onChange={(val) => updateSlide(slide.id, "ctaPrimary.href", val)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="admin-label">Secondary CTA Label</label>
                      <input
                        value={slide.ctaSecondary.label}
                        onChange={(e) => updateSlide(slide.id, "ctaSecondary.label", e.target.value)}
                        className="admin-input"
                        placeholder="Explore"
                      />
                      <label className="admin-label">Secondary CTA Link</label>
                      <LinkPicker
                        value={slide.ctaSecondary.href}
                        onChange={(val) => updateSlide(slide.id, "ctaSecondary.href", val)}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div>
                    <label className="admin-label mb-2">Stats (3 pills)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {slide.stats.map((stat, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <input
                            value={stat.value}
                            onChange={(e) => updateStat(slide.id, idx, "value", e.target.value)}
                            className="admin-input text-xs"
                            placeholder="50K+"
                          />
                          <input
                            value={stat.label}
                            onChange={(e) => updateStat(slide.id, idx, "label", e.target.value)}
                            className="admin-input text-xs"
                            placeholder="Happy customers"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <button
        onClick={addSlide}
        className="w-full py-4 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all flex items-center justify-center gap-2 text-sm font-semibold"
      >
        <Plus className="size-4" /> Add New Slide
      </button>
    </div>
  );
}
