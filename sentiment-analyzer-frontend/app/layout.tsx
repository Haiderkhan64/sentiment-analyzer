// app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";
import { GlobalStateProvider } from "@/app/context/GlobalStateContext";

import { dark } from "@clerk/themes";

import ClientLayout from "@/components/layout/ClientLayout";

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
          <ClientLayout>{children}</ClientLayout>
        </html>
      </GlobalStateProvider>
    </ClerkProvider>
  );
}
