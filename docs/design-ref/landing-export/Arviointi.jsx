// Arviointi — "how grading works". This is where the demo (GraderCard) lives,
// one scroll from the hero. Grading framed as an advantage, in words.
function Arviointi({ onStart }) {
  return (
    <section className="section section--deep" id="arviointi">
      <div className="container arviointi__grid">
        <div className="arviointi__copy">
          <span className="eyebrow">Näin arviointi toimii</span>
          <h2>Arviointi, joka kertoo missä menetit pisteitä</h2>
          <p>
            Opettaja ei ehdi lukea jokaista harjoituskirjoitustasi. Puheo ehtii. Saat saman
            rubriikin mukaisen arvion kuin kokeessa, heti kun painat lähetä.
          </p>
          <ul className="arviointi__steps">
            <li><span className="n num">1</span><span className="t">Kirjoitat <b>oikean YO-tyylisen tehtävän</b> aiheesta, jonka saat valmiina.</span></li>
            <li><span className="n num">2</span><span className="t">Tekoäly arvioi tekstisi YTL:n neljällä kriteerillä: <b>viestinnällisyys, rakenteet, sanasto, kokonaisuus</b>.</span></li>
            <li><span className="n num">3</span><span className="t">Saat <b>pisteytysarvion ja perustelun</b>: jokainen virhe selitetään suomeksi, jotta tiedät mitä korjata.</span></li>
          </ul>
          <button className="btn btn--secondary" onClick={onStart}>Kokeile itse ilmaiseksi <Icon name="arrow-right" /></button>
        </div>
        <div className="arviointi__art">
          <GraderCard />
        </div>
      </div>
    </section>
  );
}
window.Arviointi = Arviointi;

// Coverage — trust built from content, not a demo: what the course covers.
function Coverage() {
  const rows = [
    { i: 'book-marked', h: 'Luetun ymmärtäminen', p: 'Aitojen tekstien kysymykset, tasolta toiselle nousten.' },
    { i: 'list-checks', h: 'Sanasto ja kielioppi', p: 'Aukko- ja monivalintatehtävät, jotka mukautuvat tasoosi.' },
    { i: 'pencil', h: 'Kirjoittaminen ja arviointi', p: 'Lyhyt ja pitkä teksti, arvioituna YTL:n rubriikilla.' },
    { i: 'clock', h: 'Täysi koesimulaatio', p: 'Ajastettu harjoituskoe oikean kokeen rakenteella.' },
  ];
  return (
    <section className="section" id="miten">
      <div className="container">
        <div className="section__head">
          <span className="eyebrow">8 kurssin polku</span>
          <h2>Yksi selkeä reitti tasotestistä kokeeseen</h2>
          <p>Taso nousee suorituksesta, ei ajasta. Kaikki koeosiot ovat mukana, samalla rubriikilla
             kuin oikeassa kokeessa.</p>
        </div>
        <div className="coverage">
          {rows.map((r) => (
            <div className="coverage__row" key={r.h}>
              <Icon name={r.i} />
              <div>
                <h4>{r.h}</h4>
                <p>{r.p}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
window.Coverage = Coverage;
