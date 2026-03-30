export default function SuccessPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 bg-zinc-950 text-zinc-50">
      <div className="w-full max-w-md text-center flex flex-col items-center gap-6">
        <div className="text-7xl">🎉</div>
        <h1 className="text-3xl font-extrabold text-zinc-100">Payment successful!</h1>
        <p className="text-zinc-400 leading-relaxed">
          Welcome to <span className="text-indigo-400 font-semibold">FastVid Pro</span>!
          Your subscription is now active.
        </p>
        <div className="w-full p-5 rounded-2xl bg-zinc-900 border border-zinc-800 text-left flex flex-col gap-3">
          <p className="text-sm text-zinc-300 font-semibold">What you unlocked:</p>
          <ul className="text-sm text-zinc-400 space-y-2">
            {[
              "Videos up to 3 hours long",
              "Priority server queue",
              "Up to 4x speed with pitch correction",
              "Batch processing (multiple files)",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="text-indigo-400">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-zinc-600">
          Questions? Write us at{" "}
          <a href="mailto:myappsense@gmail.com" className="text-zinc-400 hover:text-zinc-200 underline">
            myappsense@gmail.com
          </a>
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          ⚡ Start using FastVid Pro
        </a>
      </div>
    </main>
  );
}
