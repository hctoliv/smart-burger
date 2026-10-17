(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = () => innerWidth <= 760;

  /* ---------- intro: o neon do salão acendendo ---------- */
  const intro = $('.intro');
  const q = new URLSearchParams(location.search);
  let seen = false;
  try { seen = sessionStorage.getItem('sb-intro') === '1'; } catch (e) {}
  const ready = () => document.body.classList.add('is-ready');

  if (!reduce && (!seen || q.has('intro'))) {
    root.classList.add('intro-on');
    const words = $$('.intro-neon span', intro);
    // cada palavra pisca antes de firmar, igual neon ligando
    const plan = [[0, 1], [180, 0], [260, 1], [420, 1], [620, 1], [700, 0], [760, 1], [900, 1], [1100, 1], [1180, 0], [1230, 1]];
    const idx = [0, 0, 0, 1, 2, 2, 2, 3, 4, 4, 4];
    plan.forEach(([t, on], i) => setTimeout(() => words[idx[i]].classList.toggle('on', !!on), t));
    setTimeout(() => intro.classList.add('stamp'), 1500);
    let done = false;
    const end = () => {
      if (done) return; done = true;
      intro.classList.add('out');
      setTimeout(() => { root.classList.remove('intro-on'); ready(); }, 450);
      try { sessionStorage.setItem('sb-intro', '1'); } catch (e) {}
    };
    setTimeout(end, 2500);
    intro.addEventListener('click', end);
    addEventListener('keydown', end, { once: true });
  } else {
    requestAnimationFrame(ready);
  }

  /* ---------- header ---------- */
  const hdr = $('.hdr');
  const burger = $('.hdr-burger');
  const drawer = $('.drawer');
  const setDrawer = (open) => {
    burger.setAttribute('aria-expanded', open);
    drawer.classList.toggle('open', open);
    drawer.setAttribute('aria-hidden', !open);
    root.classList.toggle('lock', open);
  };
  burger.addEventListener('click', () => setDrawer(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', drawer).forEach(a => a.addEventListener('click', () => setDrawer(false)));

  /* ---------- pedido: escolhe a unidade ---------- */
  const order = $('.order');
  let lastFocus = null;
  const openOrder = () => {
    lastFocus = document.activeElement;
    setDrawer(false);
    order.hidden = false;
    root.classList.add('lock');
    $('.order-list a', order).focus();
  };
  const closeOrder = () => {
    order.hidden = true;
    root.classList.remove('lock');
    if (lastFocus) lastFocus.focus();
  };
  $$('[data-order]').forEach(b => b.addEventListener('click', openOrder));
  $$('[data-close]', order).forEach(b => b.addEventListener('click', closeOrder));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !order.hidden) closeOrder(); });

  /* ---------- spray: picha a parede do hero ---------- */
  const hero = $('.hero');
  const cv = $('.spray');
  const ctx = cv.getContext('2d');
  const colors = ['240,122,18', '255,210,31', '255,45,111', '127,243,255'];
  let ci = 0, last = null, dpr = 1, sprayOn = true;
  const sizeSpray = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = hero.clientWidth * dpr;
    cv.height = hero.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const puff = (x, y, r) => {
    const c = colors[ci];
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${c},.55)`);
    g.addColorStop(.5, `rgba(${c},.18)`);
    g.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    // respingo
    ctx.fillStyle = `rgba(${c},.8)`;
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * 6.3, d = Math.random() * r * 1.3;
      ctx.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, 1.4, 1.4);
    }
  };
  const paint = (x, y) => {
    if (!sprayOn) return;
    if (last) {
      const dx = x - last.x, dy = y - last.y, dist = Math.hypot(dx, dy);
      const steps = Math.min(30, Math.ceil(dist / 6));
      for (let i = 1; i <= steps; i++) puff(last.x + dx * i / steps, last.y + dy * i / steps, 18);
    } else puff(x, y, 18);
    last = { x, y };
  };
  const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  hero.addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse' || e.buttons) paint(...pos(e));
  });
  hero.addEventListener('pointerdown', e => { last = null; paint(...pos(e)); });
  hero.addEventListener('pointerleave', () => { last = null; });
  hero.addEventListener('pointerup', () => { last = null; ci = (ci + 1) % colors.length; });
  // troca a cor da lata a cada 2,5s quando é mouse
  setInterval(() => { ci = (ci + 1) % colors.length; }, 2500);
  // a tinta vai escorrendo e sumindo
  let fadeT = 0;
  const fadeSpray = (t) => {
    if (t - fadeT > 60) {
      fadeT = t;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,.035)';
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.restore();
    }
  };
  sizeSpray();

  /* ---------- parede horizontal ---------- */
  const wall = $('.wall');
  const track = $('.wall-track');
  let wallMax = 0;
  const sizeWall = () => {
    if (mobile()) { wall.style.removeProperty('--wall-h'); track.style.transform = ''; return; }
    wallMax = track.scrollWidth - innerWidth;
    wall.style.setProperty('--wall-h', (wallMax + innerHeight * 1.1) + 'px');
  };

  /* ---------- destaques ---------- */
  const stars = $$('.star');
  const starImgs = $$('[data-star]');
  const starDots = $$('.stars-dots li');
  const starPrice = $('[data-star-price]');
  let starOn = -1;
  const setStar = i => {
    if (i === starOn) return;
    starOn = i;
    stars.forEach((s, k) => s.classList.toggle('is-on', k === i));
    starImgs.forEach((s, k) => s.classList.toggle('is-on', k === i));
    starDots.forEach((s, k) => s.classList.toggle('is-on', k === i));
    starPrice.textContent = stars[i].dataset.price;
  };

  /* ---------- um só handler de scroll ---------- */
  let lastY = scrollY, ticking = false;
  const onScroll = () => {
    const y = scrollY;
    hdr.classList.toggle('solid', y > 40);
    hdr.classList.toggle('hide', y > lastY && y > innerHeight * .8 && !drawer.classList.contains('open'));
    lastY = y;

    const hp = Math.min(1, Math.max(0, y / innerHeight));
    hero.style.setProperty('--hp', hp.toFixed(3));
    sprayOn = hp < .6;

    if (!mobile() && wallMax > 0) {
      const r = wall.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
      track.style.transform = `translate3d(${-p * wallMax}px,0,0)`;
    }

    const mid = innerHeight * (mobile() ? .85 : .5);
    let best = 0;
    stars.forEach((s, k) => { if (s.getBoundingClientRect().top < mid) best = k; });
    setStar(best);
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  const loop = t => { fadeSpray(t); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);

  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { sizeSpray(); sizeWall(); onScroll(); }, 150); });
  addEventListener('load', () => { sizeWall(); onScroll(); });
  sizeWall(); onScroll();

  /* ---------- cardápio (delivery Osasco, Anota Aí) ---------- */
  const MENU = {
    burgers: [
      ['Smash urban', 'R$ 44,90', '2 hambúrgueres bovinos de 80g, bacon, picles, american cheese, cebola caramelizada, pão da casa. Acompanha maionese.', 'mais vendido'],
      ['Pansexy', 'R$ 45,90', 'Hambúrguer bovino, queijo, pancetta picante, maionese de wasabi e salada verde com toque oriental, no pão da casa.', 'o queridinho'],
      ['Totoso', 'R$ 43,90', '2 smash de 80g, queijo provolone, bacon, tomate cereja assado, rúcula e molho tasty (aquele mesmo que você tá pensando).'],
      ['MDF', 'R$ 55,90', 'Nosso novo monstrinho com 330g de carne, duplo cheddar da casa, bacon e picles de cebola.', '330g'],
      ['Xis turbo', 'R$ 43,90', '2 smash de 80g, gorgonzola, bacon, cebola empanada, geleia de pimenta e molho smart.'],
      ['New tex', 'R$ 45,90', 'Hambúrguer bovino, bacon, cheddar, cebola roxa crua, Doritos, molho tex mex. Acompanha maionese da casa.'],
      ['Quarter smart', 'R$ 42,90', 'O clássico quarteirão com queijo, porém duplo: duas carnes de 80g, american cheese, cebola picadinha, molho com picles, ketchup e mostarda.'],
      ['Smart BBQ', 'R$ 40,90', 'Hambúrguer, cheddar, bacon, molho BBQ, cebola empanada e picles.'],
      ['Original com bacon', 'R$ 44,90', 'Hambúrguer, bacon, molho Original, queijo, cebola picada e alface juliana no pão da casa. Acompanha maionese da casa.'],
      ['Original burger', 'R$ 41,90', 'Hambúrguer, molho Original, queijo, cebola picada e alface juliana no pão da casa. Acompanha maionese da casa.'],
      ['Chicken smart', 'R$ 39,90', 'Sanduíche de frango empanado, alface americana com molho Original e catupiry.'],
      ['X bacon', 'R$ 42,90', 'Burger, queijo, bacon e maionese à parte.'],
      ['X salada', 'R$ 40,90', 'Hambúrguer bovino, queijo, alface, tomate, pão especial. Acompanha maionese da casa.'],
      ['X burger', 'R$ 33,90', 'Cheese burger da casa + maionese da casa.'],
      ['Vegan', 'R$ 39,90', 'Hambúrguer de grão de bico com aveia e limão, chutney picante de tomate, rúcula e cebola frita crocante no pão integral.', 'vegano']
    ],
    combos: [
      ['Combo x salada', 'R$ 56,90', 'X salada + fritas crinkle + Coca-Cola lata 350 ml.'],
      ['Combo quarter', 'R$ 56,90', 'Quarter smart + fritas crinkle + Coca-Cola lata 350 ml.'],
      ['Combo frango empanado', 'R$ 51,90', 'Chicken smart + fritas crinkle + Coca-Cola lata 350 ml.']
    ],
    entradas: [
      ['Fritas smart', 'R$ 39,90', 'Cheddar e bacon. Melhor comer no salão, no delivery ela pode murchar.'],
      ['Fritas', 'R$ 21,90', 'Nossas fritas crinkle.'],
      ['Coxinha de frango com gorgonzola', 'R$ 39,90', '6 unidades.'],
      ['Fake chicken flower', 'R$ 38,99', 'Couve-flor empanada coberta de molho picante. Acompanha cenoura, salsão e maionese de dill.', 'vegetariano'],
      ['Nuggets com molho caipira', 'R$ 31,90', '10 unidades.'],
      ['Maionese artesanal extra', 'R$ 4,80', 'Potinho extra com a nossa maionese artesanal.']
    ],
    doces: [
      ['Milk shake 500 ml', '', 'Os shakes deliciosos da casa. Sabores no delivery.'],
      ['Brownie de chocolate', 'R$ 15,00', 'Um mega brownie de 90g delicioso.']
    ]
  };
  const list = $('[data-menu]');
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const renderMenu = key => {
    list.innerHTML = MENU[key].map(([n, p, d, b], i) => `
      <article class="item" style="animation-delay:${i * 40}ms">
        <h3>${esc(n)}${b ? `<span class="badge${/veg/.test(b) ? ' veg' : ''}">${esc(b)}</span>` : ''}</h3>
        ${p ? `<span class="price">${p}</span>` : '<span></span>'}
        <p>${esc(d)}</p>
      </article>`).join('');
  };
  const tabs = $$('.menu-tabs button');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.setAttribute('aria-selected', x === t));
    renderMenu(t.dataset.tab);
  }));
  renderMenu('burgers');

  /* ---------- vídeos com som, um de cada vez ---------- */
  const reels = $$('[data-reel]');
  const stopAll = except => reels.forEach(r => {
    if (r === except) return;
    const v = $('video', r);
    v.pause(); r.classList.remove('playing');
  });
  reels.forEach(r => {
    const v = $('video', r);
    $('.reel-play', r).addEventListener('click', () => {
      stopAll(r);
      v.muted = false;
      v.play().then(() => r.classList.add('playing')).catch(() => {});
    });
    v.addEventListener('click', () => {
      if (v.paused) { stopAll(r); v.play(); r.classList.add('playing'); }
      else { v.pause(); r.classList.remove('playing'); }
    });
    v.addEventListener('ended', () => r.classList.remove('playing'));
  });

  /* ---------- carrega e pausa vídeos conforme a tela ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (v.hasAttribute('data-lazy-loop')) {
      if (e.isIntersecting) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause();
    } else if (!e.isIntersecting && !v.paused) {
      v.pause(); v.closest('[data-reel]').classList.remove('playing');
    }
  }), { rootMargin: '200px 0px' });
  $$('video').forEach(v => io.observe(v));

  /* ---------- reveal ---------- */
  const rvEls = $$('.crew-head, .menu-head, .units-head, .unit, .shot, .crew-grid .reel, .free-copy, .free-media, .delivery, .crew-loop');
  rvEls.forEach(el => el.classList.add('rv'));
  const rio = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); }
  }), { threshold: .12 });
  rvEls.forEach(el => rio.observe(el));

  /* ---------- aberto agora (horários Osasco) ---------- */
  const H = { 0: [[690, 960], [1080, 1365]], 1: [], 2: [[690, 960], [1080, 1365]], 3: [[690, 960], [1080, 1365]], 4: [[690, 960], [1080, 1365]], 5: [[690, 960], [1080, 1425]], 6: [[690, 1425]] };
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const d = now.getDay(), m = now.getHours() * 60 + now.getMinutes();
  const open = H[d].some(([a, b]) => m >= a && m < b);
  const on = $('[data-open-now]');
  on.textContent = open ? 'Aberto agora' : 'Fechado agora';
  on.classList.toggle('on', open);
  $$('.hours tr').forEach(tr => { if (tr.dataset.d.split(',').map(Number).includes(d)) tr.classList.add('today'); });
})();
