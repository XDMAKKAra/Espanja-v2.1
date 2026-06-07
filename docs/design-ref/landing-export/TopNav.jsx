// TopNav — marketing nav. Sticky, glass once scrolled. (Icon lives in Icons.jsx.)
function TopNav({ onStart, onLogin }) {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const el = document.querySelector('.landing-scroll') || window;
    const onScroll = () => {
      const y = el === window ? window.scrollY : el.scrollTop;
      setScrolled(y > 8);
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <nav className="nav" data-scrolled={scrolled}>
      <div className="container nav__inner">
        <span className="wordmark">puheo<span className="dot">.</span></span>
        <div className="nav__links">
          <a href="#kielet">Kielet</a>
          <a href="#miten">Miten se toimii</a>
          <a href="#hinta">Hinnoittelu</a>
          <a href="#ukk">UKK</a>
        </div>
        <div className="nav__right">
          <button className="btn btn--ghost" onClick={onLogin}>Kirjaudu</button>
          <button className="btn btn--primary btn--sm" onClick={onStart}>Aloita ilmaiseksi</button>
        </div>
      </div>
    </nav>
  );
}
window.TopNav = TopNav;
