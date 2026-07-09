"use client";

import { useState, useEffect } from "react";
import { parseResponseData } from "@/lib/parseSentiment";
import { SentimentData } from "@/app/types/sentiment";
import Visualization from "@/components/d3/Visualization";

interface Props {
  prompt: string;
  responses: string[];
  index?: number;
}

export default function Response({ prompt, responses, index = 0 }: Props) {
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [expanded, setExpanded]           = useState(false);

  useEffect(() => {
    if (responses?.length) {
      setSentimentData(parseResponseData(responses));
    }
  }, [responses]);

  if (!prompt) return null;

  const truncated = prompt.length > 72 ? prompt.slice(0, 72) + "\u2026" : prompt;

  return (
    <div
      className={`history-card ${expanded ? "history-card--expanded" : ""}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <button
        className="history-card-trigger"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <div className="history-card-trigger-left">
          <span className="history-card-index">#{(index + 1).toString().padStart(2, "0")}</span>
          <span className="history-card-prompt">{truncated}</span>
        </div>
        <div className="history-card-trigger-right">
          {sentimentData && (
            <span
              className={`history-card-badge history-card-badge--${sentimentData.overallSentiment.toLowerCase()}`}
            >
              {sentimentData.overallSentiment}
            </span>
          )}
          <span className={`history-card-chevron ${expanded ? "history-card-chevron--open" : ""}`}>
            &#8250;
          </span>
        </div>
      </button>

      {expanded && (
        <div className="history-card-body">
          {sentimentData
            ? <Visualization data={sentimentData} animate={false} />
            : <p className="history-card-empty">No sentiment data available.</p>
          }
        </div>
      )}
    </div>
  );
}