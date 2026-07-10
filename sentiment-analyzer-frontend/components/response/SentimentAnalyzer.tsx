"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useGlobalState, Session } from "@/app/context/GlobalStateContext";
import { SentimentType, normalizeSentiment } from "@/app/types/sentiment";
import type { SentimentData } from "@/app/types/sentiment";
import Visualization from "@/components/d3/Visualization";

function parseLines(lines: string[]): SentimentData | null {
  type WS = { word: string; sentiment: SentimentType; confidence: number };
  const words: WS[] = [];
  let overallSentiment: SentimentType = "NEUTRAL";
  let overallConfidence: number | null = null;
  for (const line of lines) {
    const om = line.match(/-Overall-\s*Sentiment:\s*(\w+)\s*-\s*Confidence:\s*([0-9.]+)/);
    if (om) { overallSentiment = normalizeSentiment(om[1]); overallConfidence = parseFloat(om[2]); continue; }
    const wm = line.match(/^(.+?)\s+-\s+Sentiment:\s+(\w+)\s+-\s+Confidence:\s+([0-9.]+)/);
    if (wm) { const c = parseFloat(wm[3]); if (!isNaN(c)) words.push({ word: wm[1], sentiment: normalizeSentiment(wm[2]), confidence: c }); }
  }
  if (!words.length) return null;
  const avg = words.reduce((s, w) => s + w.confidence, 0) / words.length;
  return { overallSentiment, confidence: overallConfidence ?? avg, wordSentiments: words };
}

type Phase = "idle" | "streaming" | "done" | "error";
interface Props { promptStr: string }

export default function SentimentAnalyzer({ promptStr = "" }: Props) {
  const { newChat, addSession } = useGlobalState();
  const { getToken } = useAuth();
  const [phase, setPhase] = useState<Phase>("idle");
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [lineCount, setLineCount] = useState(0);
  const processing = useRef(false);
  const prevPrompt = useRef("");
  const streamBoxRef = useRef<HTMLDivElement>(null);

  const appendLine = (text: string) => {
    const box = streamBoxRef.current;
    if (!box) return;
    const div = document.createElement("div");
    div.className = "sa-log-line";
    const idx = document.createElement("span");
    idx.className = "sa-log-idx";
    idx.textContent = String(box.children.length + 1).padStart(3, "0");
    const txt = document.createElement("span");
    txt.className = "sa-log-text";
    txt.textContent = text;
    div.appendChild(idx);
    div.appendChild(txt);
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    setLineCount(box.children.length);
  };

  const clearLines = () => {
    if (streamBoxRef.current) streamBoxRef.current.innerHTML = "";
    setLineCount(0);
  };

  // ── ONE effect only: token → fetch → stream → parse → persist ──
  useEffect(() => {
    if (!promptStr.trim() || processing.current || promptStr === prevPrompt.current) return;
    prevPrompt.current = promptStr;

    const run = async () => {
      processing.current = true;
      setPhase("streaming");
      setModalOpen(true);
      clearLines();
      setSentimentData(null);
      setErrorMsg(null);

      try {
        const token = await getToken();
        if (!token) throw new Error("Not signed in.");

        const res = await fetch(
          process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/analyze/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ text: promptStr.trim() }),
          }
        );
        if (res.status === 401) throw new Error("Session expired — please sign in again.");
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);

        let buffer = "";
        const accumulated: string[] = [];

        if (res.body) {
          const reader = res.body.getReader();
          const dec = new TextDecoder();
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += dec.decode(value, { stream: true });
            const parts = buffer.split("\n");
            buffer = parts.pop() ?? "";
            for (const part of parts) {
              if (part.trim()) { accumulated.push(part.trim()); appendLine(part.trim()); }
            }
          }
          if (buffer.trim()) { accumulated.push(buffer.trim()); appendLine(buffer.trim()); }
        }

        const parsed = parseLines(accumulated);
        setSentimentData(parsed);
        setPhase("done");
        setModalOpen(false);

        const session: Session = {
          id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          prompt: promptStr, response: accumulated, sentimentData: parsed, createdAt: new Date(),
        };
        addSession(session);

        fetch("/api/history/create-history-obj", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: promptStr, response: accumulated, forSequence: 0, divide_in_to_groups: newChat ? 1 : 0 }),
        }).catch(console.error);

      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Unknown error");
        setPhase("error");
        setModalOpen(false);
      } finally {
        processing.current = false;
      }
    };

    run();
  }, [promptStr, newChat, addSession, getToken]);

  if (phase === "idle") return null;

  return (
    <>
      {/* ── MODAL: always in DOM so ref is always valid ── */}
      <div
        className="sa-backdrop"
        style={{ opacity: modalOpen ? 1 : 0, pointerEvents: modalOpen ? "auto" : "none", transition: "opacity 0.22s ease" }}
        onClick={() => setModalOpen(false)}
      >
        <div
          className="sa-modal"
          style={{
            transform: modalOpen ? "scale(1) translateY(0)" : "scale(0.96) translateY(18px)",
            opacity: modalOpen ? 1 : 0,
            transition: "transform 0.28s cubic-bezier(0.34,1.3,0.64,1), opacity 0.22s ease",
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="sa-modal-header">
            <div className="sa-modal-header-left">
              <div className="sa-modal-icon">
                {phase === "streaming" ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2"/>
                    <circle cx="8" cy="8" r="2" fill="currentColor"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div className="sa-modal-title-block">
                <span className="sa-modal-title">
                  {phase === "streaming" ? "Processing" : "Analysis Log"}
                </span>
                <span className="sa-modal-subtitle">
                  {lineCount > 0 ? `${lineCount} tokens` : "Connecting…"}
                </span>
              </div>
            </div>
            <button className="sa-modal-close" onClick={() => setModalOpen(false)} aria-label="Close">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="sa-modal-prompt-bar">
            <span className="sa-modal-prompt-label">INPUT</span>
            <span className="sa-modal-prompt-text">{promptStr.length > 90 ? promptStr.slice(0, 89) + "…" : promptStr}</span>
          </div>

          <div className="sa-modal-body">
            <div className="sa-modal-gutter">
              {phase === "streaming" && <div className="sa-modal-scanner" />}
            </div>
            <div ref={streamBoxRef} className="sa-modal-lines" />
          </div>

          <div className="sa-modal-footer">
            <div className="sa-modal-status">
              {phase === "streaming" ? (
                <span className="sa-status-dot sa-status-dot--live" />
              ) : (
                <>
                  <span className="sa-status-dot sa-status-dot--done" />
                  <span className="sa-status-text">Complete</span>
                </>
              )}
            </div>
            <button className="sa-modal-close-btn" onClick={() => setModalOpen(false)}>
              {phase === "streaming" ? "Minimize" : "Close"}
            </button>
          </div>
        </div>
      </div>

      {/* ── FEED ── */}
      <div className="analyzer-root">
        <div className="analyzer-prompt-label">
          <span className="analyzer-prompt-icon">›</span>
          <span className="analyzer-prompt-text">{promptStr}</span>
          <button
            className="sa-feed-toggle"
            onClick={() => setModalOpen(o => !o)}
            title={modalOpen ? "Hide log" : "View log"}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="0.75" y="0.75" width="10.5" height="10.5" rx="2" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M2.5 4h7M2.5 6h5M2.5 8h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <span>{modalOpen ? "Hide log" : "View log"}</span>
            {phase === "streaming" && <span className="sa-feed-toggle-pip" />}
          </button>
        </div>

        {phase === "error" && <div className="analyzer-error">⚠ {errorMsg}</div>}

        {phase === "done" && sentimentData && (
          <div className="analyzer-result">
            <Visualization data={sentimentData} animate />
          </div>
        )}
        {phase === "done" && !sentimentData && (
          <p className="analyzer-empty">Could not parse sentiment data.</p>
        )}
      </div>
    </>
  );
}