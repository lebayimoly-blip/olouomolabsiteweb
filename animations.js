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
