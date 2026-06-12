import { ApiFootballProvider } from "@/lib/live-scores/providers/api-football";
import { FootballDataProvider } from "@/lib/live-scores/providers/football-data";
import { ManualLiveScoreProvider } from "@/lib/live-scores/providers/manual";
import { SportmonksProvider } from "@/lib/live-scores/providers/sportmonks";
import type { LiveScoreProvider, LiveScoreProviderId } from "@/lib/live-scores/types";

const PROVIDERS: LiveScoreProviderId[] = ["manual", "api-football", "football-data", "sportmonks"];

export function getConfiguredLiveScoreProviderId(): LiveScoreProviderId {
  const configured = process.env.LIVE_SCORE_PROVIDER?.trim() as LiveScoreProviderId | undefined;
  return configured && PROVIDERS.includes(configured) ? configured : "manual";
}

export function createLiveScoreProvider(
  id: LiveScoreProviderId = getConfiguredLiveScoreProviderId()
): LiveScoreProvider {
  switch (id) {
    case "api-football":
      return new ApiFootballProvider(process.env.API_FOOTBALL_KEY ?? "");
    case "football-data":
      return new FootballDataProvider(process.env.FOOTBALL_DATA_KEY ?? "");
    case "sportmonks":
      return new SportmonksProvider(process.env.SPORTMONKS_API_KEY ?? "");
    case "manual":
    default:
      return new ManualLiveScoreProvider();
  }
}
