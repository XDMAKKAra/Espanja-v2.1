// Hero — Lara-structure: copy + freemium CTA left, ES/FR/DE course card right.
// No demo in the hero; the grader lives in the #arviointi section one scroll away.
function Hero({ onStart, onSeeDemo }) {
  return (
    <header className="hero">
      <div className="container hero__grid">
        <div className="hero__copy">
          <span className="eyebrow">Lyhyt oppimäärä · YO-koe</span>
          <h1>Varmuutta ylioppilaskokeeseen. Stressitöntä kertausta<span style={{ color: 'var(--brick)' }}>.</span></h1>
          <p className="hero__sub">
            Harjoittele espanjaa, saksaa ja ranskaa lyhyen oppimäärän YO-koetta varten.
            Kirjoitat oikean YO-tyylisen tehtävän, ja me arvioimme tekstisi YTL:n kriteereillä:
            näet missä menetit pisteitä ja miksi.
          </p>
          <div className="hero__cta">
            <button className="btn btn--primary btn--lg" onClick={onStart}>
              Aloita ilmaiseksi <Icon name="arrow-right" />
            </button>
            <button className="btn btn--ghost" onClick={onSeeDemo}>
              Katso miten arviointi toimii <Icon name="arrow-right" style={{ width: 16, height: 16 }} />
            </button>
            <span className="free-note"><Icon name="check" /> Ei maksukorttia, aloitat heti.</span>
          </div>
          <div className="hero__trust">
            <span className="badge"><Icon name="shield-check" /> Rakennettu YTL:n virallisille arviointikriteereille</span>
            <span className="meta">8 kurssia · kaikki koeosiot</span>
          </div>
        </div>
        <div className="hero__art">
          <CourseCard onStart={onStart} />
        </div>
      </div>
    </header>
  );
}
window.Hero = Hero;
