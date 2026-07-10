"use client";

import { useState, useRef, useEffect } from "react";
import { useGlobalState } from "@/app/context/GlobalStateContext";

const MAX = 5000;

export default function PromptInput() {
  const [value, setValue]   = useState("");
  const textareaRef         = useRef<HTMLTextAreaElement>(null);
  const {
    isLoading,
    setIsLoading,
    setError,
    submitNewPrompt,  // ← use this, not setSubmittedPrompt
  } = useGlobalState();

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading || trimmed.length > MAX) return;
    setIsLoading(true);
    setError(null);
    submitNewPrompt(trimmed); // deselects sidebar, sets prompt
    setValue("");
    setTimeout(() => setIsLoading(false), 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const remaining = MAX - value.length;
  const pct       = (value.length / MAX) * 100;
  const overLimit = value.length > MAX;

  return (
    <div className="prompt-wrap">
      <div className={`prompt-box${isLoading ? " prompt-box--loading" : ""}${overLimit ? " prompt-box--over" : ""}`}>
        <textarea
          ref={textareaRef}
          className="prompt-textarea"
          placeholder="Type text to analyze sentiment…"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isLoading}
          aria-label="Text to analyze"
        />
        <div className="prompt-footer">
          <div className="prompt-char-wrap">
            <svg className="prompt-ring" viewBox="0 0 32 32" width="20" height="20">
              <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3"/>
              <circle
                cx="16" cy="16" r="12"
                fill="none"
                stroke={overLimit ? "#ff4d6d" : pct > 80 ? "#f5a623" : "#10d991"}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="75.4"
                strokeDashoffset={`${75.4 - (Math.min(pct, 100) / 100) * 75.4}`}
                style={{ transition: "stroke-dashoffset 0.2s, stroke 0.3s", transform: "rotate(-90deg)", transformOrigin: "center" }}
              />
            </svg>
            <span className={`prompt-char-count${overLimit ? " prompt-char-count--over" : ""}`}>
              {overLimit ? `-${Math.abs(remaining)}` : remaining}
            </span>
          </div>
          <button
            className="prompt-submit"
            onClick={handleSubmit}
            disabled={!value.trim() || isLoading || overLimit}
            aria-label="Analyze"
          >
            {isLoading
              ? <span className="prompt-submit-spinner" />
              : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )
            }
          </button>
        </div>
      </div>
      <p className="prompt-hint">
        <kbd>Enter</kbd> to analyze &nbsp;&middot;&nbsp; <kbd>Shift+Enter</kbd> for newline
      </p>
    </div>
  );
}