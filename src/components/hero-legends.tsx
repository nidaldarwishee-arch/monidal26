"use client";

export function HeroLegends() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/legends-bg.jpeg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top"
        style={{ opacity: 0.22 }}
      />
      {/* bottom fade so text/cards sit cleanly over the image */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/30 to-background/80" />
    </>
  );
}
