// Languages — three languages as an editorial list (no flag emoji, no card grid).
function Languages() {
  const langs = [
    { n: '01', name: 'Espanja', meta: 'lyhyt oppimäärä · EAB', status: 'open', tag: 'Avoinna nyt' },
    { n: '02', name: 'Saksa', meta: 'lyhyt oppimäärä · SAB', status: 'soon', tag: 'Syksy 2026' },
    { n: '03', name: 'Ranska', meta: 'lyhyt oppimäärä · RAB', status: 'soon', tag: 'Kevät 2027' },
  ];
  return (
    <section className="section" id="kielet">
      <div className="container">
        <div className="section__head">
          <span className="eyebrow">Kolme kieltä</span>
          <h2>Sama YTL-rubriikki, sama tutori, kolmella kielellä</h2>
          <p>Jokaiselle kielelle oma kurssinsa. Arviointi ja harjoitukset noudattavat
             ylioppilastutkinnon lyhyen oppimäärän vaatimuksia.</p>
        </div>
        <div className="lang-list">
          {langs.map((l) => (
            <div className="lang-row" key={l.name}>
              <span className="lang-row__num num">{l.n}</span>
              <div>
                <span className="lang-row__name">{l.name}</span>
                <span className="lang-row__meta"> · {l.meta}</span>
              </div>
              <div className="lang-row__status">
                {l.status === 'open' ? (
                  <span className="pill" style={{ background: 'var(--pill-green)', color: 'var(--pill-ink-green)' }}>
                    <Icon name="check" style={{ width: 15, height: 15 }} /> {l.tag}
                  </span>
                ) : (
                  <span className="pill" style={{ background: 'var(--pill-yellow)', color: 'var(--pill-ink-yellow)' }}>{l.tag}</span>
                )}
                <Icon name="chevron-right" style={{ color: 'var(--ink-faint)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
window.Languages = Languages;
