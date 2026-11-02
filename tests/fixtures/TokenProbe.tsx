/**
 * Test-only component built exclusively from semantic utilities (T05 acceptance).
 * tests/unit/tokens.test.ts compiles these classes and proves their appearance
 * is determined only by src/styles/tokens.css. Never rendered on the site.
 */
export function TokenProbe() {
  return (
    <section data-character="trip" className="bg-surface text-text p-8 rounded-card shadow-raised">
      <h2 className="font-display text-h2 text-heading">[תוכן יתווסף]</h2>
      <p className="font-body text-body text-text-muted max-w-measure ps-4 pe-4">[תוכן יתווסף]</p>
      <a
        href="#main"
        className="tap-target inline-flex items-center gap-2 rounded-control bg-cta text-cta-text hover:bg-cta-hover border border-border transition-colors duration-base ease-standard"
      >
        [תוכן יתווסף]
      </a>
      <span className="text-accent bg-accent-subtle text-small">[תוכן יתווסף]</span>
    </section>
  )
}
