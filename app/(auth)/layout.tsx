// app/(auth)/layout.tsxss
import "@/app/(auth)/style.css";
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-container">
      <main className="main-auth">{children}</main>
    </div>
  );
}
