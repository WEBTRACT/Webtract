/* Webtract - main.js
   No secret keys here. Nothing is sent to any server:
   the contact form opens WhatsApp with the message ready to send. */
(function () {
  'use strict';

  var root = document.documentElement;
  var WHATSAPP = '27786350274';
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function go() { root.classList.add('go'); }

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function startParticles(canvas, word, mark) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = window.innerWidth, H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* 1. Draw the logo and name on a hidden canvas so we know where particles should go */
    var off = document.createElement('canvas');
    off.width = W; off.height = H;
    var o = off.getContext('2d');
    o.fillStyle = '#fff'; o.strokeStyle = '#fff';
    o.textAlign = 'center'; o.textBaseline = 'middle';
    var cs = getComputedStyle(word);
    var gap = parseFloat(cs.letterSpacing) || 0;
    o.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
    var spans = word.children;
    for (var i = 0; i < spans.length; i++) {
      var r = spans[i].getBoundingClientRect();
      o.fillText(spans[i].textContent, r.left + (r.width - gap) / 2, r.top + r.height / 2);
    }
    var m = mark.getBoundingClientRect();
    var sx = m.width / 120, sy = m.height / 80;
    o.lineWidth = 4; o.lineCap = 'round'; o.lineJoin = 'round';
    o.beginPath();
    [[8, 14], [36, 68], [60, 28], [84, 68], [112, 14]].forEach(function (p, k) {
      var x = m.left + p[0] * sx, y = m.top + p[1] * sy;
      if (k === 0) { o.moveTo(x, y); } else { o.lineTo(x, y); }
    });
    o.moveTo(m.left + 90 * sx, m.top + 14 * sy);
    o.lineTo(m.left + 112 * sx, m.top + 14 * sy);
    o.lineTo(m.left + 112 * sx, m.top + 36 * sy);
    o.stroke();

    /* 2. Turn the drawing into points */
    var data = o.getImageData(0, 0, W, H).data;
    var step = 2, pts = [];
    for (var y = 0; y < H; y += step) {
      for (var x = 0; x < W; x += step) {
        if (data[(y * W + x) * 4 + 3] > 128) { pts.push([x, y]); }
      }
    }
    var keep = Math.min(1, 3600 / pts.length);
    var ps = [];
    for (var n = 0; n < pts.length; n++) {
      if (Math.random() > keep) { continue; }
      ps.push({
        tx: pts[n][0], ty: pts[n][1],
        sx: Math.random() * W, sy: Math.random() * H,
        d: Math.random() * 0.9, u: 1.0 + Math.random() * 0.6,
        c: (Math.random() - 0.5) * 180, z: 0.8 + Math.random() * 1.1,
        a: Math.random() * Math.PI * 2, v: 40 + Math.random() * 160
      });
    }

    /* 3. Animate: gather, hold, then drift away */
    var t0 = performance.now();
    var frame = function (now) {
      if (introDone) { ctx.clearRect(0, 0, W, H); return; }
      var t = (now - t0) / 1000;
      var out = t > 2.9 ? Math.min(1, (t - 2.9) / 1.1) : 0;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#E7E2D8';
      for (var k = 0; k < ps.length; k++) {
        var p = ps[k];
        var e = (t - p.d) / p.u;
        if (e <= 0) { continue; }
        if (e > 1) { e = 1; }
        var q = 1 - Math.pow(1 - e, 4);
        var px = p.sx + (p.tx - p.sx) * q;
        var py = p.sy + (p.ty - p.sy) * q + Math.sin(Math.PI * q) * p.c;
        if (out > 0) { var s = out * out; px += Math.cos(p.a) * p.v * s; py += Math.sin(p.a) * p.v * s; }
        ctx.globalAlpha = Math.min(1, e * 2.2) * (1 - out) * 0.9;
        ctx.fillRect(px, py, p.z, p.z);
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  /* ---------- Intro animation ---------- */
  var loader = document.getElementById('loader');
  var introDone = false;

  function removeLoader() {
    root.classList.remove('intro');
    if (loader && loader.parentNode) { loader.parentNode.removeChild(loader); }
    try { sessionStorage.setItem('wt_intro', '1'); } catch (e) { /* ignore */ }
  }

  function finishIntro() {
    if (introDone) { return; }
    introDone = true;
    var cnt = document.getElementById('loader-count');
    if (cnt) { cnt.textContent = '100'; }
    loader.classList.add('done');
    setTimeout(go, 450);
    setTimeout(removeLoader, 1800);
  }

  if (loader && root.classList.contains('intro')) {
    /* Wordmark: letters appear one by one, soft and slow */
    var word = loader.querySelector('.loader-word');
    var text = word.getAttribute('data-text') || 'WEBTRACT';
    word.textContent = '';
    for (var i = 0; i < text.length; i++) {
      var s = document.createElement('span');
      s.textContent = text.charAt(i);
      s.style.animationDelay = (2.0 + i * 0.07) + 's';
      word.appendChild(s);
    }
    /* Particles gather into the logo and name, then scatter */
    var cv = document.getElementById('loader-canvas');
    if (cv && cv.getContext) {
      try { startParticles(cv, word, loader.querySelector('.loader-w')); } catch (err) { /* text still shows without it */ }
    }

    /* Counter 000 to 100 */
    var cnt2 = document.getElementById('loader-count');
    var t0 = performance.now();
    var DUR = 3600;
    var tick = function (now) {
      if (introDone) { return; }
      var p = Math.min(1, (now - t0) / DUR);
      var e = 1 - Math.pow(1 - p, 3);
      if (cnt2) { cnt2.textContent = ('00' + Math.round(e * 100)).slice(-3); }
      if (p < 1) { requestAnimationFrame(tick); }
    };
    requestAnimationFrame(tick);

    setTimeout(finishIntro, 4100);
    loader.addEventListener('click', finishIntro); /* tap to skip */
  } else {
    if (loader && loader.parentNode) { loader.parentNode.removeChild(loader); }
    go();
  }

  /* ---------- Process line fills as you scroll ---------- */
  var steps = document.querySelector('.steps');
  if (steps) {
    var items = steps.querySelectorAll('.step');
    var update = function () {
      var r = steps.getBoundingClientRect();
      var mark = window.innerHeight * 0.6;
      var p = (mark - r.top) / r.height;
      p = Math.max(0, Math.min(1, p));
      steps.style.setProperty('--p', p.toFixed(3));
      for (var k = 0; k < items.length; k++) {
        items[k].classList.toggle('on', items[k].getBoundingClientRect().top < mark);
      }
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- Gentle 3D tilt on the hero picture (mouse only) ---------- */
  var hero = document.querySelector('.hero');
  var tilt = document.querySelector('.mock-wrap');
  if (hero && tilt && !calm && window.matchMedia('(hover: hover)').matches) {
    hero.addEventListener('mousemove', function (e) {
      var x = e.clientX / window.innerWidth - 0.5;
      var y = e.clientY / window.innerHeight - 0.5;
      tilt.style.transform = 'rotateY(' + (x * -9).toFixed(2) + 'deg) rotateX(' + (y * 7).toFixed(2) + 'deg)';
    });
    hero.addEventListener('mouseleave', function () { tilt.style.transform = ''; });
  }

  /* ---------- Things glide in as you scroll ---------- */
  if ('IntersectionObserver' in window) {
    var targets = document.querySelectorAll('.svc, .inc-grid li, .faq-list details, .cta-band .wrap, .section-title');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    for (var q = 0; q < targets.length; q++) {
      targets[q].classList.add('rv');
      targets[q].style.transitionDelay = ((q % 3) * 0.08) + 's';
      io.observe(targets[q]);
    }
  }

  /* ---------- Soft light that follows the mouse in the hero ---------- */
  if (hero && !calm && window.matchMedia('(hover: hover)').matches) {
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      hero.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }

  /* ---------- Footer year ---------- */
  var yr = document.getElementById('yr');
  if (yr) { yr.textContent = new Date().getFullYear(); }

  /* ---------- Contact form ---------- */
  var form = document.getElementById('contact-form');
  if (form) {
    var status = document.getElementById('form-status');
    var el = form.elements;

    var setError = function (field, msg) {
      var box = document.getElementById('err-' + field.name);
      if (box) { box.textContent = msg; }
      if (msg) { field.setAttribute('aria-invalid', 'true'); } else { field.removeAttribute('aria-invalid'); }
      return !msg;
    };

    var check = function () {
      var ok = true;
      var name = el.fullname.value.trim();
      var email = el.email.value.trim();
      var phone = el.phone.value.replace(/[\s\-()]/g, '');
      var msg = el.message.value.trim();

      ok = setError(el.fullname, name.length < 2 ? 'Please enter your name.' : '') && ok;
      ok = setError(el.email, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? 'Please enter a valid email, like name@example.co.za.' : '') && ok;
      ok = setError(el.phone, phone && !/^(\+27|0)[1-9][0-9]{8}$/.test(phone) ? 'Use a South African number, like 078 635 0274 or +27 78 635 0274.' : '') && ok;
      ok = setError(el.message, msg.length < 10 ? 'Please tell us a little about what you need (at least 10 characters).' : '') && ok;
      return ok;
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = '';

      /* Spam trap: real people never see or fill this field */
      if (el.website.value) { status.textContent = 'Thank you!'; return; }

      if (!check()) {
        status.textContent = 'Please fix the highlighted fields.';
        var bad = form.querySelector('[aria-invalid="true"]');
        if (bad) { bad.focus(); }
        return;
      }

      var lines = [
        'Hi Webtract, my name is ' + el.fullname.value.trim() + '.',
        'Service I need: ' + el.service.value,
        'Email: ' + el.email.value.trim()
      ];
      if (el.phone.value.trim()) { lines.push('Phone: ' + el.phone.value.trim()); }
      lines.push('', el.message.value.trim());

      var url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(lines.join('\n'));
      status.innerHTML = 'Opening WhatsApp… If nothing opens, <a href="' + url + '" target="_blank" rel="noopener">tap here to send your message</a>.';
      window.open(url, '_blank', 'noopener');
    });

    form.addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true') { check(); }
    });
  }
})();
