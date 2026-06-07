// Pricing — canonical naming: free start, Treeni 9 €/kk, Kurssi 49 € (per language).
// Stripe is not live; paid CTAs are lead-capture, free start works today.
function Pricing({ onStart }) {
  return (
    <section className="section section--deep" id="hinta">
      <div className="container">
        <div className="section__head">
          <span className="eyebrow">Hinnoittelu</span>
          <h2>Aloita ilmaiseksi, maksa vasta kun Puheo auttaa</h2>
          <p>Ilmainen aloitus toimii heti, ilman maksukorttia. Maksulliset tasot voi perua
             milloin vain.</p>
        </div>
        <div className="price-grid">
          <div className="price-card">
            <h3>Aloita ilmaiseksi</h3>
            <div className="price-card__price"><span className="amt num">0 €</span><span className="per">aina</span></div>
            <p className="price-card__desc">Kokeile sanastoa ja kielioppia ilman tiliä.</p>
            <ul>
              <li><Icon name="check" /> Sanasto- ja kielioppiharjoitukset</li>
              <li><Icon name="check" /> Tasotesti ja päivän tehtävät</li>
              <li className="muted"><Icon name="minus" /> Ei tekoälyarviointia</li>
              <li className="muted"><Icon name="minus" /> Ei koesimulaatiota</li>
            </ul>
            <button className="btn btn--secondary btn--block" onClick={onStart}>Aloita ilmaiseksi</button>
          </div>

          <div className="price-card">
            <h3>Treeni</h3>
            <div className="price-card__price"><span className="amt num">9 €</span><span className="per">/ kk</span></div>
            <p className="price-card__desc">Koko harjoittelu ja arviointi, kuukausi kerrallaan.</p>
            <ul>
              <li><Icon name="check" /> Kaikki ilmaistason sisältö</li>
              <li><Icon name="check" /> Tekoälyn YTL-rubriikkiarviointi</li>
              <li><Icon name="check" /> Kertausjono ja adaptiiviset tehtävät</li>
              <li><Icon name="check" /> Peru milloin vain</li>
            </ul>
            <button className="btn btn--secondary btn--block" onClick={onStart}>Aloita Treeni</button>
          </div>

          <div className="price-card price-card--pro">
            <span className="price-card__pop pill" style={{ background: 'var(--brick)', color: 'var(--brick-ink)' }}>Suosituin</span>
            <h3>Kurssi</h3>
            <div className="price-card__price"><span className="amt num">49 €</span><span className="per">/ kokeeseen asti</span></div>
            <p className="price-card__desc">Koko 8 kurssin polku yhdelle kielelle.</p>
            <ul>
              <li><Icon name="check" /> Kaikki Treenin sisältö</li>
              <li><Icon name="check" /> 8 kurssin ohjattu polku</li>
              <li><Icon name="check" /> Täysi koesimulaatio</li>
              <li><Icon name="check" /> Kertamaksu, ei tilausta</li>
            </ul>
            <button className="btn btn--primary btn--block" onClick={onStart}>Varaa paikka <Icon name="arrow-right" /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
window.Pricing = Pricing;
