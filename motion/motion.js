/* téja motion layer. The page is rendered by React from x-dc templates with inline styles,
   so this script never edits markup: it watches the DOM and tags elements with classes
   that motion.css animates. */
(function () {
  if (window.__tejaMotion) return;
  window.__tejaMotion = true;
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Splash: "Welcome to téja". Attached to <html>, outside <body>, so React renders never touch it.
  // The logo src placeholder is replaced with the header logo's src by scripts/apply-motion.js.
  (function splash() {
    var start = Date.now(), MIN = reduce ? 900 : 2100, MAX = 5000, done = false;
    var el = document.createElement('div');
    el.className = 'm-splash';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-label', 'Welcome to téja');
    el.innerHTML = '<span class="m-splash-welcome">Welcome to</span>' +
      '<img class="m-splash-logo" alt="téja" src="__TEJA_LOGO__"><span class="m-splash-line"></span>';
    root.appendChild(el);
    root.classList.add('m-splash-on');

    function dismiss() {
      if (done) return;
      done = true;
      el.classList.add('m-out');
      setTimeout(function () {
        el.classList.add('m-lift');
        root.classList.remove('m-splash-on'); // hero intro plays as the curtain rises
      }, reduce ? 0 : 450);
      setTimeout(function () { el.remove(); }, reduce ? 50 : 1700);
    }
    function ready() { setTimeout(dismiss, Math.max(0, MIN - (Date.now() - start))); }
    if (document.readyState === 'complete') ready();
    else window.addEventListener('load', ready);
    setTimeout(dismiss, MAX);
  })();

  // Announcement bar: on small screens motion.css stacks its messages in one line and shows .m-active.
  // Runs even with reduced motion (the swap is then instant), so the bar never wraps to three lines.
  (function announceBar() {
    var timer = null;
    function setup() {
      var header = document.querySelector('header');
      var bar = header && header.previousElementSibling;
      if (!bar || bar.__mAnnounce || bar.children.length < 2) return;
      bar.__mAnnounce = true;
      bar.classList.add('m-announce');
      var items = bar.children, i = 0;
      items[0].classList.add('m-active');
      clearInterval(timer);
      timer = setInterval(function () {
        if (!bar.isConnected) { clearInterval(timer); return; }
        items[i].classList.remove('m-active');
        i = (i + 1) % items.length;
        items[i].classList.add('m-active');
      }, 3500);
    }
    if ('MutationObserver' in window) new MutationObserver(setup).observe(root, { childList: true, subtree: true });
    setup();
  })();

  if (!('IntersectionObserver' in window) || !('MutationObserver' in window)) return;
  if (reduce) return;
  var STAGGER = 0.08, MAX_STAGGER = 6;

  var io = new IntersectionObserver(function (entries) {
    var shown = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
    shown.sort(function (a, b) { return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1; });
    shown.forEach(function (el, i) {
      el.style.setProperty('--m-delay', Math.min(i, MAX_STAGGER) * STAGGER + 's');
      el.classList.add('m-in');
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

  function reveal(el) {
    el.classList.add('m-reveal');
    io.observe(el);
  }

  function once(el) {
    if (el.__m) return false;
    el.__m = true;
    return true;
  }

  function scan() {
    // Home hero: intro animation plus image parallax
    document.querySelectorAll('section[data-screen-label="Home"]').forEach(function (s) {
      if (!once(s)) return;
      var grid = s.firstElementChild;
      if (!grid) return;
      s.classList.add('m-hero');
      var copy = grid.children[0], media = grid.children[1];
      if (copy && copy.firstElementChild) copy.firstElementChild.classList.add('m-hero-top');
      if (media) media.classList.add('m-hero-media');
      onScroll();
    });

    // Product cards (home + collection), staggered as they enter
    document.querySelectorAll('main a').forEach(function (a) {
      var img = a.firstElementChild;
      if (!img || img.tagName !== 'IMG' || !once(a)) return;
      a.classList.add('m-card');
      reveal(a);
    });

    // Section-level blocks; skip the hero and wrappers whose children reveal on their own
    document.querySelectorAll('main section > *').forEach(function (el) {
      if (!once(el)) return;
      if (el.parentElement.getAttribute('data-screen-label') === 'Home') return;
      if (el.id === 'reviews' || el.querySelector('.m-card')) return;
      reveal(el);
      el.querySelectorAll('img').forEach(function (img) {
        if (getComputedStyle(img).position === 'absolute') img.classList.add('m-zoom');
      });
    });
    document.querySelectorAll('section[data-screen-label="Collection"] aside, #reviews > div:first-child, #reviews > div:last-child > div')
      .forEach(function (el) { if (once(el)) reveal(el); });

    // Cart drawer
    document.querySelectorAll('[data-screen-label="Cart"]').forEach(function (d) {
      if (!once(d)) return;
      d.classList.add('m-drawer');
      if (d.previousElementSibling) d.previousElementSibling.classList.add('m-scrim');
      // Free-delivery progress fill: shipping panel > track > fill
      var bar = d.children[1] && d.children[1].querySelector(':scope > div > div');
      if (bar) bar.classList.add('m-bar');
    });

    // Checkout: each step's heading and fields ease in when the step changes
    document.querySelectorAll('section[data-screen-label="Checkout"] h2').forEach(function (h) {
      if (!once(h)) return;
      // Everything from the heading down to (not including) the Back/Continue bar, the column's last child
      var navBar = h.parentElement.lastElementChild;
      for (var el = h, i = 0; el && el !== navBar; el = el.nextElementSibling, i++) {
        el.classList.add('m-enter');
        el.style.animationDelay = i * 0.06 + 's';
      }
    });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var media = document.querySelector('.m-hero-media');
      if (!media) return;
      // Image is scaled 1.1, so it can shift by up to 5% of its height without exposing an edge
      var max = media.offsetHeight * 0.05;
      root.style.setProperty('--m-hero-y', Math.min(window.scrollY * 0.12, max).toFixed(1) + 'px');
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  new MutationObserver(scan).observe(root, { childList: true, subtree: true });
  if (document.body) scan();
})();
