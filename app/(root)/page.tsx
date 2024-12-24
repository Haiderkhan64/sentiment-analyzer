"use client";
import Prompt from "@/components/forms/PromtInput";
import SentimentAnalyzer from "@/app/(root)/response/page";
import { useGlobalState } from "@/app/context/GlobalStateContext";
import { useEffect, useState } from "react";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const initializeSignIn = async () => {
      try {
        const response = await fetch("../api/user/");
        if (!response.ok) {
          throw new Error(
            `Failed to fetch user data, status: ${response.status}`
          );
        }
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error("Error during sign-in check:", error);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }
        setUserData(null); // Optionally, set to null or show a fallback message
      } finally {
        setIsLoading(false);
      }
    };

    initializeSignIn();
  }, []);

  const { isLoading: globalLoading, error, submittedPrompt } = useGlobalState();

  // Combine the loading states (if necessary)
  const loading = isLoading || globalLoading;

  return (
    <section>
      <div className="prompt-section">
        <div className="response-section">
          {/* Feedback messages */}
          {error && <p className="error-message">{error}</p>}
          {loading && <p>Analyzing sentiment...</p>}

          {/* SentimentAnalyzer only renders if not loading */}
          {!loading && submittedPrompt && (
            <SentimentAnalyzer promptStr={submittedPrompt} />
          )}
        </div>
        <Prompt />
      </div>
    </section>
  );
}
