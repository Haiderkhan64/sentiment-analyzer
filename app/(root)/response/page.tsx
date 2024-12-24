"use client";
import { useEffect, useState } from "react";

interface SentimentAnalyzerProps {
  promptStr?: string;
}

interface ApiResponse {
  result?: string;
  error?: string;
}

function SentimentAnalyzer({ promptStr = "" }: SentimentAnalyzerProps) {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseArray, setResponseArray] = useState([""]);

  useEffect(() => {
    if (!promptStr.trim()) {
      return; // Don't proceed if the promptStr is empty or only contains whitespace
    }

    async function fetchSentiment() {
      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const response = await fetch(
          process.env.NEXT_PUBLIC_API_URL ||
            "http://127.0.0.1:8000/api/analyze/",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text: promptStr.trim() }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Handle streaming response if supported
        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let done = false;
          let fullResult = "";

          while (!done) {
            const { value, done: isDone } = await reader.read();
            done = isDone;
            if (value) {
              const chunk = decoder.decode(value, { stream: true });
              fullResult += chunk;
              setResult(fullResult);
            }
          }
          // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
          // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
          const pushResponeToArr = () => {
            setResponseArray([...responseArray, fullResult]);

            localStorage.setItem("response", JSON.stringify(responseArray));
            // const value: string[] | null = localStorage.getItem("response");
            const value: string[] | null = JSON.parse(
              localStorage.getItem("response") || "null"
            );
            if (value) {
              console.log("-------->", value); // "value"
            }
            {
              console.log("No response");
            }
          };
          pushResponeToArr();

          // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
          // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
        } else {
          // Fallback for non-streaming responses
          const data: ApiResponse = await response.json();
          setResult(data.result || "No result available");
        }
      } catch (err: any) {
        const errorMessage = err.message.includes("Failed to fetch")
          ? "Unable to reach the server. Please check your network."
          : `Error: ${err.message || "An unknown error occurred."}`;
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchSentiment();
  }, [promptStr]);
  // console.log(responseArray);

  return (
    <div>
      <h1>Sentiment Analysis Result</h1>
      {loading && <p>Loading...</p>}
      {error && (
        <p className="error-message" style={{ color: "red" }}>
          Error: {error}
        </p>
      )}
      {result && (
        <div
          className="analysis-result"
          style={{
            border: "1px solid #ccc",
            padding: "1em",
            borderRadius: "5px",
            marginTop: "1em",
          }}
        >
          <strong>Analysis Result:</strong>
          {/* <p>{responseArray.forEach(()=>{})}</p> */}
          <p
            style={{
              border: "5px solid #cac",
            }}
          >
            {/* {typeof responseArray} */}
          </p>
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
}

export default SentimentAnalyzer;
