import { ComplimentApp } from "@/components/ComplimentApp";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col relative">
      {/* Ambient drifting blobs behind everything. */}
      <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
        <div className="blob absolute -top-40 -left-32 w-152 h-152 rounded-full blur-3xl opacity-60 bg-linear-to-br from-peach/50 to-coral/30" />
        <div
          className="blob absolute -bottom-48 -right-32 w-2xl h-168 rounded-full blur-3xl opacity-50 bg-linear-to-tl from-violet/30 to-pink/30"
          style={{ animationDelay: "-10s", animationDuration: "26s" }}
        />
      </div>

      <div className="flex items-center justify-center pt-8 px-4">
        <span className="font-display text-lg tracking-tight text-text-strong">
          LAUDATRON <span aria-hidden>✨</span>
        </span>
      </div>

      <header className="text-center pt-14 pb-10 px-4">
        <p className="inline-flex items-center gap-1.5 grad-primary text-white text-xs font-semibold rounded-full px-3.5 py-1.5 mb-6 shadow-md shadow-coral/20">
          ✨ Powered by unhinged AI
        </p>
        <h1 className="font-display text-5xl sm:text-7xl tracking-tight text-text-strong text-balance">
          The Internet&rsquo;s Most{" "}
          <span className="grad-primary bg-clip-text text-transparent">
            Dramatic
          </span>{" "}
          Compliment Generator
        </h1>
        <p className="mt-6 text-lg text-text-soft max-w-xl mx-auto text-pretty">
          Type a job title or a few details about someone wonderful, and
          receive three hilariously over-the-top compliments — each one
          escalatable to dangerous levels of drama.
        </p>
      </header>
      <ComplimentApp />
      <footer className="text-center pb-8 px-4 text-xs text-text-faint">
        Side effects may include unearned confidence. LAUDATRON accepts no
        liability.
      </footer>
    </main>
  );
}
