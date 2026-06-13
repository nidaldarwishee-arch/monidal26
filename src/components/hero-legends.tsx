"use client";

export function HeroLegends() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/legends-bg.jpeg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        style={{ opacity: 0.35 }}
      />
      {/* light vignette — keeps text readable without hiding the image */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/55" />
    </>
  );
}
