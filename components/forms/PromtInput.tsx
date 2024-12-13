"use client";
import { useState, useEffect } from "react";
import SentimentAnalyzer from "@/app/(root)/response/page";

// Custom hook for debouncing
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);

    return () => clearTimeout(timer); // Cleanup on value or delay change
  }, [value, delay]);

  return debouncedValue;
}

function Prompt() {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const debouncedPrompt = useDebounce(prompt, 500);
  const [submittedPrompt, setSubmittedPrompt] = useState("");

  useEffect(() => {
    if (debouncedPrompt) {
      setIsLoading(false);
      setError(null);
    }
  }, [debouncedPrompt]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!debouncedPrompt.trim()) {
      setError("Prompt cannot be empty.");
      return;
    }

    setIsLoading(true);
    setSubmittedPrompt(debouncedPrompt);

    // Simulate API call or processing delay
    setTimeout(() => {
      setIsLoading(false);
      setError(null); // Reset error if any
    }, 1000);

    setPrompt("");
  };

  return (
    <div className="response-section-And-Input-form">
      <div className="response-section">
        {/* Feedback messages */}
        {error && <p className="error-message">{error}</p>}
        {isLoading && <p>Analyzing sentiment...</p>}
        {/* SentimentAnalyzer only renders if not loading */}
        {!isLoading && submittedPrompt && (
          // <SentimentAnalyzer value={{ promptStr: submittedPrompt }} />
          <SentimentAnalyzer promptStr={submittedPrompt} />
        )}
      </div>
      <div className="form-input">
        <form onSubmit={handleSubmit} className="container">
          <label htmlFor="prompt-input" className="visually-hidden">
            Enter a message to analyze sentiment
          </label>
          <input
            id="prompt-input"
            type="text"
            className="input-group__input"
            placeholder="Message Sentiment Analyzer"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button type="submit" disabled={isLoading || !prompt.trim()}>
            {isLoading ? "Analyzing..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Prompt;
