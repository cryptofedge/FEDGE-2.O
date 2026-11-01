/* FEDGE 2.O homepage motion: Lenis smooth scrolling + GSAP (ScrollTrigger, SplitText).
   Effects in the spirit of React Bits (split-text and blur reveals, shiny text, count-up, spotlight + tilt cards,
   magnetic buttons) rebuilt with GSAP, since the page has no React. The libraries are self-hosted in assets/vendor
   (GSAP: standard no-charge license; Lenis: MIT), so no new third party sees visitors.
   Nothing runs for prefers-reduced-motion. The hero only starts hidden while <html> has the "motion" class, which an
   inline script in <head> removes after 3 s unless this file has started (window.__fx), so a failed load never
   leaves the page blank. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.gsap || !window.ScrollTrigger || !window.SplitText || !window.Lenis) {
    root.classList.remove('motion');
    return;
  }
  window.__fx = true;
  root.classList.add('fx');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  gsap.registerPlugin(ScrollTrigger, SplitText);
  var $ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };

  /* ── SMOOTH SCROLLING ── wheel and trackpad glide; touch keeps the phone's own scrolling */
  var lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);
  $('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      var target = id.length > 1 && document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -80, duration: 1.4 });
    });
  });

  /* ── SCROLL PROGRESS ── a thin orange-to-cyan line along the top */
  var bar = document.createElement('div');
  bar.className = 'fx-progress';
  document.body.appendChild(bar);
  gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  /* ── HERO INTRO ── */
  var hero = document.getElementById('hero');
  var title = hero && hero.querySelector('h1.glitch');
  var intro = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: function () { root.classList.remove('motion'); } });
  if (hero) {
    var copy = $('.hero-copy > *', hero);
    gsap.set(copy.concat($('.hero-visual', hero)), { autoAlpha: 1 });
    intro.from('.powered-by-eclat', { y: 18, autoAlpha: 0, duration: 0.6 });
    if (title) {
      // blur-in letters (the glitch layers wait until the word has landed)
      title.classList.add('fx-intro');
      // words keep each word's letters on one line while they animate
      var split = new SplitText(title, { type: 'words,chars' });
      intro.from(split.chars, { yPercent: 70, autoAlpha: 0, filter: 'blur(12px)', duration: 0.9, stagger: 0.06 }, '-=0.2')
        .add(function () { split.revert(); title.classList.remove('fx-intro'); });
    }
    intro.from(['.hero-by', '.hero-slogan'], { y: 14, autoAlpha: 0, duration: 0.6, stagger: 0.12 }, '-=0.35');
    var sub = hero.querySelector('.hero-sub');
    if (sub) {
      var subSplit = new SplitText(sub, { type: 'lines', mask: 'lines' });
      intro.from(subSplit.lines, { yPercent: 100, duration: 0.8, stagger: 0.08 }, '-=0.3')
        .add(function () { subSplit.revert(); });
    }
    intro.from('.hero-copy .cta-box > *', { y: 24, autoAlpha: 0, duration: 0.6, stagger: 0.08, ease: 'back.out(1.6)', clearProps: 'transform' }, '-=0.4')
      .from(['.hero-copy .store-row', '.hero-domain'], { y: 12, autoAlpha: 0, duration: 0.5, stagger: 0.1 }, '-=0.3')
      .from('.hero-visual', { scale: 0.82, rotation: -8, autoAlpha: 0, duration: 1.4, ease: 'expo.out' }, 0.2);

    // the logo drifts as the hero scrolls away, and leans toward the pointer
    gsap.to('.hero-visual', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    var logo = hero.querySelector('.main-f-logo');
    if (fine && logo) {
      var lx = gsap.quickTo(logo, 'x', { duration: 0.8, ease: 'power3' });
      var ly = gsap.quickTo(logo, 'y', { duration: 0.8, ease: 'power3' });
      hero.addEventListener('pointermove', function (e) {
        lx((e.clientX / window.innerWidth - 0.5) * 28);
        ly((e.clientY / window.innerHeight - 0.5) * 28);
      });
    }
  }

  /* ── SECTION HEADINGS ── labels slide in, titles rise letter by letter */
  $('.label-cyan').forEach(function (el) {
    gsap.from(el, { x: -24, autoAlpha: 0, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  $('.title-main').forEach(function (el) {
    var s = new SplitText(el, { type: 'words,chars' });
    gsap.set(el, { perspective: 600 });
    gsap.from(s.chars, {
      yPercent: 90, rotationX: -70, autoAlpha: 0, duration: 0.8, ease: 'power4.out', stagger: 0.025,
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      onComplete: function () { s.revert(); },
    });
  });
  $('.section-desc, .about-lead, .about-note').forEach(function (el) {
    var s = new SplitText(el, { type: 'lines', mask: 'lines' });
    gsap.from(s.lines, {
      yPercent: 100, duration: 0.8, ease: 'power3.out', stagger: 0.06,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onComplete: function () { s.revert(); },
    });
  });
  $('.about-portrait').forEach(function (el) {
    gsap.from(el, { clipPath: 'inset(0 100% 0 0)', scale: 1.06, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 80%', once: true } });
  });

  /* ── CARDS AND ROWS ── rise in batches as they arrive */
  var groups = ['.pillar', '.domain', '.game-card', '.earn-step', '.access-item', '.store-btn:not(.hero-copy .store-btn)', '.donation-section', '.earn-note'];
  groups.forEach(function (sel) {
    var els = $(sel);
    if (!els.length) return;
    gsap.set(els, { autoAlpha: 0, y: 40 });
    ScrollTrigger.batch(els, {
      start: 'top 90%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08, overwrite: true });
      },
    });
  });

  /* ── COUNT-UP ── prices tick up to their value */
  $('.access-value').forEach(function (el) {
    var m = el.textContent.trim().match(/^\$(\d+(?:\.\d+)?)$/);
    if (!m) return;
    var end = parseFloat(m[1]);
    var n = { v: 0 };
    el.textContent = '$0.00';
    gsap.to(n, {
      v: end, duration: 1.4, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: function () { el.textContent = '$' + n.v.toFixed(2); },
    });
  });

  /* ── POINTER EFFECTS (mouse and trackpad only) ── */
  if (fine) {
    // spotlight + tilt on game cards; lift on pillars
    $('.game-card').forEach(function (card) {
      card.classList.add('fx-card');
      var spot = document.createElement('span');
      spot.className = 'fx-spot';
      card.appendChild(spot);
      var rx = gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3' });
      var ry = gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3' });
      gsap.set(card, { transformPerspective: 900 });
      card.addEventListener('pointerenter', function () { gsap.to(card, { y: -8, duration: 0.35, ease: 'power3.out' }); });
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        ry((px - 0.5) * 10);
        rx((0.5 - py) * 8);
      });
      card.addEventListener('pointerleave', function () { rx(0); ry(0); gsap.to(card, { y: 0, duration: 0.5, ease: 'power3.out' }); });
    });
    $('.pillar').forEach(function (p) {
      p.classList.add('fx-card');
      p.addEventListener('pointerenter', function () { gsap.to(p, { y: -6, duration: 0.35, ease: 'power3.out' }); });
      p.addEventListener('pointerleave', function () { gsap.to(p, { y: 0, duration: 0.5, ease: 'power3.out' }); });
    });
    // magnetic buttons: they lean toward the pointer and settle back
    $('.btn-cyber, .btn-ghost, .nav-cta, .btn-donate').forEach(function (btn) {
      btn.classList.add('fx-magnet');
      var mx = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3' });
      var my = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3' });
      var big = btn.classList.contains('btn-cyber');
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.3);
        my((e.clientY - (r.top + r.height / 2)) * 0.3);
      });
      btn.addEventListener('pointerenter', function () { if (big) gsap.to(btn, { scale: 1.05, duration: 0.3 }); });
      btn.addEventListener('pointerleave', function () { mx(0); my(0); if (big) gsap.to(btn, { scale: 1, duration: 0.4 }); });
    });
  }

  // fonts and the video can shift the layout after load; re-measure the triggers then
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
