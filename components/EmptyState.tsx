export function EmptyState() {
  return (
    <div className="mt-16 text-center">
      <div aria-hidden className="relative w-40 h-32 mx-auto">
        <div className="float absolute left-2 top-2 w-24 h-24 rounded-full blur-2xl bg-coral/40" />
        <div
          className="float absolute right-0 top-6 w-20 h-20 rounded-full blur-2xl bg-violet/35"
          style={{ animationDelay: "-2s" }}
        />
        <div
          className="float absolute left-12 bottom-0 w-20 h-20 rounded-full blur-2xl bg-peach/50"
          style={{ animationDelay: "-4s" }}
        />
        <span className="float absolute inset-0 flex items-center justify-center text-4xl">
          ✨
        </span>
      </div>
      <p className="mt-6 font-display text-xl text-text-strong text-balance">
        Ready to manufacture unreasonable levels of professional confidence?
      </p>
      <p className="mt-2 text-sm text-text-faint">
        Type a job title above, or grab a suggestion.
      </p>
    </div>
  );
}
