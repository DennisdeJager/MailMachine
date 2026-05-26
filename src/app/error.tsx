"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="main">
      <section className="panel">
        <h1>Laden mislukt</h1>
        <p className="muted">Het beheerscherm kon niet worden geladen. Probeer opnieuw of controleer de serverlogs.</p>
        <button className="btn btn-primary" onClick={reset}>Opnieuw proberen</button>
      </section>
    </main>
  );
}
