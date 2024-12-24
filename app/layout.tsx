// app/layout.tsx

import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";
import { GlobalStateProvider } from "@/app/context/GlobalStateContext";
import Topbar from "@/components/shared/Topbar";
import { dark } from "@clerk/themes";
import Leftbar from "@/components/shared/Leftbar";

export const metadata: Metadata = {
  title: "Sentiment Analyzer",
  description: "A sentiment analysis application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
    >
      <GlobalStateProvider>
        <html lang="en">
          <body>
            <Topbar />
            <main>
              <Leftbar />
              <div className="main-container">
                <div className="content-wrapper">{children}</div>
              </div>
            </main>
          </body>
        </html>
      </GlobalStateProvider>
    </ClerkProvider>
  );
}
