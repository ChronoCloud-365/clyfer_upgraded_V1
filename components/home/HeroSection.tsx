"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, Sparkles, TrendingUp } from "lucide-react";
import type { HeroSlide } from "@/types";

interface Props {
  slides: HeroSlide[];
}

export function HeroSlider({ slides }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  ]);
  const [current, setCurrent] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrent(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (!slides.length) return null;

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-background">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 size-[600px] rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 size-[400px] rounded-full bg-blue-500/10 blur-[100px]" />
      </div>

      {/* Embla viewport */}
      <div className="embla w-full" ref={emblaRef}>
        <div className="embla__container flex">
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className="embla__slide min-w-full relative"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-36">
                <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[70vh]">
                  {/* Text side */}
                  <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    animate={i === current ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="space-y-8"
                  >
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      {slide.badge && (
                        <motion.span
                          initial={{ opacity: 0, y: -10 }}
                          animate={i === current ? { opacity: 1, y: 0 } : {}}
                          transition={{ delay: 0.1 }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold"
                        >
                          <Sparkles className="size-3" />
                          {slide.badge}
                        </motion.span>
                      )}
                      <motion.span
                        initial={{ opacity: 0, y: -10 }}
                        animate={i === current ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.15 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-muted/60 text-muted-foreground text-xs font-medium"
                      >
                        <TrendingUp className="size-3" />
                        Trending Now
                      </motion.span>
                    </div>

                    {/* Headline */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={i === current ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.2 }}
                    >
                      <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-normal text-foreground">
                        {slide.title}
                        <br />
                        <span className="text-brand">{slide.titleHighlight}</span>
                      </h1>
                    </motion.div>

                    {/* Subtitle */}
                    <motion.p
                      initial={{ opacity: 0, y: 16 }}
                      animate={i === current ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.3 }}
                      className="text-muted-foreground text-lg leading-relaxed max-w-md"
                    >
                      {slide.subtitle}
                    </motion.p>

                    {/* CTAs */}
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={i === current ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.4 }}
                      className="flex flex-wrap gap-3"
                    >
                      <Link
                        href={slide.ctaPrimary.href}
                        className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl font-bold text-sm transition-all hover:scale-[1.03] active:scale-[0.98]"
                        style={{
                          background: "oklch(0.78 0.18 72)",
                          color: "oklch(0.09 0 0)",
                        }}
                      >
                        {slide.ctaPrimary.label}
                      </Link>
                      <Link
                        href={slide.ctaSecondary.href}
                        className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl font-semibold text-sm text-foreground border border-border hover:border-muted-foreground hover:bg-muted transition-all"
                      >
                        {slide.ctaSecondary.label}
                      </Link>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={i === current ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.5 }}
                      className="flex gap-4 pt-2"
                    >
                      {slide.stats.map((stat, si) => (
                        <div
                          key={si}
                          className="flex flex-col items-center justify-center px-5 py-3 rounded-2xl bg-card border border-border backdrop-blur-sm"
                        >
                          <span className="text-xl font-bold text-foreground">{stat.value}</span>
                          <span className="text-xs text-muted-foreground mt-0.5">{stat.label}</span>
                        </div>
                      ))}
                    </motion.div>
                  </motion.div>

                  {/* Image side */}
                  <motion.div
                    initial={{ opacity: 0, x: 40, scale: 0.95 }}
                    animate={i === current ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                    className="relative flex items-center justify-center"
                  >
                    <div className="relative">
                      {/* Glow */}
                      <div className="absolute inset-8 rounded-full bg-amber-500/20 blur-3xl" />
                      <div className="relative z-10 rounded-3xl overflow-hidden w-full max-w-lg aspect-square">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={slide.imageUrl}
                          alt={`${slide.title} ${slide.titleHighlight}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      {slides.length > 1 && (
        <>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
            {/* Dots */}
            <div className="flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => emblaApi?.scrollTo(i)}
                  className={`transition-all duration-300 rounded-full ${
                    i === current
                      ? "w-8 h-2 bg-brand"
                      : "w-2 h-2 bg-muted hover:bg-muted-foreground"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Prev/Next */}
          <button
            onClick={scrollPrev}
            className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 size-12 rounded-2xl bg-card border border-border flex items-center justify-center text-foreground hover:bg-muted transition-all backdrop-blur-sm"
            aria-label="Previous slide"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 size-12 rounded-2xl bg-card border border-border flex items-center justify-center text-foreground hover:bg-muted transition-all backdrop-blur-sm"
            aria-label="Next slide"
          >
            <ChevronRight className="size-5" />
          </button>

          {/* Slide counter */}
          <div className="absolute top-8 right-8 text-xs text-muted-foreground font-mono">
            {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </div>
        </>
      )}

      {/* Scroll hint */}
      <div className="absolute bottom-8 right-8 lg:right-16 hidden lg:flex flex-col items-center gap-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] rotate-90 origin-center translate-y-6">
          Scroll
        </span>
        <div className="w-px h-10 bg-gradient-to-b from-transparent to-border" />
      </div>
    </section>
  );
}
