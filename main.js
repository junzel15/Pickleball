(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // Remove the old offline game. Earlier versions of this site installed a
  // service worker that cached the game, so unregister it and clear its caches
  // so returning visitors see this page.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister())).catch(() => {});
  }
  if (window.caches && caches.keys) {
    caches.keys().then((keys) => keys.filter((k) => k.startsWith('pickleball')).forEach((k) => caches.delete(k))).catch(() => {});
  }

  const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // ---------- Mobile menu ----------
  const navEl = $('#nav');
  const navToggle = $('#navToggle');
  if (navEl && navToggle) {
    const setOpen = (open) => {
      navEl.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    navToggle.addEventListener('click', () => setOpen(!navEl.classList.contains('open')));
    $$('#navLinks a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    document.addEventListener('click', (e) => { if (!navEl.contains(e.target)) setOpen(false); });
  }

  // ---------- Hero screenshots slideshow ----------
  const screens = $('#screens');
  if (screens) {
    const imgs = $$('.screen-img', screens);
    const tabs = $$('.screen-tab');
    const bar = $('#screenProgress');
    let current = 0;
    let timer = null;
    const restartBar = () => {
      if (!bar) return;
      bar.classList.remove('run');
      if (timer) { void bar.offsetWidth; bar.classList.add('run'); }
    };
    const show = (i) => {
      current = (i + imgs.length) % imgs.length;
      imgs.forEach((img, n) => img.classList.toggle('is-active', n === current));
      tabs.forEach((t, n) => { t.classList.toggle('is-active', n === current); t.setAttribute('aria-pressed', String(n === current)); });
      restartBar();
    };
    const start = () => {
      if (reduceMotion || timer) return;
      timer = setInterval(() => show(current + 1), 5000);
      restartBar();
    };
    const stop = () => { clearInterval(timer); timer = null; restartBar(); };
    tabs.forEach((t, n) => t.addEventListener('click', () => { stop(); show(n); }));
    const showcase = screens.closest('.showcase');
    if (showcase) {
      showcase.addEventListener('mouseenter', stop);
      showcase.addEventListener('mouseleave', start);
    }
    // pause while the tab is hidden
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    show(0);
    start();
  }

  // ---------- Hyper Skill demo ----------
  // Loops: charge to 100% -> ready -> tap -> 5 s active (meter drains) -> recharge.
  // Runs only while it is on screen.
  const demo = $('#hyperDemo');
  if (demo) {
    const fill = $('#hdFill'), label = $('#hdLabel'), dial = $('#hdDial'), btnText = $('#hdBtnText'), caption = $('#hdCaption');
    const CHARGE = 3.2, READY = 1.8, ACTIVE = 5, COOL = 0.9;
    const CYCLE = CHARGE + READY + ACTIVE + COOL;
    let t = 0, last = 0, raf = 0, phase = '';
    const setPhase = (p) => {
      if (p === phase) return;
      phase = p;
      demo.dataset.phase = p;
      if (p === 'active') {
        demo.classList.remove('burst'); void demo.offsetWidth; demo.classList.add('burst', 'tap');
        setTimeout(() => demo.classList.remove('tap'), 160);
      }
      caption.textContent = {
        charge: 'Charging… every hit and every point fills the meter',
        ready: 'Meter full: tap HYPER',
        active: 'HYPER MODE: faster movement, harder shots',
        cool: 'Hyper over: back to normal, recharging from zero',
      }[p];
    };
    const render = (value, text, btn) => {
      fill.style.width = value + '%';
      dial.style.strokeDasharray = value + ' 100';
      label.textContent = text;
      btnText.textContent = btn;
    };
    const frame = (now) => {
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      t = (t + dt) % CYCLE;
      if (t < CHARGE) {
        setPhase('charge');
        const v = Math.floor((t / CHARGE) * 100);
        render(v, v + '%', 'HYPER');
      } else if (t < CHARGE + READY) {
        setPhase('ready');
        render(100, 'TAP HYPER', 'HYPER');
      } else if (t < CHARGE + READY + ACTIVE) {
        setPhase('active');
        const left = CHARGE + READY + ACTIVE - t;
        render((left / ACTIVE) * 100, 'ACTIVE ' + left.toFixed(1) + 's', Math.ceil(left) + 's');
      } else {
        setPhase('cool');
        render(0, '0%', 'HYPER');
      }
      raf = requestAnimationFrame(frame);
    };
    if (reduceMotion) {
      setPhase('active');
      render(100, 'ACTIVE 5.0s', '5s');
    } else if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !raf) { last = 0; raf = requestAnimationFrame(frame); }
          else if (!e.isIntersecting && raf) { cancelAnimationFrame(raf); raf = 0; }
        });
      }, { threshold: 0.2 }).observe(demo);
    } else {
      raf = requestAnimationFrame(frame);
    }
  }

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Platform detection ----------
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isDesktop = !isAndroid && !isIOS && !/Mobi/i.test(ua);
  document.documentElement.classList.add(isAndroid ? 'is-android' : isIOS ? 'is-ios' : 'is-desktop');

  const note = $('#platformNote');
  if (note) {
    if (isIOS) {
      note.innerHTML = '📱 <b>Pickleball Hyper is for Android only.</b> APK files can\'t be installed on iPhone or iPad. To play, open this page on an Android phone.';
      note.hidden = false;
    } else if (isDesktop) {
      note.innerHTML = '💻 <b>You\'re on a computer.</b> Open this page on your Android phone to install, or <a href="#qr">scan the QR code</a> below with your phone.';
      note.hidden = false;
    }
  }

  // QR code for desktop visitors (only if the library loaded)
  if (isDesktop) {
    const qrSection = $('#qr');
    const box = $('#qrBox');
    const drawQR = () => {
      if (!window.QRCode || !box || !qrSection) return false;
      qrSection.hidden = false;
      try {
        new window.QRCode(box, {
          text: location.href.split('#')[0],
          width: 160, height: 160,
          colorDark: '#070d16', colorLight: '#ffffff',
          correctLevel: window.QRCode.CorrectLevel.M,
        });
      } catch (e) { qrSection.hidden = true; }
      return true;
    };
    if (!drawQR()) window.addEventListener('load', drawQR, { once: true });
  }

  // ---------- Download feedback ----------
  const toast = $('#toast');
  let toastTimer;
  const showToast = () => {
    if (!toast) return;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 9000);
  };
  $('#toastClose')?.addEventListener('click', () => toast.classList.remove('show'));

  $$('.js-download').forEach((a) => {
    a.addEventListener('click', () => {
      // The link opens the APK on Google Drive in a new tab.
      // Then show what to do next and bring the install steps into view.
      if (isIOS) return;
      showToast();
      setTimeout(() => {
        const install = $('#install');
        if (install && install.getBoundingClientRect().top > window.innerHeight) {
          install.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 900);
    });
  });

  // ---------- Nav + sticky CTA on scroll ----------
  const nav = $('#nav');
  const sticky = $('#stickyCta');
  const heroCta = $('.hero .btn-xl');
  const bandCta = $('.cta-band .btn-xl');
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 20);
    if (sticky && heroCta) {
      const heroGone = heroCta.getBoundingClientRect().bottom < 0;
      const bandVisible = bandCta ? (() => { const r = bandCta.getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0; })() : false;
      const show = heroGone && !bandVisible;
      sticky.classList.toggle('show', show);
      sticky.setAttribute('aria-hidden', String(!show));
      sticky.querySelector('a').tabIndex = show ? 0 : -1;
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Paddles ----------
  const PADDLES = [
    { brand: 'VANTAGE',  model: 'Carbon Pro 16', shape: 'elongated', c1: '#17191e', c2: '#2d3038', accent: '#e63946', edge: '#e63946', grip: '#1f1f22', power: 8, control: 7 },
    { brand: 'TIDAL',    model: 'Wave 14',       shape: 'standard',  c1: '#0b3d5c', c2: '#1fa2b8', accent: '#e8f7ff', edge: '#0b2a40', grip: '#0b2a40', power: 6, control: 8 },
    { brand: 'EMBER',    model: 'Blaze Wide',    shape: 'wide',      c1: '#24100a', c2: '#ff5a1f', accent: '#ffc23d', edge: '#160904', grip: '#3a1206', power: 9, control: 5 },
    { brand: 'NOVA',     model: 'Pulse',         shape: 'standard',  c1: '#2a1a4a', c2: '#5b2fa0', accent: '#b9f227', edge: '#160d29', grip: '#1a0f2e', power: 7, control: 7 },
    { brand: 'SUMMIT',   model: 'Classic Wood',  shape: 'standard',  c1: '#cfa16a', c2: '#a87545', accent: '#6e4423', edge: '#5a371c', grip: '#4a2e18', power: 5, control: 6 },
    { brand: 'APEX',     model: 'Volt Edge',     shape: 'elongated', c1: '#f2d21b', c2: '#151515', accent: '#ffffff', edge: '#151515', grip: '#151515', power: 8, control: 6 },
    { brand: 'GLACIER',  model: 'Frost Geo',     shape: 'standard',  c1: '#eef6fb', c2: '#7cc3e8', accent: '#2b6f9e', edge: '#2b6f9e', grip: '#d5e3ec', power: 5, control: 9 },
    { brand: 'RIDGE',    model: 'Field Camo',    shape: 'wide',      c1: '#4b5a33', c2: '#2e3a1f', accent: '#8f9460', edge: '#1f2715', grip: '#2e3a1f', power: 7, control: 6 },
    { brand: 'RUBY',     model: 'Strike Gold',   shape: 'standard',  c1: '#8f0f1b', c2: '#c21d2c', accent: '#e7c160', edge: '#e7c160', grip: '#3b0a0f', power: 8, control: 6 },
    { brand: 'MIDNIGHT', model: 'Stealth Raw',   shape: 'elongated', c1: '#0d0f14', c2: '#3a4150', accent: '#8892a6', edge: '#050505', grip: '#111111', power: 9, control: 6 },
    { brand: 'CORAL',    model: 'Reef Lite',     shape: 'standard',  c1: '#ff7e79', c2: '#ffd1a6', accent: '#ffffff', edge: '#e05d57', grip: '#e05d57', power: 5, control: 9 },
    { brand: 'ORBIT',    model: 'Pro Ring',      shape: 'wide',      c1: '#0f2b46', c2: '#16507f', accent: '#ff9f1c', edge: '#ff9f1c', grip: '#0f2b46', power: 7, control: 8 },
  ];
  const SHAPES = {
    standard:  { w: '92px',  h: '118px', r: '44px 44px 30px 30px' },
    elongated: { w: '78px',  h: '134px', r: '38px 38px 24px 24px' },
    wide:      { w: '106px', h: '108px', r: '50px 50px 34px 34px' },
  };
  const rail = $('#paddleRail');
  if (rail) {
    rail.innerHTML = PADDLES.map((p) => {
      const s = SHAPES[p.shape];
      const style = `--w:${s.w};--hgt:${s.h};--r:${s.r};--edge:${p.edge};--grip:${p.grip};--accent:${p.accent};background:linear-gradient(150deg, ${p.c1}, ${p.c2});`;
      return `
        <article class="paddle-card reveal">
          <div class="paddle-art"><div class="paddle" style="${style}"><span class="stripe"></span><span class="logo">${p.brand}</span></div></div>
          <div class="pc-brand">${p.brand}</div>
          <div class="pc-model">${p.model}</div>
          <div class="stat-row"><span>Power</span><span class="bar pw"><i style="width:${p.power * 10}%"></i></span></div>
          <div class="stat-row"><span>Control</span><span class="bar ct"><i style="width:${p.control * 10}%"></i></span></div>
        </article>`;
    }).join('');
  }

  // Arrow buttons for the paddle rail
  $$('.rail-btn').forEach((b) => b.addEventListener('click', () => {
    if (rail) rail.scrollBy({ left: Number(b.dataset.dir) * rail.clientWidth * 0.8, behavior: reduceMotion ? 'auto' : 'smooth' });
  }));

  // ---------- Highlight the nav link for the section on screen ----------
  const navLinks = $$('#navLinks a');
  if ('IntersectionObserver' in window && navLinks.length) {
    const byId = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.classList.remove('active'));
        const link = byId.get(e.target.id);
        if (link) link.classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    byId.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  }

  // ---------- Reveal on scroll ----------
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i % 6, 5) * 60}ms`;
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }
})();
