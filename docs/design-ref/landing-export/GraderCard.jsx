// GraderCard — Puheo's hero artifact. A real marked-up student answer with
// hovered Finnish error explanations and a YTL rubric breakdown.
function GraderCard() {
  return (
    <div className="grader" role="figure" aria-label="Tekoälyn arvioima kirjoitustehtävä">
      <div className="grader__head">
        <Icon name="sparkles" className="lucide" style={{ width: 17, height: 17, color: 'var(--brick)' }} />
        <span className="tag">Tekoäly arvioi</span>
        <span className="task">Tehtävä · sähköposti kaverille, ~80 sanaa</span>
      </div>
      <div className="grader__body">
        <p className="grader__prose">
          Hola Marco, el verano pasado{' '}
          <span className="ge" data-cat="grammar" title="Preteriti: yo fui. 'Iba' on imperfekti — tässä kertaluontoinen teko.">iba</span>{' '}
          a Sevilla con mi familia. La ciudad{' '}
          <span className="ge" data-cat="grammar" title="Kuvaus menneisyydessä → imperfekti: era. 'Fue' viittaa kertatapahtumaan.">fue</span>{' '}
          preciosa y{' '}
          <span className="ge" data-cat="spelling" title="Oikea kirjoitusasu: comimos">comimas</span>{' '}
          tapas cada noche. Quiero volver pronto.
        </p>

        <div className="grader__rubric">
          <div className="rubric-row">
            <span className="rname">Viestinnällisyys</span>
            <span className="rscore num">4 / 6</span>
            <span className="rnote">Viesti välittyy hyvin, sävy on luonteva.</span>
          </div>
          <div className="rubric-row">
            <span className="rname">Kielen rakenteet</span>
            <span className="rscore num">3 / 6</span>
            <span className="rnote">Preteriti ja imperfekti sekoittuvat menneen ajan kuvauksessa.</span>
          </div>
          <div className="rubric-row">
            <span className="rname">Sanasto</span>
            <span className="rscore num">4 / 5</span>
            <span className="rnote">Aiheenmukaista, pieni kirjoitusvirhe (comimas).</span>
          </div>
          <div className="rubric-row">
            <span className="rname">Kokonaisuus</span>
            <span className="rscore num">2 / 3</span>
            <span className="rnote">Rakenne on selkeä, pituus tehtävänannon mukainen.</span>
          </div>
        </div>

        <div className="grader__total">
          <span className="label">YTL-pisteet · YO-arvosana</span>
          <span className="value num">13 / 20 <span className="arvosana">· E</span></span>
        </div>
      </div>
    </div>
  );
}
window.GraderCard = GraderCard;
