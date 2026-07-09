"use client";

import { usePathname } from "next/navigation";
import Topbar from "@/components/shared/Topbar";
import Leftbar from "@/components/shared/Leftbar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage =
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up");

  if (isAuthPage) {
    return <body>{children}</body>;
  }

  return (
    <body>
      {/* Topbar spans full width above everything */}
      <Topbar />

      {/*
        .main-container: flex row, full width, height = 100vh - topbar
          ├── .leftbar (fixed width, flex-shrink:0)
          └── .content-wrapper (flex:1, fills remaining space)
      */}
      <div className="main-container">
        <Leftbar />
        <div className="content-wrapper">
          {children}
        </div>
      </div>
    </body>
  );
}