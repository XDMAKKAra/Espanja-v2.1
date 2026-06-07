// Sidebar — app navigation rail (desktop).
function Sidebar({ active, onNav, onHome }) {
  const items = [
    { id: 'dashboard', label: 'Etusivu', icon: 'home' },
    { id: 'path', label: 'Oppimispolku', icon: 'route' },
    { id: 'vocab', label: 'Sanasto', icon: 'book-open' },
    { id: 'grammar', label: 'Kielioppi', icon: 'list-checks' },
    { id: 'writing', label: 'Kirjoittaminen', icon: 'pencil' },
    { id: 'reading', label: 'Lukeminen', icon: 'book-marked' },
    { id: 'exam', label: 'Koesimulaatio', icon: 'clock' },
  ];
  return (
    <aside className="sidebar">
      <button className="wordmark sidebar__brand" onClick={onHome} style={{ background: 'none', border: 'none', textAlign: 'left' }}>
        puheo<span className="dot">.</span>
      </button>
      <nav className="sidebar__nav">
        {items.map((it) => (
          <button key={it.id} className="snav" data-active={active === it.id}
            onClick={() => onNav(it.id)}>
            <Icon name={it.icon} /> {it.label}
          </button>
        ))}
      </nav>
      <div className="sidebar__foot">
        <span className="avatar">M</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Mona</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-subtle)' }}>Mestari · espanja</div>
        </div>
      </div>
    </aside>
  );
}
window.Sidebar = Sidebar;

// Dashboard — editorial: eyebrow → greeting → grade card → mode cards → weak topics.
function Dashboard({ onStartVocab }) {
  return (
    <div className="appmain">
      <div className="dash-head">
        <div>
          <span className="eyebrow">Päivä 23 · putki 6 päivää</span>
          <h1>Hei, Mona<span style={{ color: 'var(--brick)' }}>.</span></h1>
          <p className="sub">Eilen preteriti sujui hyvin. Tänään mennään imperfektiin.</p>
        </div>
        <span className="pill" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--ink-muted)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brick)' }} />
          YO 28.9.2026 · <span className="num" style={{ color: 'var(--brick)' }}>&nbsp;163 päivää</span>
        </span>
      </div>

      <div className="dash-grade">
        <div>
          <span className="eyebrow">Arvioitu taso juuri nyt</span>
          <div className="big num">13 / 20 <span className="arvosana">· arvosana E</span></div>
          <div className="progress"><span style={{ width: '62%' }} /></div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-subtle)', marginTop: 8 }}>Tavoite M · noin 3 viikkoa nykyvauhdilla</div>
        </div>
        <button className="btn btn--primary" onClick={onStartVocab}>Jatka harjoittelua <Icon name="arrow-right" /></button>
      </div>

      <div className="mode-grid">
        <button className="mode-card" onClick={onStartVocab}>
          <div className="mode-card__top"><Icon name="book-open" /><h3>Sanasto</h3></div>
          <div className="meta">Taso C · 142 sanaa hallussa</div>
          <span className="go">Jatka 20 sanaa <Icon name="arrow-right" style={{ width: 15, height: 15 }} /></span>
        </button>
        <button className="mode-card" onClick={onStartVocab}>
          <div className="mode-card__top"><Icon name="list-checks" /><h3>Kielioppi</h3></div>
          <div className="meta">Taso C · imperfekti tänään</div>
          <span className="go">Jatka 38 harjoitusta <Icon name="arrow-right" style={{ width: 15, height: 15 }} /></span>
        </button>
        <button className="mode-card" onClick={onStartVocab}>
          <div className="mode-card__top"><Icon name="pencil" /><h3>Kirjoittaminen</h3></div>
          <div className="meta">Viimeksi 13 / 20 · arvosana E</div>
          <span className="go">Uusi tehtävä <Icon name="arrow-right" style={{ width: 15, height: 15 }} /></span>
        </button>
        <button className="mode-card" onClick={onStartVocab}>
          <div className="mode-card__top"><Icon name="book-marked" /><h3>Lukeminen</h3></div>
          <div className="meta">Taso C · matkablogi</div>
          <span className="go">Aloita kysymykset <Icon name="arrow-right" style={{ width: 15, height: 15 }} /></span>
        </button>
      </div>

      <div className="section-h">
        <h2>Heikoimmat aiheet</h2>
        <a href="#" onClick={(e) => e.preventDefault()}>Katso kaikki</a>
      </div>
      <div className="weak-list">
        {[
          { n: '01', name: 'Preteriti vs imperfekti', meta: 'kielioppi · C', right: 'oikein 11 / 20' },
          { n: '02', name: 'Subjunktiivin preesens', meta: 'kielioppi · C', right: 'oikein 6 / 12' },
          { n: '03', name: 'Matkailusanasto', meta: 'sanasto · C', right: 'oikein 14 / 20' },
        ].map((w) => (
          <div className="weak-row" key={w.n}>
            <span className="wnum num">{w.n}</span>
            <div>
              <span className="wname">{w.name}</span>
              <span className="wmeta"> · {w.meta}</span>
            </div>
            <span className="wright num">{w.right}</span>
            <Icon name="chevron-right" style={{ color: 'var(--ink-faint)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
window.Dashboard = Dashboard;
