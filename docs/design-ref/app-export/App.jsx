// App (app-only build) — boots straight into the logged-in app.
// Screens: dashboard | path (Oppimispolku) | course (Kurssi) | exercise (drill).
function App() {
  const [appScreen, setAppScreen] = React.useState('dashboard');
  const [navActive, setNavActive] = React.useState('dashboard');

  React.useEffect(() => { window.scrollTo(0, 0); }, [appScreen]);

  const goHome = () => { setAppScreen('dashboard'); setNavActive('dashboard'); };
  const startExercise = () => { setAppScreen('exercise'); setNavActive('vocab'); };
  const onNav = (id) => {
    setNavActive(id);
    if (id === 'dashboard') setAppScreen('dashboard');
    else if (id === 'path') setAppScreen('path');
    else startExercise();
  };

  let screen;
  if (appScreen === 'dashboard') screen = <Dashboard onStartVocab={startExercise} onOpenPath={() => { setAppScreen('path'); setNavActive('path'); }} />;
  else if (appScreen === 'path') screen = <Oppimispolku onOpenCourse={() => setAppScreen('course')} onHome={goHome} />;
  else if (appScreen === 'course') screen = <Kurssi onStartLesson={startExercise} onBackToPath={() => setAppScreen('path')} onHome={goHome} />;
  else screen = <Exercise onExit={() => { setAppScreen('path'); setNavActive('path'); }} />;

  return (
    <div className="app">
      <Sidebar active={navActive} onNav={onNav} onHome={goHome} />
      {screen}
    </div>
  );
}
window.App = App;

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
