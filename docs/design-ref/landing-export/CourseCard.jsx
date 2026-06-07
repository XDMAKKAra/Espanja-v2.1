// CourseCard — hero purchase card in the "Lara" structure. ES/FR/DE selector
// changes status + context; freemium primary CTA + lead-capture secondary.
// Product naming: free start works now; Kurssi 49 € / Treeni 9 €/kk.
function CourseCard({ onStart }) {
  const langs = {
    es: { name: 'Espanja', open: true,  status: 'Avoinna nyt',        lead: 'Varaa paikka · 49 €' },
    de: { name: 'Saksa',   open: false, status: 'Aukeaa syksyllä 2026', lead: 'Ilmoita kun saksa aukeaa' },
    fr: { name: 'Ranska',  open: false, status: 'Aukeaa keväällä 2027', lead: 'Ilmoita kun ranska aukeaa' },
  };
  const [active, setActive] = React.useState('es');
  const l = langs[active];

  return (
    <div className="coursecard" aria-label="Valitse kieli ja aloita">
      <div className="coursecard__tabs" role="tablist">
        {Object.keys(langs).map((k) => (
          <button key={k} role="tab" data-active={active === k} onClick={() => setActive(k)}>
            {langs[k].name}
          </button>
        ))}
      </div>
      <div className="coursecard__body">
        <span className={'coursecard__status ' + (l.open ? 'open' : 'soon')}>
          {l.open
            ? <React.Fragment><Icon name="check" style={{ width: 15, height: 15 }} /> {l.status}</React.Fragment>
            : l.status}
        </span>

        <div className="coursecard__price">
          <span className="amt num">49 €</span>
          <span className="per">kurssi · kokeeseen asti</span>
        </div>
        <div className="coursecard__alt">tai <b>Treeni 9 €/kk</b>, kuukausi kerrallaan</div>

        <ul className="coursecard__incl">
          <span className="lbl">Mitä sisältyy</span>
          <li><Icon name="check" /> 8 kurssin polku tasotestistä kokeeseen</li>
          <li><Icon name="check" /> YTL-mukaiset tehtävät kaikista koeosioista</li>
          <li><Icon name="check" /> Tekoälyn kirjoitusarviointi YTL:n kriteereillä</li>
          <li><Icon name="check" /> Sanasto, kielioppi ja kertausjono</li>
          <li><Icon name="check" /> Täysi koesimulaatio</li>
        </ul>

        <div className="coursecard__cta">
          <button className="btn btn--primary btn--block btn--lg" onClick={onStart}>
            Aloita ilmaiseksi <Icon name="arrow-right" />
          </button>
          <button className="coursecard__lead" onClick={onStart}>
            {!l.open && <Icon name="bell" style={{ width: 16, height: 16 }} />}
            {l.lead}
          </button>
        </div>
      </div>
    </div>
  );
}
window.CourseCard = CourseCard;
