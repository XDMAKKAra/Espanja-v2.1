// App (landing-only build) — renders the full Puheo marketing landing.
// There is no auth/app here, so CTAs scroll to the relevant section.
function App() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: window.scrollY + el.getBoundingClientRect().top - 12, behavior: 'smooth' });
  };
  const goPricing = () => scrollTo('hinta');
  const seeDemo = () => scrollTo('arviointi');

  return (
    <div className="landing-scroll">
      <TopNav onStart={goPricing} onLogin={goPricing} />
      <Hero onStart={goPricing} onSeeDemo={seeDemo} />
      <Arviointi onStart={goPricing} />
      <Coverage />
      <Languages />
      <Pricing onStart={goPricing} />
      <Faq />
      <Footer />
    </div>
  );
}
window.App = App;

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
