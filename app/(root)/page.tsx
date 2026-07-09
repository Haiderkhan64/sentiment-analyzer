"use client";

import { useEffect } from "react";
import { useGlobalState } from "@/app/context/GlobalStateContext";
import PromptInput from "@/components/forms/PromptInput";
import SentimentAnalyzer from "@/components/response/SentimentAnalyzer";
import SessionView from "@/components/history/SessionView";

export default function Home() {
  const {
    submittedPrompt,
    activeSession,
    activeSessionId,
    isLoading,
    error,
    setIsLoading,
  } = useGlobalState();

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/user/")
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [setIsLoading]);

  // Exactly one of these is true at a time:
  // - activeSession set → user clicked a sidebar item
  // - submittedPrompt set → user just typed a new prompt
  // - neither → empty state
  const showSession  = !!activeSession;
  const showAnalyzer = !!submittedPrompt && !activeSessionId;
  const showEmpty    = !showSession && !showAnalyzer && !isLoading;

  return (
    <div className="page-root">
      <div className="page-feed">

        {error && <div className="page-error">⚠ {error}</div>}

        {isLoading && (
          <div className="page-loader">
            <span className="page-loader-dot" />
            <span className="page-loader-dot" />
            <span className="page-loader-dot" />
          </div>
        )}

        {/* Selected history session — key forces full remount on switch */}
        {showSession && (
          <SessionView
            key={activeSession!.id}
            session={activeSession!}
          />
        )}

        {/* Live new analysis */}
        {showAnalyzer && (
          <SentimentAnalyzer promptStr={submittedPrompt} />
        )}

        {/* Empty state */}
        {showEmpty && (
          <div className="page-empty">
            <div className="page-empty-icon">
              <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                <circle cx="26" cy="26" r="22" stroke="rgba(16,217,145,0.12)" strokeWidth="1.5"/>
                <circle cx="26" cy="26" r="14" stroke="rgba(16,217,145,0.2)" strokeWidth="1"/>
                <circle cx="18" cy="23" r="4.5" fill="rgba(255,77,109,0.55)"/>
                <circle cx="34" cy="23" r="4.5" fill="rgba(16,217,145,0.55)"/>
                <path d="M17 33 Q26 40 35 33" stroke="rgba(245,166,35,0.65)" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <h2 className="page-empty-title">What would you like to analyze?</h2>
            <p className="page-empty-sub">
              Type any text below and get back word-level sentiment scores with an interactive visualization.
            </p>
          </div>
        )}

      </div>

      <div className="page-input-bar">
        <PromptInput />
      </div>
    </div>
  );
}