// Exercise — vocab drill (MCQ). Demonstrates: skeleton load, lettered options,
// correct/wrong states, Finnish feedback band, progress, exit.
const VOCAB_QS = [
  {
    ask: 'Miten sanot espanjaksi:', word: 'jälkiruoka', answer: 0,
    options: ['postre', 'almuerzo', 'desayuno', 'cena'],
    note: 'Oikein. "postre" on vakiintunut jälkiruokatermi ja esiintyy usein ravintola-aiheisissa teksteissä.',
    wrongNote: 'Oikea vastaus on "postre". "cena" tarkoittaa illallista.',
  },
  {
    ask: 'Miten sanot espanjaksi:', word: 'juna', answer: 2,
    options: ['avión', 'coche', 'tren', 'barco'],
    note: 'Oikein. "tren" kuuluu matkailusanastoon, jota YO-koe testaa luetun ymmärtämisessä.',
    wrongNote: 'Oikea vastaus on "tren". "coche" tarkoittaa autoa.',
  },
  {
    ask: 'Valitse oikea muoto:', word: 'Ayer ___ al cine.', answer: 1,
    options: ['voy', 'fui', 'iba', 'iré'],
    note: 'Oikein. Kertaluontoinen mennyt teko vaatii preteritin: yo fui.',
    wrongNote: 'Oikea vastaus on "fui". "iba" on imperfekti, joka kuvaa toistuvaa tai kestävää tekoa.',
  },
];

function Exercise({ onExit }) {
  const [loading, setLoading] = React.useState(true);
  const [idx, setIdx] = React.useState(0);
  const [picked, setPicked] = React.useState(null);

  React.useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 850);
    return () => clearTimeout(t);
  }, [idx]);

  const q = VOCAB_QS[idx];
  const total = VOCAB_QS.length;
  const answered = picked !== null;
  const correct = answered && picked === q.answer;
  const pct = Math.round(((idx + (answered ? 1 : 0)) / total) * 100);

  const next = () => {
    setPicked(null);
    setIdx((i) => (i + 1) % total);
  };

  return (
    <div className="appmain">
      <div className="drill">
        <div className="drill__top">
          <span className="pill" style={{ background: 'var(--olive-soft)', color: 'var(--olive)' }}>Sanasto</span>
          <span className="meta">Espanja · taso C</span>
          <span className="count num">{idx + 1} / {total}</span>
          <button className="exit" aria-label="Poistu harjoituksesta" onClick={onExit}>
            <Icon name="x" />
          </button>
        </div>
        <div className="drill__bar"><span style={{ width: pct + '%' }} /></div>

        {loading ? (
          <React.Fragment>
            <div className="drill__prompt">
              <div className="skel" style={{ height: 16, width: 140, margin: '0 auto 12px' }} />
              <div className="skel" style={{ height: 38, width: 220, margin: '0 auto' }} />
            </div>
            <div className="options">
              {[0, 1, 2, 3].map((i) => <div key={i} className="skel" style={{ height: 58 }} />)}
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            <div className="drill__prompt">
              <div className="ask">{q.ask}</div>
              <div className="word">{q.word}</div>
            </div>
            <div className="options">
              {q.options.map((opt, i) => {
                let state = null;
                if (answered) {
                  if (i === q.answer) state = 'correct';
                  else if (i === picked) state = 'wrong';
                  else state = 'dim';
                }
                return (
                  <button key={i} className="option" data-state={state} disabled={answered}
                    onClick={() => setPicked(i)}>
                    <span className="option__l">{'ABCD'[i]}</span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {answered && (
              <div className="fb">
                <div className={'fb__line ' + (correct ? 'ok' : 'no')}>
                  <Icon name={correct ? 'check-check' : 'x'} style={{ width: 19, height: 19 }} />
                  {correct ? 'Oikein' : 'Väärin'}
                </div>
                <p className="fb__note">{correct ? q.note : q.wrongNote}</p>
                <div className="fb__cta">
                  <button className="btn btn--primary" onClick={next}>Seuraava <Icon name="arrow-right" /></button>
                </div>
              </div>
            )}
          </React.Fragment>
        )}
      </div>
    </div>
  );
}
window.Exercise = Exercise;
