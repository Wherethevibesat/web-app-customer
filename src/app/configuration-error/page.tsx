import { getEnvStatus } from "@/lib/supabase/env";

const VARS = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", required: true },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true },
  { key: "NEXT_PUBLIC_SITE_URL", required: false },
] as const;

export default function ConfigurationErrorPage() {
  const status = getEnvStatus();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <a href="/" className="mb-8 text-lg font-bold">
        Where The Vibes At
      </a>
      <div className="w-full max-w-lg rounded-xl border border-wtva-dark-300 bg-wtva-card p-8">
        <h1 className="text-2xl font-bold">Configuration required</h1>
        <p className="mt-3 text-sm text-wtva-muted">
          Add Supabase env vars in Vercel (copy from local <code>.env.local</code>), then redeploy.
        </p>
        <ul className="mt-6 space-y-2 text-sm">
          {VARS.map(({ key, required }) => {
            const ok = status[key as keyof typeof status];
            return (
              <li key={key} className="flex justify-between rounded-lg border border-wtva-dark-300 px-4 py-2">
                <code className="text-xs">{key}</code>
                <span className={ok ? "text-green-400" : "text-red-400"}>
                  {ok ? "Set" : required ? "Missing" : "Optional"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
