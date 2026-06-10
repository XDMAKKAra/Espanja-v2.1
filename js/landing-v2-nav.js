/* L-V412 — landing v2 mobile nav overlay toggle (hampurilainen).
 * CSP-safe: no inline handlers. Desktop "Kurssit" dropdown is pure CSS. */
(function () {
  var burger = document.getElementById('nav-burger');
  var overlay = document.getElementById('nav-overlay');
  if (!burger || !overlay) return;
  function setOpen(open) {
    overlay.classList.toggle('open', open);
    overlay.hidden = !open;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setOpen(overlay.hidden); });
  overlay.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !overlay.hidden) setOpen(false);
  });
})();
