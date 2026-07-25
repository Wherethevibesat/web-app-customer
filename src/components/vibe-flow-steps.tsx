const STEPS = ["Preview", "Build", "Pay"] as const;

export type VibeFlowStep = 0 | 1 | 2;

/** Shared Preview → Build → Pay progress for the vibe booking flow. */
export function VibeFlowSteps({ step }: { step: VibeFlowStep }) {
  return (
    <nav aria-label="Booking progress" className="mb-5 flex flex-wrap gap-2">
      {STEPS.map((label, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <span
            key={label}
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              active
                ? "bg-accent-gradient text-white"
                : done
                  ? "bg-accent/15 text-accent"
                  : "bg-wtva-dark-400 text-wtva-muted"
            }`}
          >
            {done ? "✓ " : `${i + 1}. `}
            {label}
          </span>
        );
      })}
    </nav>
  );
}
