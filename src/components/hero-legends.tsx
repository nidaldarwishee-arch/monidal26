"use client";

export function HeroLegends() {
  return (
    <div
      className="relative mx-auto mt-8 h-56 w-full max-w-5xl overflow-hidden rounded-2xl md:h-80"
      role="img"
      aria-label="Football legends Pelé, Maradona, Messi and Ronaldo"
    >
      {/* Legendary players photo — grayscale white tint, 9% opacity */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/legends-bg.jpeg"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-top"
        style={{
          opacity: 0.09,
          filter: "grayscale(100%) brightness(250%)",
        }}
      />

      {/* Subtle vignette so the pitch-grid squares read through cleanly */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
    </div>
  );
}
