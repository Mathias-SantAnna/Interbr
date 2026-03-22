"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

const SLIDES = [
  {
    src: "/banner-solar.png",
    alt: "Interbrasil Energia Solar — Paineis, Inversores e Bombeamento",
    headline: "Energia Solar & Bombeamento",
    sub: "Inversores On Grid e Off Grid, Paineis Solares, Cabos e Conectores das melhores marcas.",
    cta: { label: "Ver catalogo Solar", href: "/catalog?category=solar" },
    overlay: "from-black/60 via-black/20 to-transparent",
  },
  {
    src: "/banner-carlton.png",
    alt: "Interbrasil Florestal — Correntes Carlton, Sabres e Motosserras",
    headline: "Linha Florestal Carlton",
    sub: "A maior linha de correntes, sabres e pecas para motosserras e rocadeiras do Brasil.",
    cta: { label: "Ver catalogo Florestal", href: "/catalog?category=florestal" },
    overlay: "from-black/70 via-black/30 to-transparent",
  },
  {
    src: "/banner-sede.png",
    alt: "Sede Interbrasil Distribuidora — Brasilia DF",
    headline: "Interbrasil Distribuidora",
    sub: "30 anos liderando a distribuicao de pecas de reposicao no Centro-Oeste. Mais de 5.000 referencias em estoque.",
    cta: { label: "Conheca a empresa", href: "/sobre" },
    overlay: "from-black/60 via-black/20 to-transparent",
  },
];

const INTERVAL = 5000;

export function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent((c) => (c + 1) % SLIDES.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length), []);
  const goTo = useCallback((i: number) => setCurrent(i), []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, INTERVAL);
    return () => clearInterval(id);
  }, [next, paused]);

  return (
    <section
      className="relative overflow-hidden rounded-2xl shadow-md"
      style={{ aspectRatio: "16/5" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${i === current ? "opacity-100 z-10" : "opacity-0 z-0"}`}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={i === 0}
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 1200px"
          />
          {/* Gradient overlay */}
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.overlay}`} />

          {/* Text */}
          <div className="absolute inset-0 flex flex-col justify-end px-8 pb-10 md:px-14 md:pb-12 max-w-2xl">
            <p className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Interbrasil Distribuidora
            </p>
            <h2 className="text-2xl font-bold text-white drop-shadow md:text-4xl tracking-[-0.03em] leading-tight">
              {slide.headline}
            </h2>
            <p className="mt-2 max-w-sm text-[13px] text-white/80 leading-relaxed hidden sm:block">
              {slide.sub}
            </p>
            <div className="mt-5">
              <Link
                href={slide.cta.href}
                className="inline-flex h-10 items-center rounded-xl bg-primary px-6 text-[13px] font-semibold text-white shadow hover:bg-primary/90 transition"
              >
                {slide.cta.label}
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Prev / Next arrows */}
      <button
        onClick={prev}
        aria-label="Anterior"
        className="absolute left-3 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button
        onClick={next}
        aria-label="Proximo"
        className="absolute right-3 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 transition"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "w-6 h-2 bg-white"
                : "w-2 h-2 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>

      {/* Progress bar */}
      {!paused && (
        <div className="absolute bottom-0 left-0 z-20 h-0.5 w-full bg-white/20">
          <div
            key={current}
            className="h-full bg-primary"
            style={{
              animation: `slideProgress ${INTERVAL}ms linear forwards`,
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes slideProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </section>
  );
}
