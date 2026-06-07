// Faq — accordion of <details>, hairline dividers, brick chevron.
function Faq() {
  const items = [
    {
      q: 'Onko tekoälyn arviointi luotettava?',
      a: 'Arviointi noudattaa ylioppilastutkintolautakunnan rubriikkia: viestinnällisyys, kielen rakenteet, sanasto ja kokonaisuus. Saat pisteet ja arvosanan samalla asteikolla kuin oikeassa kokeessa, sekä konkreettisen syyn jokaiselle virheelle.',
    },
    {
      q: 'Tarvitsenko opettajan tai oppikirjan rinnalle?',
      a: 'Et tarvitse. Puheo vie sinut tasotestistä kahdeksan kurssin läpi kokeeseen asti. Voit silti tehdä mitä tahansa osa-aluetta milloin haluat vasemmasta valikosta.',
    },
    {
      q: 'Mitä jos en pääse tavoitteeseeni?',
      a: 'Taso nousee suorituksesta, ei ajasta. Jos jokin rakenne tuottaa vaikeuksia, saat lisää harjoituksia juuri siitä ennen etenemistä. Et voi epäonnistua kurssilla, vain hidastua.',
    },
    {
      q: 'Voinko palauttaa maksun?',
      a: 'Voit. Maksun saa takaisin 14 vuorokauden sisällä ilman perusteluja.',
    },
  ];
  return (
    <section className="section" id="ukk">
      <div className="container faq">
        <div className="section__head">
          <span className="eyebrow">Usein kysyttyä</span>
          <h2>Hyvä tietää ennen aloitusta</h2>
        </div>
        {items.map((it, i) => (
          <details key={i} open={i === 0}>
            <summary>
              {it.q}
              <Icon name="chevron-right" className="lucide chev" />
            </summary>
            <p className="faq__a">{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
window.Faq = Faq;

// Footer — ink band, lowercase wordmark.
function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <span className="wordmark">puheo<span className="dot">.</span></span>
        <div className="footer__links">
          <a href="#kielet">Kielet</a>
          <a href="#hinta">Hinnoittelu</a>
          <a href="#ukk">UKK</a>
          <a href="#">Tietosuoja</a>
        </div>
      </div>
    </footer>
  );
}
window.Footer = Footer;
