import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-zinc-950 text-white">
      <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        FEDGE 2.0 Music Division
      </h1>
      <p className="mt-4 text-zinc-400 text-lg">
        The intelligent operating system for artists and teams.
      </p>

      <div className="mt-10">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all">
              Sign In to Portal
            </button>
          </SignInButton>
        </SignedOut>
        
        <SignedIn>
          <div className="flex flex-col items-center gap-4">
            <UserButton afterSignOutUrl="/" />
            <Link 
              href="/dashboard"
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-all"
            >
              Enter Dashboard
            </Link>
          </div>
        </SignedIn>
      </div>
    </main>
  );
}
