"use client";
import { createContext, useState, useContext, ReactNode } from "react";

// Define the types for the state
interface GlobalState {
  isLoading: boolean;
  error: string | null;
  submittedPrompt: string;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSubmittedPrompt: (prompt: string) => void;
}

// Create the context with default values
const GlobalStateContext = createContext<GlobalState | undefined>(undefined);

// Create a provider component
export const GlobalStateProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedPrompt, setSubmittedPrompt] = useState("");

  return (
    <GlobalStateContext.Provider
      value={{
        isLoading,
        error,
        submittedPrompt,
        setIsLoading,
        setError,
        setSubmittedPrompt,
      }}
    >
      {children}
    </GlobalStateContext.Provider>
  );
};

// Custom hook to use the global state
export const useGlobalState = (): GlobalState => {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error("useGlobalState must be used within a GlobalStateProvider");
  }
  return context;
};
