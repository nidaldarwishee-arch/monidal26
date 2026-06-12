const LEGENDS = [
  {
    name: "Maradona",
    number: "10",
    nation: "Argentina",
    className: "left-2 top-8 rotate-[-6deg] md:left-12 md:top-12",
    kit: "bg-sky-500",
    trim: "bg-white",
    accent: "border-sky-300/80",
  },
  {
    name: "Ronaldo",
    number: "7",
    nation: "Portugal",
    className: "left-1/2 top-0 -translate-x-1/2 scale-105",
    kit: "bg-red-600",
    trim: "bg-emerald-500",
    accent: "border-red-300/80",
  },
  {
    name: "Messi",
    number: "10",
    nation: "Argentina",
    className: "right-2 top-10 rotate-[6deg] md:right-12 md:top-14",
    kit: "bg-blue-500",
    trim: "bg-white",
    accent: "border-blue-300/80",
  },
] as const;

export function HeroLegends() {
  return (
    <div
      className="relative mx-auto mt-8 h-56 w-full max-w-5xl md:h-72"
      role="img"
      aria-label="Stylized football legends Maradona, Ronaldo, and Messi with an animated ball"
    >
      <div className="absolute inset-x-4 bottom-6 h-[4.5rem] rounded-[50%] border border-primary/20 bg-primary/10 blur-sm" />
      <div className="hero-ball absolute left-[17%] top-7 z-20 size-12 rounded-full border-2 border-foreground/80 bg-card shadow-lg md:left-[23%] md:size-16">
        <span className="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground md:size-6" />
        <span className="absolute left-2 top-3 size-2 rounded-full bg-foreground md:left-3 md:top-4" />
        <span className="absolute right-2 top-3 size-2 rounded-full bg-foreground md:right-3 md:top-4" />
        <span className="absolute bottom-2 left-4 size-2 rounded-full bg-foreground md:bottom-3 md:left-6" />
      </div>

      {LEGENDS.map((legend, index) => (
        <figure
          key={legend.name}
          className={`hero-legend absolute z-10 w-[8.5rem] md:w-44 ${legend.className}`}
          style={{ animationDelay: `${index * 120}ms` }}
        >
          <div className={`relative mx-auto h-36 w-24 rounded-t-full border-2 ${legend.accent} bg-card/95 shadow-xl md:h-48 md:w-32`}>
            <div className="absolute left-1/2 top-4 size-[3.25rem] -translate-x-1/2 rounded-full border-2 border-foreground/70 bg-muted md:size-16" />
            <div className={`absolute bottom-0 left-1/2 h-24 w-20 -translate-x-1/2 rounded-t-3xl ${legend.kit} md:h-32 md:w-[6.75rem]`}>
              <div className={`absolute inset-x-0 top-5 h-2 ${legend.trim}`} />
              <div className="absolute inset-x-0 top-9 text-center font-display text-3xl font-bold text-white md:top-12 md:text-4xl">
                {legend.number}
              </div>
            </div>
            <div className={`absolute bottom-3 left-0 h-4 w-8 -translate-x-5 rotate-[-20deg] rounded-full ${legend.kit}`} />
            <div className={`absolute bottom-3 right-0 h-4 w-8 translate-x-5 rotate-[20deg] rounded-full ${legend.kit}`} />
          </div>
          <figcaption className="mt-3 rounded-lg border bg-card/90 px-3 py-2 text-center shadow-sm backdrop-blur">
            <span className="block text-sm font-bold">{legend.name}</span>
            <span className="block text-xs text-muted-foreground">{legend.nation}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
