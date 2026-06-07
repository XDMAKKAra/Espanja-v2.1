// Kurssi — course-detail for Kurssi 1. 10 lesson rows; 1.1 done, 1.2 active, rest upcoming.
const OPPITUNNIT = [
  { n: '1.1', type: 'Sanasto', title: 'Perhe ja kansallisuudet: perussanasto', state: 'done' },
  { n: '1.2', type: 'Kielioppi', title: '-ar-verbit preesensissä: säännöllinen taivutus', state: 'active' },
  { n: '1.3', type: 'Kielioppi', title: '-er- ja -ir-verbit preesensissä', state: 'upcoming' },
  { n: '1.4', type: 'Sanasto', title: 'Koulu ja värit', state: 'upcoming' },
  { n: '1.5', type: 'Yhdistelmä', title: 'Ser vs estar: perusteet', state: 'upcoming' },
  { n: '1.6', type: 'Sanasto', title: 'Numerot ja ikä', state: 'upcoming' },
  { n: '1.7', type: 'Kielioppi', title: 'Ser vs estar syvemmin', state: 'upcoming' },
  { n: '1.8', type: 'Yhdistelmä', title: 'Persoonapronominit ja omistus', state: 'upcoming' },
  { n: '1.9', type: 'Sanasto', title: 'Kansallisuudet ja kielet', state: 'upcoming' },
  { n: '1.10', type: 'Kirjoittaminen', title: 'Kirjoita lyhyt esittely itsestäsi', state: 'upcoming' },
];

function Kurssi({ onStartLesson, onBackToPath, onHome }) {
  return (
    <div className="appmain">
      <nav className="crumbs">
        <button onClick={onHome}>Aloitus</button>
        <span className="sep">/</span>
        <button onClick={onBackToPath}>Oppimispolku</button>
        <span className="sep">/</span>
        <span className="here">Kurssi 1</span>
      </nav>
      <div className="cd-head">
        <span className="eyebrow">Espanja · Kurssi 1 · Taso A</span>
        <h1>Kurssi 1: Kuka olen</h1>
        <p className="desc">Preesens säännölliset, ser/estar perusteet, persoona ja perhe.</p>
        <div className="cd-progress">
          <span className="label num">1 / 10 oppituntia · 10 %</span>
          <span className="bar"><span style={{ width: '10%' }} /></span>
        </div>
      </div>

      <div className="lesson-list">
        {OPPITUNNIT.map((o) => (
          <div key={o.n} className={'lesson-row' + (o.state === 'active' ? ' lesson-row--active' : '') + (o.state === 'upcoming' ? ' lesson-row--upcoming' : '')}>
            <span className="lesson-row__num">{o.n}</span>
            <div>
              <span className="eyebrow" style={{ fontSize: 11 }}>{o.type}</span>
              <div className="lesson-row__title">{o.title}</div>
            </div>
            <div className="lesson-row__right">
              <span className="lesson-row__time">~14 min</span>
              {o.state === 'done' ? (
                <span className="lesson-done"><Icon name="circle-check" /> Suoritettu</span>
              ) : o.state === 'active' ? (
                <button className="btn btn--primary btn--sm" onClick={onStartLesson}>Aloita <Icon name="arrow-right" style={{ width: 15, height: 15 }} /></button>
              ) : (
                <button className="btn btn--ghost btn--sm" onClick={onStartLesson}>Aloita <Icon name="arrow-right" style={{ width: 15, height: 15 }} /></button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
window.Kurssi = Kurssi;
