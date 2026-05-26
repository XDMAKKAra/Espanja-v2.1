// Waitlist modal, DE landing. Extracted from inline <script> in saksa.html
// so a strict CSP (script-src without 'unsafe-inline') can ship.

(function () {
  'use strict';
  var modal    = document.getElementById('wl-modal');
  var form     = document.getElementById('wl-form');
  var emailEl  = document.getElementById('wl-email');
  var statusEl = document.getElementById('wl-status');
  var cancelBtn = document.getElementById('wl-cancel');

  if (!modal || !form || !emailEl || !statusEl || !cancelBtn) return;

  // Fetch waitlist count, if endpoint not yet live, hide counter silently.
  var countEl = document.getElementById('wl-count-de');
  if (countEl) {
    fetch('/api/onboarding/waitlist/count?language=de')
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) {
        if (d && typeof d.count === 'number' && d.count > 0) {
          countEl.textContent = d.count + ' odottaa saksan kurssia •';
          countEl.removeAttribute('hidden');
        }
      })
      .catch(function () { /* silently suppress */ });
  }

  function openModal() {
    statusEl.textContent = '';
    emailEl.value = '';
    modal.showModal();
    emailEl.focus();
  }

  function closeModal() {
    modal.close();
  }

  ['hero-wl-btn', 'courses-wl-btn', 'pricing-free-wl-btn',
   'pricing-mestari-wl-btn', 'cta-wl-btn', 'wl-open-btn'].forEach(function (id) {
    var btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', function (e) {
      e.preventDefault();
      openModal();
    });
  });

  cancelBtn.addEventListener('click', closeModal);

  // ESC + backdrop close (dialog handles ESC natively, backdrop via click)
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = emailEl.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      statusEl.textContent = 'Syötä kelvollinen sähköpostiosoite.';
      statusEl.style.color = 'var(--text-muted)';
      emailEl.focus();
      return;
    }
    statusEl.textContent = 'Lähetetään…';
    fetch('/api/onboarding/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, language: 'de', level: 'lyhyt' })
    })
      .then(function (r) {
        if (!r.ok) return r.json().then(function (d) { throw d; });
        return r.json();
      })
      .then(function () {
        statusEl.textContent = 'Olet waitlistillä! Saat sähköpostin kun saksan Puheo avautuu.';
        statusEl.style.color = 'var(--accent)';
        emailEl.value = '';
        setTimeout(closeModal, 3000);
      })
      .catch(function (err) {
        statusEl.textContent = (err && err.error) || 'Jokin meni pieleen. Yritä uudelleen.';
        statusEl.style.color = 'var(--text-muted)';
      });
  });
}());
