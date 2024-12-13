// app/(auth)/layout.tsx
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import "@/app/(auth)/style.css";
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth">
      <main>{children}</main>
    </div>
  );
}
