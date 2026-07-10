"use client";
import {
  createContext,
  useState,
  useContext,
  useCallback,
  ReactNode,
} from "react";
import { SentimentData } from "@/app/types/sentiment";

export interface Session {
  id: string;
  prompt: string;
  response: string[];
  sentimentData: SentimentData | null;
  createdAt: Date;
}

interface GlobalState {
  submittedPrompt: string;
  submitNewPrompt: (p: string) => void;   // from input box — clears active session
  setSubmittedPrompt: (p: string) => void; // raw — does NOT clear active session

  sessions: Session[];
  addSession: (s: Session) => void;
  setSessions: (s: Session[] | ((prev: Session[]) => Session[])) => void;

  activeSessionId: string | null;
  selectSession: (id: string | null) => void; // sidebar click — clears prompt
  activeSession: Session | null;

  startNewSession: () => void;

  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
  error: string | null;
  setError: (v: string | null) => void;

  newChat: boolean;
  setNewChat: (v: boolean) => void;
  responseArray: string[];
  setResponseArray: (v: string[]) => void;
}

const Ctx = createContext<GlobalState | undefined>(undefined);

export const GlobalStateProvider = ({ children }: { children: ReactNode }) => {
  const [submittedPrompt, setPromptRaw]   = useState("");
  const [sessions, setSessions]           = useState<Session[]>([]);
  const [activeSessionId, setActiveId]    = useState<string | null>(null);
  const [isLoading, setIsLoading]         = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [newChat, setNewChat]             = useState(false);
  const [responseArray, setResponseArray] = useState<string[]>([]);

  // New prompt typed in the input — deselects any sidebar item
  const submitNewPrompt = useCallback((p: string) => {
    setActiveId(null);
    setPromptRaw(p);
  }, []);

  // Raw prompt setter — does NOT touch activeSessionId
  const setSubmittedPrompt = useCallback((p: string) => {
    setPromptRaw(p);
  }, []);

  // Sidebar item clicked — selects that session and clears the live prompt
  const selectSession = useCallback((id: string | null) => {
    setActiveId(id);
    setPromptRaw(""); // clear raw only, NOT through submitNewPrompt
  }, []);

  // Analysis complete → push session to list, auto-select it
  const addSession = useCallback((s: Session) => {
    setSessions(prev => [s, ...prev]);
    setActiveId(s.id);
    setPromptRaw("");
  }, []);

  // "New analysis" button
  const startNewSession = useCallback(() => {
    setActiveId(null);
    setPromptRaw("");
    setNewChat(true);
    setTimeout(() => setNewChat(false), 0);
  }, []);

  const activeSession = sessions.find(s => s.id === activeSessionId) ?? null;

  return (
    <Ctx.Provider value={{
      submittedPrompt, submitNewPrompt, setSubmittedPrompt,
      sessions, addSession, setSessions,
      activeSessionId, selectSession, activeSession,
      startNewSession,
      isLoading, setIsLoading,
      error, setError,
      newChat, setNewChat,
      responseArray, setResponseArray,
    }}>
      {children}
    </Ctx.Provider>
  );
};

export const useGlobalState = (): GlobalState => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGlobalState must be used within GlobalStateProvider");
  return ctx;
};