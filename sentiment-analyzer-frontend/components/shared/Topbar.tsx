import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignOutButton, UserButton } from "@clerk/nextjs";

export default function Topbar() {
  return (
    <header className="topbar">
      <Link href="/" className="topbar-logo">
        <Image src="/assets/logo.svg" alt="logo" width={26} height={26} className="topbar-logo-img" />
        <span className="topbar-logo-text">Sentiment<span className="topbar-logo-accent">AI</span></span>
      </Link>

      <div className="topbar-actions">
        <SignedIn>
          <SignOutButton>
            <button className="topbar-logout" aria-label="Sign out">
              <Image src="/assets/logout.svg" alt="logout" width={18} height={18} />
            </button>
          </SignOutButton>
        </SignedIn>
        <UserButton />
      </div>
    </header>
  );
}