export default function Page() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl text-center">
        <p className="kicker mb-4">ServeFlow</p>
        <h1 className="serif text-4xl md:text-6xl text-ink mb-6 leading-1.1">
          Business operations, simplified.
        </h1>
        <p className="text-muted text-lg mb-8 max-w-lg mx-auto leading-relaxed">
          Premium multi-tenant operations and appointment booking platform for
          service businesses. Built by Zentravi.
        </p>
        <nav className="flex justify-center gap-4 text-sm">
          <a
            href="/docs"
            className="border border-border px-4 py-2 rounded-sm hover:bg-surface transition-colors"
          >
            Documentation
          </a>
        </nav>
      </div>
    </main>
  );
}
