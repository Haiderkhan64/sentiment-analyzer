"use client";

import { useEffect, useCallback } from "react";
import { useGlobalState, Session } from "@/app/context/GlobalStateContext";
import { SentimentType, SENTIMENT_COLORS } from "@/app/types/sentiment";

// ─── Date grouping ─────────────────────────────────────────────────────────────

type Group = "Today" | "Yesterday" | "Last 7 days" | "Last 30 days" | "Older";

function getGroup(date: Date): Group {
  const now   = new Date();
  // Midnight of today in local time
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Midnight of the item's date in local time
  const d     = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff  = Math.round((today.getTime() - d.getTime()) / 86_400_000);

  if (diff <= 0)  return "Today";
  if (diff === 1) return "Yesterday";
  if (diff <= 7)  return "Last 7 days";
  if (diff <= 30) return "Last 30 days";
  return "Older";
}

const GROUP_ORDER: Group[] = ["Today", "Yesterday", "Last 7 days", "Last 30 days", "Older"];

function groupSessions(sessions: Session[]) {
  const map = new Map<Group, Session[]>();
  for (const s of sessions) {
    const g = getGroup(new Date(s.createdAt));
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(s);
  }
  return GROUP_ORDER
    .filter(g => map.has(g))
    .map(g => ({ group: g, items: map.get(g)! }));
}

function extractDate(item: Record<string, unknown>, fallback: Date): Date {
  const doc = item._doc as Record<string, unknown> | undefined;
  // MongoDB/Mongoose can return the timestamp under any of these keys
  const candidates = [
    item.createdAt,
    item.updatedAt,
    item.created_at,
    item.updated_at,
    doc?.createdAt,
  ];

  for (const c of candidates) {
    if (!c) continue;
    const d = new Date(c as string);
    if (!isNaN(d.getTime())) return d;
  }
  return fallback;
}

// ─── Sentiment dot ────────────────────────────────────────────────────────────

function Dot({ s }: { s: SentimentType | null }) {
  return (
    <span
      className="leftbar-item-dot"
      style={{ background: s ? SENTIMENT_COLORS[s] : "var(--c-text-3)" }}
    />
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Leftbar() {
  const {
    sessions, setSessions,
    activeSessionId, selectSession,
    startNewSession,
    submittedPrompt,
  } = useGlobalState();

  // ── Hydrate from DB on mount ──────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch("/api/history/fetch-user-history");
        if (!res.ok) return;
        const data = await res.json();

        const raw: Record<string, unknown>[] =
          Array.isArray(data.history) ? data.history : [];

        // 🔍 Debug: log what the API actually returns so you can verify fields
        if (raw.length > 0) {
          console.log("[Leftbar] first history item keys:", Object.keys(raw[0]));
          console.log("[Leftbar] first item:", raw[0]);
        }

        setSessions(prev => {
          if (prev.length > 0) return prev; // don't overwrite live sessions
          return raw
            .filter(item => item.prompt)
            .map((item, i) => {
              // Stagger fallback: each item 1 day apart so grouping is visible
              const fallback = new Date(Date.now() - i * 86_400_000);
              const createdAt = extractDate(item, fallback);

              return {
                id: `db-${i}-${createdAt.getTime()}`,
                prompt: item.prompt as string,
                response: Array.isArray(item.response) ? item.response as string[] : [],
                sentimentData: null,
                createdAt,
              };
            });
        });
      } catch (e) {
        console.error("[Leftbar] fetch error:", e);
      }
    };
    load();
  }, [setSessions]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSelect = useCallback((session: Session) => {
    selectSession(session.id);
  }, [selectSession]);

  const handleDelete = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) selectSession(null);
  }, [setSessions, activeSessionId, selectSession]);

  const grouped = groupSessions(sessions);
  const hasLivePrompt = !!submittedPrompt && !activeSessionId;

  return (
    <aside className="leftbar">
      <div className="leftbar-inner">

        <button className="leftbar-new-btn" onClick={startNewSession}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          New analysis
        </button>

        {hasLivePrompt && (
          <div className="leftbar-live">
            <span className="leftbar-live-pulse" />
            <span className="leftbar-live-label">{submittedPrompt.slice(0, 32)}&hellip;</span>
          </div>
        )}

        {sessions.length === 0 && !hasLivePrompt && (
          <div className="leftbar-empty-state">
            <p>Analyses will appear here</p>
          </div>
        )}

        {grouped.map(({ group, items }) => (
          <div key={group} className="leftbar-group">
            <div className="leftbar-group-label">{group}</div>
            <nav className="leftbar-nav">
              {items.map(session => {
                const isActive = session.id === activeSessionId;
                const label = session.prompt.length > 36
                  ? session.prompt.slice(0, 35) + "\u2026"
                  : session.prompt;
                return (
                  <div
                    key={session.id}
                    className={`leftbar-item${isActive ? " leftbar-item--active" : ""}`}
                    onClick={() => handleSelect(session)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === "Enter" && handleSelect(session)}
                    title={session.prompt}
                  >
                    <Dot s={session.sentimentData?.overallSentiment ?? null} />
                    <span className="leftbar-item-label">{label}</span>
                    <button
                      className="leftbar-item-delete"
                      onClick={e => handleDelete(e, session.id)}
                      aria-label="Delete"
                      tabIndex={-1}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                );
              })}
            </nav>
          </div>
        ))}

      </div>
    </aside>
  );
}