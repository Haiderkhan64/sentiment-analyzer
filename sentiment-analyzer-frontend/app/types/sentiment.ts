export type SentimentType = "POSITIVE" | "NEGATIVE" | "NEUTRAL";

export interface WordSentiment {
  word: string;
  sentiment: SentimentType;
  confidence: number;
}

export interface SentimentData {
  overallSentiment: SentimentType;
  confidence: number;
  wordSentiments: WordSentiment[];
}

export interface HistoryItem {
  prompt: string;
  response: string[];
  history_group_id?: {
    forSequence: number;
    divide_in_to_groups: number;
  };
}

export const SENTIMENT_COLORS: Record<SentimentType, string> = {
  POSITIVE: "#10d991",
  NEGATIVE: "#ff4d6d",
  NEUTRAL:  "#f5a623",
};

export const SENTIMENT_LABEL: Record<SentimentType, string> = {
  POSITIVE: "Positive",
  NEGATIVE: "Negative",
  NEUTRAL:  "Neutral",
};

export const normalizeSentiment = (s: string): SentimentType => {
  const u = s.toUpperCase();
  if (u === "POSITIVE" || u === "NEGATIVE" || u === "NEUTRAL") return u;
  return "NEUTRAL";
};