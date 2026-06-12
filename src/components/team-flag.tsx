"use client";

import Image from "next/image";
import { CircleHelp } from "lucide-react";
import { TEAM_MAP } from "@/data/teams";
import { cn } from "@/lib/utils";

/** Team flag with a graceful placeholder for unresolved knockout slots. */
export function TeamFlag({
  teamId,
  size = 28,
  className,
}: {
  teamId?: string;
  size?: number;
  className?: string;
}) {
  const team = teamId ? TEAM_MAP[teamId] : undefined;

  if (!team) {
    return (
      <span
        aria-hidden
        className={cn(
          "grid shrink-0 place-items-center rounded-md bg-muted text-muted-foreground",
          className
        )}
        style={{ width: size, height: Math.round(size * 0.75) }}
      >
        <CircleHelp style={{ width: size * 0.55, height: size * 0.55 }} />
      </span>
    );
  }

  return (
    <Image
      src={`https://flagcdn.com/w80/${team.iso}.png`}
      alt={team.nameEn}
      width={size}
      height={Math.round(size * 0.75)}
      className={cn("shrink-0 rounded-md border object-cover", className)}
      style={{ width: size, height: Math.round(size * 0.75) }}
      unoptimized
    />
  );
}
