import BrandLogo from "@/components/BrandLogo";
import Link from "next/link";
import { SignedIn, SignInButton, SignOutButton } from "@clerk/nextjs"

export default function NavBar() {
  return (
    <header className="flex py-6 shadow-xl fixed top-0 w-full z-10 bg-background/95">
      <nav className="flex items-center gap-10 container font-semibold">
        <Link href="/" className="mr-auto">
          <BrandLogo />
        </Link>
        <Link href="#" className="text-lg">
          Features
        </Link>
        <Link href="/#pricing" className="text-lg">
          Pricing
        </Link>
        <Link href="#" className="text-lg">
          About
        </Link>
        <span className="text-lg">
          <SignedIn>
            <Link href="/dashboard">Dashboard</Link>
          </SignedIn>
          <SignOutButton>
            <SignInButton>Login</SignInButton>
          </SignOutButton>
        </span>
      </nav>
    </header>
  )
}
