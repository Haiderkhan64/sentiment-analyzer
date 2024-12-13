// app/layout.tsx

import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";

// import "../../app/globals.css";
import Topbar from "@/components/shared/Topbar";
import { dark } from "@clerk/themes";

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
      <html lang="en">
        <body>
          <Topbar />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
