import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignOutButton } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
// import { dark } from "@clerk/themes";
const TopBar = () => {
  return (
    <nav className="topbar">
      <Link href="/" className="logo">
        <Image src="/assets/logo.svg" alt="logo" width={28} height={28} />
        <p className="logo-text">Sentiment analyzer</p>
      </Link>

      <div className="logout-and-user-btn">
        <div className="logout">
          <SignedIn>
            <SignOutButton>
              <div className="logout-logo">
                <Image
                  src="/assets/logout.svg"
                  alt="logout"
                  width={24}
                  height={24}
                />
              </div>
            </SignOutButton>
          </SignedIn>
        </div>
        <div className="usr-btn">
          <UserButton />
        </div>
      </div>
    </nav>
  );
};
export default TopBar;
