// animations.js - Animations premium Olouomo Lab
gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
  // Menu mobile (gardé)
  document.querySelector('.menu-toggle')?.addEventListener('click', () => {
    document.querySelector('nav ul')?.classList.toggle('show');
  });

  // 🎬 ANIMATION HERO - Texte qui s'assemble
  gsap.from('.hero h1', {
    duration: 1.2,
    y: 50,
    opacity: 0,
    ease: 'back.out(1.7)',
    stagger: 0.1
  });
  gsap.from('.hero p', {
    duration: 1,
    y: 30,
    opacity: 0,
    delay: 0.3,
    ease: 'power2.out'
  });
  gsap.from('.hero .btn', {
    duration: 0.8,
    y: 30,
    opacity: 0,
    delay: 0.5,
    stagger: 0.1,
    ease: 'back.out(1.7)'
  });

  // 🎯 SERVICES - Cards qui arrivent en cascade
  gsap.utils.toArray('.services-overview .card').forEach((card, i) => {
    gsap.from(card, {
      scrollTrigger: {
        trigger: card,
        start: 'top 85%',
        toggleActions: 'play none none reverse'
      },
      duration: 0.8,
      y: 60,
      opacity: 0,
      rotationX: -15,
      ease: 'back.out(1.7)',
      delay: i * 0.1
    });
  });

  // 🚀 BENEFITS - Cards flottantes
  gsap.utils.toArray('.benefits .card').forEach((card, i) => {
    gsap.from(card, {
      scrollTrigger: {
        trigger: card,
        start: 'top 85%'
      },
      duration: 0.9,
      x: i % 2 ? -50 : 50,
      y: 50,
      opacity: 0,
      ease: 'power3.out',
      delay: i * 0.08
    });
    
    // Micro-animation continue
    gsap.to(card, {
      y: -10,
      rotation: 2,
      duration: 3,
      ease: 'power2.inOut',
      repeat: -1,
      yoyo: true
    });
  });

  // 💰 PRICING - Cards qui explosent en 3D
  gsap.utils.toArray('.pricing-card').forEach((card, i) => {
    gsap.from(card, {
      scrollTrigger: {
        trigger: '.pricing-grid',
        start: 'top 80%'
      },
      duration: 1,
      y: 80,
      opacity: 0,
      scale: 0.8,
      rotationY: i === 1 ? 180 : 0,
      ease: 'back.out(1.7)',
      delay: i * 0.15
    });

    // Hover 3D premium
    card.addEventListener('mouseenter', () => {
      gsap.to(card, {
        duration: 0.6,
        y: -25,
        rotationY: 10,
        rotationX: 5,
        scale: 1.05,
        boxShadow: '0 35px 80px rgba(0,0,0,0.25)',
        ease: 'power3.out'
      });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        duration: 0.4,
        y: 0,
        rotationY: 0,
        rotationX: 0,
        scale: 1,
        ease: 'power2.out'
      });
    });
  });

  // 🎪 FAQ - Accordéon fluide
  document.querySelectorAll('details').forEach(detail => {
    detail.addEventListener('toggle', () => {
      const summary = detail.querySelector('summary');
      const content = detail.querySelector('div');
      
      if (detail.open) {
        gsap.from(content, {
          duration: 0.4,
          height: 0,
          opacity: 0,
          ease: 'power2.out'
        });
        gsap.to(summary, {
          backgroundColor: 'var(--primary-color)',
          color: 'white',
          duration: 0.3
        });
      } else {
        gsap.to(content, {
          duration: 0.3,
          height: 0,
          opacity: 0,
          ease: 'power2.in'
        });
      }
    });
  });

  // 📱 CTA Devis - Pulse + glow
  gsap.to('.devis-btn', {
    scale: 1.05,
    duration: 2,
    repeat: -1,
    yoyo: true,
    ease: 'power2.inOut'
  });

  // 🔗 Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      e.preventDefault();
      document.querySelector(anchor.getAttribute('href'))?.scrollIntoView({
        behavior: 'smooth'
      });
    });
  });

  // Active nav
  document.querySelectorAll('nav a').forEach(link => {
    if (link.href === location.href || link.getAttribute('href') === 'services.html') {
      link.classList.add('active');
    }
  });
});
