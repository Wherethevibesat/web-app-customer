import { ConciergeWidget } from "@/components/concierge-widget";

export default function DiscoverConciergePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Vibes Concierge</h1>
        <p className="mt-2 text-sm text-wtva-muted md:text-base">
          Ask for event and venue recommendations by vibe, neighborhood, budget, and timing.
        </p>
      </div>
      <ConciergeWidget floating={false} />
    </main>
  );
}
