"use client";

import { useEffect, useState } from "react";
import { Session } from "@/app/context/GlobalStateContext";
import { SentimentData, SentimentType, normalizeSentiment } from "@/app/types/sentiment";
import Visualization from "@/components/d3/Visualization";

function parseLines(lines: string[]): SentimentData | null {
  type WS = { word: string; sentiment: SentimentType; confidence: number };
  const words: WS[] = [];
  let overall: SentimentType = "NEUTRAL";
  let overallConf: number | null = null;

  for (const line of lines) {
    const om = line.match(/-Overall-\s*Sentiment:\s*(\w+)\s*-\s*Confidence:\s*([0-9.]+)/);
    if (om) {
      overall     = normalizeSentiment(om[1]);
      overallConf = parseFloat(om[2]);
      continue;
    }
    const wm = line.match(/^(.+?)\s+-\s+Sentiment:\s+(\w+)\s+-\s+Confidence:\s+([0-9.]+)/);
    if (wm) {
      const c = parseFloat(wm[3]);
      if (!isNaN(c)) words.push({ word: wm[1], sentiment: normalizeSentiment(wm[2]), confidence: c });
    }
  }

  if (!words.length) return null;
  const avg = words.reduce((s, w) => s + w.confidence, 0) / words.length;
  return { overallSentiment: overall, confidence: overallConf ?? avg, wordSentiments: words };
}

export default function SessionView({ session }: { session: Session }) {
  const [data, setData] = useState<SentimentData | null>(() =>
    session.sentimentData ?? (session.response?.length ? parseLines(session.response) : null)
  );

  useEffect(() => {
    // Use the functional setter to check 'prev' state
    setData((currentData) => {
      if (!currentData && session.response?.length) {
        return parseLines(session.response);
      }
      return currentData;
    });
  }, [session.id, session.response]); // 'data' is no longer needed here

  const ts = new Date(session.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const ds = new Date(session.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="session-view">
      <div className="session-view-header">
        <div className="analyzer-prompt-label">
          <span className="analyzer-prompt-icon">›</span>
          <span className="analyzer-prompt-text">{session.prompt}</span>
        </div>
        <span className="session-view-ts">{ds} &middot; {ts}</span>
      </div>

      {data
        ? <Visualization data={data} animate={false} />
        : (
          <div className="session-view-empty">
            <p>No visualization data for this entry.</p>
          </div>
        )
      }
    </div>
  );
}