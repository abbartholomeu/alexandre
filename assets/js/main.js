/* Alexandre · Pinturas, Instalações e Manutenção
   JavaScript moderno (ES2020+), sem backend. GSAP/Lenis são opcionais:
   se a CDN não carregar, o site continua funcionando com IntersectionObserver. */
(() => {
  'use strict';

  const WA_NUMBER = '5516981556203';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const waLink = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

  root.classList.add('js');

  /* ---------- Tema claro/escuro ---------- */
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignora */ } },
  };
  const applyTheme = (t) => root.setAttribute('data-theme', t);
  const currentTheme = () => root.getAttribute('data-theme')
    || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(store.get('theme') || currentTheme());
  $('.theme-toggle')?.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    store.set('theme', next);
  });

  /* ---------- Menu mobile ---------- */
  const header = $('.header');
  const menuBtn = $('.menu-toggle');
  const setMenu = (open) => {
    header.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  };
  menuBtn?.addEventListener('click', () => setMenu(!header.classList.contains('menu-open')));
  $$('.nav a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));

  /* ---------- Header ao rolar + link ativo ---------- */
  const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const navLinks = $$('.nav a');
  const sections = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const navIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${en.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => navIO.observe(s));

  /* ---------- Links de WhatsApp por serviço ---------- */
  $$('[data-service]').forEach((a) => {
    a.href = waLink(`Olá, Alexandre! Gostaria de um orçamento para: ${a.dataset.service}.`);
  });

  /* ---------- Filtro de serviços ---------- */
  const chips = $$('.chip');
  const cards = $$('.services__grid .card');
  chips.forEach((chip) => chip.addEventListener('click', () => {
    const f = chip.dataset.filter;
    chips.forEach((c) => {
      const on = c === chip;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-selected', String(on));
    });
    const update = () => cards.forEach((card) => {
      const show = f === 'todos' || card.dataset.cat.split(' ').includes(f);
      card.classList.toggle('is-hidden', !show);
      if (show) { card.style.opacity = 1; card.style.transform = ''; }
    });
    document.startViewTransition && !reduceMotion ? document.startViewTransition(update) : update();
  }));

  /* ---------- Brilho que segue o mouse nos cards ---------- */
  cards.forEach((card) => card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }));

  /* ---------- Efeito 3D (tilt) na imagem do hero ---------- */
  const tilt = $('[data-tilt]');
  if (tilt && !reduceMotion && matchMedia('(hover: hover)').matches) {
    const area = tilt.parentElement;
    area.addEventListener('pointermove', (e) => {
      const r = area.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
    });
    area.addEventListener('pointerleave', () => { tilt.style.transform = ''; });
  }

  /* ---------- Texto rotativo no título ---------- */
  const rot = $('[data-rotate]');
  if (rot && !reduceMotion) {
    let words = [];
    try { words = JSON.parse(rot.dataset.rotate); } catch { /* ignora */ }
    let i = 0;
    const typeWord = async (w) => {
      for (let n = rot.textContent.length; n >= 0; n--) { rot.textContent = rot.textContent.slice(0, n); await wait(28); }
      for (let n = 1; n <= w.length; n++) { rot.textContent = w.slice(0, n); await wait(55); }
    };
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    if (words.length > 1) {
      (async function loop() {
        await wait(2600);
        i = (i + 1) % words.length;
        await typeWord(words[i]);
        loop();
      })();
    }
  }

  /* ---------- Formulário -> WhatsApp ---------- */
  const form = $('#form-orcamento');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    form.classList.add('was-validated');
    const err = $('.form__error', form);
    if (!form.checkValidity()) {
      err.hidden = false;
      form.querySelector(':invalid')?.focus();
      return;
    }
    err.hidden = true;
    const d = Object.fromEntries(new FormData(form));
    const lines = [
      `Olá, Alexandre! Meu nome é ${d.nome.trim()}.`,
      `Gostaria de um orçamento para: *${d.servico}*.`,
      d.bairro?.trim() ? `Local: ${d.bairro.trim()}.` : '',
      '',
      d.mensagem.trim(),
    ].filter((l, idx) => l !== '' || idx === 3);
    window.open(waLink(lines.join('\n')), '_blank', 'noopener');
  });

  /* ---------- Dica no botão flutuante ---------- */
  const wa = $('.wa-float');
  if (wa) {
    setTimeout(() => wa.classList.add('show-tip'), 4000);
    setTimeout(() => wa.classList.remove('show-tip'), 9000);
  }

  /* ---------- Ano no rodapé ---------- */
  const ano = $('#ano');
  if (ano) ano.textContent = new Date().getFullYear();

  /* ---------- Animações de entrada ---------- */
  const reveals = $$('.reveal');
  const fallbackReveal = () => {
    if (!('IntersectionObserver' in window) || reduceMotion) {
      reveals.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  };

  const initLibs = () => {
    // Rolagem suave (Lenis), se disponível
    if (window.Lenis && !reduceMotion) {
      const lenis = new window.Lenis({ lerp: 0.1, anchors: { offset: -80 } });
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
      if (window.ScrollTrigger) lenis.on('scroll', window.ScrollTrigger.update);
    }

    const { gsap, ScrollTrigger } = window;
    if (!gsap || !ScrollTrigger || reduceMotion) return fallbackReveal();

    gsap.registerPlugin(ScrollTrigger);
    root.classList.add('gsap-on');

    // Hero: entrada em sequência
    const heroEls = $$('.hero .reveal');
    gsap.fromTo(heroEls, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0.1 });

    // Demais elementos
    $$('.reveal').filter((el) => !el.closest('.hero')).forEach((el) => {
      gsap.fromTo(el, { y: 36, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });

    // Cards de serviço em cascata
    ScrollTrigger.batch('.services__grid .card', {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => gsap.fromTo(batch, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power2.out', clearProps: 'transform' }),
    });
    gsap.set('.services__grid .card', { opacity: 0 });

    // Parallax sutil nos blobs e na imagem "sobre"
    gsap.to('.blob--1', { yPercent: 40, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.about__frame', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true } });
  };

  // Scripts são "defer": ao chegar aqui as libs já carregaram (ou falharam).
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initLibs);
  else initLibs();
})();
