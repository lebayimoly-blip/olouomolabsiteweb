// Olouomo Lab — script partagé (léger, sans dépendance externe)
document.addEventListener('DOMContentLoaded', () => {

  // Menu mobile
  const toggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('nav ul');
  if (toggle && navMenu) {
    toggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('show');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // Lien de navigation actif (au cas où non défini côté HTML)
  document.querySelectorAll('nav a').forEach(link => {
    const href = link.getAttribute('href');
    const currentPage = location.pathname.split('/').pop() || 'index.html';
    if (href === currentPage) link.classList.add('active');
  });

  // Révélation au défilement
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // FAQ accordéon fluide (natif <details>, pas de JS nécessaire au-delà du CSS)

  // Compteurs animés (chiffres qui montent au scroll)
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const counterIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-count'), 10) || 0;
        const suffix = el.getAttribute('data-suffix') || '';
        const duration = 1400;
        const start = performance.now();
        function tick(now) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * target) + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        counterIO.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach(el => counterIO.observe(el));
  }

  // Formulaire de contact (retour visuel simple, envoi géré par Netlify Forms)
  const form = document.querySelector('form[name="contact"]');
  if (form) {
    form.addEventListener('submit', (e) => {
      const successMsg = document.querySelector('.form-success');
      if (form.hasAttribute('data-netlify')) {
        // Laisse Netlify traiter l'envoi ; affichage optimiste
      }
      if (successMsg) {
        setTimeout(() => { successMsg.style.display = 'block'; }, 300);
      }
    });
  }

});
