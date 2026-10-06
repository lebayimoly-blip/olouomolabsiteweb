// OLOUOMO LAB — Hero « réseau neuronal » (sans dépendance externe)
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = document.querySelector('.hero');
  if (!hero) return;

  let heroVisible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }, { threshold: 0 }).observe(hero);
  }
  const running = () => heroVisible && !document.hidden;

  /* =====================================================
     1. Fond : neurones qui dérivent, se connectent et
        propagent des influx (signaux ambre) de proche en proche
     ===================================================== */
  const canvas = hero.querySelector('.hero-neurons');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const LINK = 140;
    let W = 0, H = 0, dpr = 1, nodes = [], signals = [];
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = hero.clientWidth; H = hero.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(28, Math.min(95, Math.round(W * H / 13000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28,
        r: 1.2 + Math.random() * 1.6, glow: 0
      }));
      signals = [];
      if (reduce) draw();
    }

    function neighbours(i) {
      const a = nodes[i], out = [];
      for (let j = 0; j < nodes.length; j++) {
        if (j === i) continue;
        const dx = a.x - nodes[j].x, dy = a.y - nodes[j].y;
        if (dx * dx + dy * dy < LINK * LINK) out.push(j);
      }
      return out;
    }

    function fire(from) {
      const n = neighbours(from);
      if (!n.length) return;
      const to = n[Math.floor(Math.random() * n.length)];
      signals.push({ a: from, b: to, t: 0, s: .018 + Math.random() * .02, hops: 0 });
    }

    function step() {
      for (const p of nodes) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = W + 20; else if (p.x > W + 20) p.x = -20;
        if (p.y < -20) p.y = H + 20; else if (p.y > H + 20) p.y = -20;
        p.glow *= .94;
      }
      if (signals.length < 14 && Math.random() < .06) fire(Math.floor(Math.random() * nodes.length));
      for (let k = signals.length - 1; k >= 0; k--) {
        const s = signals[k];
        s.t += s.s;
        if (s.t >= 1) {
          nodes[s.b].glow = 1;
          signals.splice(k, 1);
          // l'influx se propage au neurone suivant (réaction en chaîne)
          if (s.hops < 5 && Math.random() < .75) {
            const n = neighbours(s.b).filter(j => j !== s.a);
            if (n.length) signals.push({ a: s.b, b: n[Math.floor(Math.random() * n.length)], t: 0, s: s.s, hops: s.hops + 1 });
          }
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            const al = (1 - Math.sqrt(d2) / LINK) * .28;
            ctx.strokeStyle = `rgba(140,170,230,${al})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        // liaison avec le curseur
        const mx = a.x - mouse.x, my = a.y - mouse.y, md = mx * mx + my * my;
        if (md < 170 * 170) {
          ctx.strokeStyle = `rgba(232,169,59,${(1 - Math.sqrt(md) / 170) * .5})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      for (const p of nodes) {
        if (p.glow > .05) {
          ctx.fillStyle = `rgba(232,169,59,${p.glow * .25})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 7 * p.glow, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = p.glow > .1 ? `rgba(245,200,120,${.6 + p.glow * .4})` : 'rgba(170,195,245,.65)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      for (const s of signals) {
        const a = nodes[s.a], b = nodes[s.b];
        const x = a.x + (b.x - a.x) * s.t, y = a.y + (b.y - a.y) * s.t;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 7);
        g.addColorStop(0, 'rgba(255,214,140,1)'); g.addColorStop(1, 'rgba(232,169,59,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
      }
    }

    function loop() {
      if (running()) { step(); draw(); }
      requestAnimationFrame(loop);
    }

    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });

    resize();
    if (!reduce) requestAnimationFrame(loop);
  }

  /* =====================================================
     2. Cœur IA relié à nos services : l'IA « active »
        un service à tour de rôle
     ===================================================== */
  const net = hero.querySelector('.neural');
  if (!net) return;
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = net.querySelector('svg');
  const core = net.querySelector('.core');
  const svcs = [...net.querySelectorAll('.svc')];
  const log = hero.querySelector('.neural-log');
  const N = svcs.length, R = 38;

  const items = svcs.map((el, i) => {
    const ang = -Math.PI / 2 + i * 2 * Math.PI / N;
    const spoke = document.createElementNS(svgNS, 'line');
    spoke.setAttribute('class', 'syn');
    svg.appendChild(spoke);
    return { el, ang, x: 50, y: 50, phase: Math.random() * 6.28, spoke };
  });
  const rings = items.map(() => {
    const l = document.createElementNS(svgNS, 'line');
    l.setAttribute('class', 'syn ring');
    svg.insertBefore(l, svg.firstChild);
    return l;
  });

  let sparks = [];
  function spark(from, to, cls, speed) {
    const c = document.createElementNS(svgNS, 'circle');
    c.setAttribute('r', cls === 'blue' ? .8 : 1.1);
    c.setAttribute('class', 'spark ' + (cls || ''));
    svg.appendChild(c);
    sparks.push({ c, from, to, t: 0, s: speed || .018 });
  }

  function place(time) {
    const t = time / 1000;
    for (const it of items) {
      const wob = reduce ? 0 : Math.sin(t * .6 + it.phase) * 1.6;
      const ang = it.ang + (reduce ? 0 : Math.sin(t * .15) * .05);
      it.x = 50 + Math.cos(ang) * (R + wob);
      it.y = 50 + Math.sin(ang) * (R + wob);
      it.el.style.left = it.x + '%';
      it.el.style.top = it.y + '%';
      it.spoke.setAttribute('x1', 50); it.spoke.setAttribute('y1', 50);
      it.spoke.setAttribute('x2', it.x); it.spoke.setAttribute('y2', it.y);
    }
    items.forEach((it, i) => {
      const nx = items[(i + 1) % N];
      rings[i].setAttribute('x1', it.x); rings[i].setAttribute('y1', it.y);
      rings[i].setAttribute('x2', nx.x); rings[i].setAttribute('y2', nx.y);
    });
  }

  const pos = k => k === 'core' ? { x: 50, y: 50 } : items[k];
  function moveSparks() {
    for (let k = sparks.length - 1; k >= 0; k--) {
      const s = sparks[k];
      s.t += s.s;
      const a = pos(s.from), b = pos(s.to);
      if (s.t >= 1) { s.c.remove(); sparks.splice(k, 1); continue; }
      s.c.setAttribute('cx', a.x + (b.x - a.x) * s.t);
      s.c.setAttribute('cy', a.y + (b.y - a.y) * s.t);
    }
  }

  // --- activation d'un service à tour de rôle ---
  let active = -1, paused = false, typer;
  function setLog(el) {
    if (!log) return;
    const name = el.dataset.name, desc = el.dataset.desc;
    clearInterval(typer);
    if (reduce) {
      log.innerHTML = `<span class="k">&gt; activation :</span> <span class="v">${name}</span><br>${desc}`;
      return;
    }
    let n = 0;
    typer = setInterval(() => {
      n += 2;
      log.innerHTML = `<span class="k">&gt; activation :</span> <span class="v">${name}</span><br>${desc.slice(0, n)}<span class="caret"></span>`;
      if (n >= desc.length) clearInterval(typer);
    }, 22);
  }
  function activate(i) {
    items.forEach((it, k) => {
      it.el.classList.toggle('on', k === i);
      it.spoke.classList.toggle('hot', k === i);
    });
    active = i;
    setLog(items[i].el);
    if (!reduce) {
      core.classList.remove('beat'); void core.offsetWidth; core.classList.add('beat');
      spark('core', i, '', .035);
    }
  }

  svcs.forEach((el, i) => {
    el.addEventListener('mouseenter', () => { paused = true; activate(i); });
    el.addEventListener('focus', () => { paused = true; activate(i); });
    el.addEventListener('mouseleave', () => { paused = false; });
    el.addEventListener('blur', () => { paused = false; });
  });

  place(0);
  activate(0);
  if (reduce) return;

  setInterval(() => {
    if (!paused && running()) activate((active + 1) % N);
  }, 2600);

  let last = 0;
  function tick(time) {
    if (running()) {
      place(time);
      moveSparks();
      // petits influx permanents : cœur -> service, service -> service
      if (time - last > 380) {
        last = time;
        const i = Math.floor(Math.random() * N);
        if (Math.random() < .5) spark('core', i, 'blue', .014);
        else spark(i, (i + 1) % N, 'blue', .02);
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
