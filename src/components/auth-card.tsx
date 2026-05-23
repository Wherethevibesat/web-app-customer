export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4">
      <div className="rounded-2xl border border-wtva-dark-300 bg-wtva-card p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-center">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-center text-sm text-wtva-muted">{subtitle}</p>
        )}
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
