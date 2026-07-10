import { SentimentData, WordSentiment, normalizeSentiment } from "@/app/types/sentiment";

export const parseResponseData = (response: string[]): SentimentData | null => {
  const wordSentiments: WordSentiment[] = [];
  let overallSentiment = normalizeSentiment("NEUTRAL");
  let overallConfidence: number | null = null;
  let totalConfidence = 0;

  for (const line of response) {
    const wordMatch = line.match(/(\w+)\s*-\s*Sentiment:\s*(\w+)\s*-\s*Confidence:\s*([0-9.]+)/);
    if (wordMatch) {
      const confidence = parseFloat(wordMatch[3]);
      if (!isNaN(confidence)) {
        wordSentiments.push({
          word: wordMatch[1],
          sentiment: normalizeSentiment(wordMatch[2]),
          confidence,
        });
        totalConfidence += confidence;
      }
      continue;
    }

    const overallMatch = line.match(/-Overall-\s*Sentiment:\s*(\w+)\s*-\s*Confidence:\s*([0-9.]+)/);
    if (overallMatch) {
      overallSentiment = normalizeSentiment(overallMatch[1]);
      overallConfidence = parseFloat(overallMatch[2]);
    }
  }

  if (wordSentiments.length === 0) return null;

  return {
    overallSentiment,
    confidence: overallConfidence ?? (totalConfidence / wordSentiments.length),
    wordSentiments,
  };
};