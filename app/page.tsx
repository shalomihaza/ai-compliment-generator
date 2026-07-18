import { ComplimentApp } from "@/components/ComplimentApp";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <header className="text-center pt-16 pb-10 px-4">
        <p className="text-xs uppercase tracking-[0.4em] text-paper/50 mb-4">
          Bureau of Industrial-Grade Compliments
        </p>
        <h1 className="font-display text-5xl sm:text-6xl tracking-tight">
          LAUDATRON
        </h1>
        <p className="mt-4 text-sm text-paper/60 max-w-md mx-auto">
          Three brand-compliant, wildly enthusiastic compliments per request.
          Escalate at your own risk.
        </p>
      </header>
      <ComplimentApp />
      <footer className="text-center pb-8 px-4 text-xs text-paper/30">
        All compliments audited against Compliment Style Guidelines v2.1.
      </footer>
    </main>
  );
}
