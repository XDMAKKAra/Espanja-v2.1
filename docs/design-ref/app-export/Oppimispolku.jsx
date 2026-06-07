// Oppimispolku — learning path overview. 8 course rows; course 1 active, 2–8 locked.
const KURSSIT = [
  { n: 1, title: 'Kurssi 1: Kuka olen', desc: 'Preesens säännölliset, ser/estar perusteet, persoona ja perhe.', active: true },
  { n: 2, title: 'Kurssi 2: Arki ja elämä', desc: 'Preesens epäsäännölliset, gustar-rakenne, koti ja ruoka.' },
  { n: 3, title: 'Kurssi 3: Mitä tein', desc: 'Preteriti säännölliset ja yleisimmät epäsäännölliset, matkustamisen sanasto.' },
  { n: 4, title: 'Kurssi 4: Ennen ja nyt', desc: 'Imperfekti ja preteriti vs imperfekti: YO-klassikko, lapsuus ja muistot.' },
  { n: 5, title: 'Kurssi 5: Tulevaisuus ja unelmat', desc: 'Futuuri ja konditionaali, työ ja teknologia.' },
  { n: 6, title: 'Kurssi 6: Maailman ongelmat', desc: 'Subjunktiivin preesens (ojalá, es importante que), ympäristö ja yhteiskunta.' },
  { n: 7, title: 'Kurssi 7: Mielipiteet ja media', desc: 'Subjunktiivin laajennus, argumentointi ja mielipidetekstit.' },
  { n: 8, title: 'Kurssi 8: Kohti koetta', desc: 'Kertaus kaikista aikamuodoista ja koko mallikoe-simulaatio.' },
];

function PathIllu() {
  // Subtle winding route: two milestone dots, one done check, a flag at the end.
  return (
    <svg className="lp-illu" width="186" height="92" viewBox="0 0 186 92" fill="none" aria-hidden="true">
      <path d="M8 76 C 44 76, 40 30, 78 30 S 130 64, 158 26" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeDasharray="2 9" />
      <circle cx="8" cy="76" r="9" fill="var(--bg-card)" stroke="var(--success)" strokeWidth="2.5" className="done" />
      <path d="M4.5 76 L7 78.5 L11.5 73.5" stroke="var(--success)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="78" cy="30" r="6" fill="var(--bg-card)" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="120" cy="48" r="5" fill="var(--bg-card)" stroke="currentColor" strokeWidth="2.5" />
      <g className="flag">
        <path d="M158 26 V 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M158 9 h 16 l -4 6 l 4 6 h -16 z" fill="currentColor" />
      </g>
    </svg>
  );
}

function Oppimispolku({ onOpenCourse, onHome }) {
  return (
    <div className="appmain">
      <nav className="crumbs">
        <button onClick={onHome}>Aloitus</button>
        <span className="sep">/</span>
        <span className="here">Oppimispolku</span>
      </nav>
      <div className="lp-head">
        <div>
          <span className="eyebrow">Espanja · YO-koevalmennus</span>
          <h1>Oppimispolku</h1>
          <p className="sub">8 kurssia · 0 suoritettu · Etene järjestyksessä.</p>
        </div>
        <PathIllu />
      </div>

      <div className="lp-list">
        {KURSSIT.map((k) => k.active ? (
          <button key={k.n} className="lp-row lp-row--active" onClick={onOpenCourse}>
            <span className="lp-row__num num">{k.n}</span>
            <div>
              <div className="lp-row__title">{k.title}</div>
              <div className="lp-row__desc">{k.desc}</div>
            </div>
            <span className="lp-row__status">
              <span className="pill" style={{ background: 'var(--brick)', color: 'var(--brick-ink)' }}>
                <span className="num">1 / 10</span> oppituntia
              </span>
              <Icon name="chevron-right" style={{ color: 'var(--brick)' }} />
            </span>
          </button>
        ) : (
          <div key={k.n} className="lp-row lp-row--locked">
            <span className="lp-row__num num">{k.n}</span>
            <div>
              <div className="lp-row__title">{k.title}</div>
              <div className="lp-row__desc">{k.desc}</div>
            </div>
            <span className="lp-row__lock"><Icon name="lock" /> Avautuu vuorollaan</span>
          </div>
        ))}
      </div>
    </div>
  );
}
window.Oppimispolku = Oppimispolku;
