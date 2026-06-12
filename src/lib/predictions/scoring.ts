import { isFinalResultStatus, type MatchResult, type Prediction } from "@/lib/types";

export interface ScoredPrediction {
  prediction: Prediction;
  result?: MatchResult;
  points: number;
  exact: boolean;
  outcome: boolean;
  status: "pending" | "scored";
}

export interface PredictionScoreSummary {
  exact: number;
  outcome: number;
  scored: number;
  pending: number;
  points: number;
}

function sign(value: number) {
  return value > 0 ? 1 : value < 0 ? -1 : 0;
}

function sameWinner(prediction: Prediction, result: MatchResult) {
  if (result.homeGoals !== result.awayGoals) return true;
  if (!result.winner) return !prediction.winner;
  return prediction.winner === result.winner;
}

export function scorePrediction(
  prediction: Prediction,
  result?: MatchResult
): ScoredPrediction {
  if (!result || !isFinalResultStatus(result.status)) {
    return {
      prediction,
      result,
      points: 0,
      exact: false,
      outcome: false,
      status: "pending",
    };
  }

  const exact =
    prediction.homeGoals === result.homeGoals &&
    prediction.awayGoals === result.awayGoals &&
    sameWinner(prediction, result);

  const predictedOutcome = sign(prediction.homeGoals - prediction.awayGoals);
  const actualOutcome = sign(result.homeGoals - result.awayGoals);
  const outcome =
    exact ||
    (actualOutcome === 0
      ? predictedOutcome === 0 && sameWinner(prediction, result)
      : predictedOutcome === actualOutcome);

  return {
    prediction,
    result,
    points: exact ? 3 : outcome ? 1 : 0,
    exact,
    outcome,
    status: "scored",
  };
}

export function summarizeScores(scored: ScoredPrediction[]): PredictionScoreSummary {
  return scored.reduce(
    (summary, item) => {
      if (item.status === "pending") {
        summary.pending += 1;
        return summary;
      }
      summary.scored += 1;
      summary.points += item.points;
      if (item.exact) summary.exact += 1;
      else if (item.outcome) summary.outcome += 1;
      return summary;
    },
    { exact: 0, outcome: 0, scored: 0, pending: 0, points: 0 }
  );
}

export function scorePredictions(
  predictions: Prediction[],
  results: Map<number, MatchResult>
) {
  const items = predictions
    .sort((a, b) => a.matchN - b.matchN)
    .map((prediction) => scorePrediction(prediction, results.get(prediction.matchN)));

  return {
    items,
    summary: summarizeScores(items),
  };
}
