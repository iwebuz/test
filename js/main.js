/* =========================================================
   iWeb.uz — main.js
   Меню, hero-слайдер, анимированный фон, счётчики,
   фильтр портфолио, форма, блог (поиск, оглавление, прогресс)
   ========================================================= */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- Год в футере ---------- */
  $$('.year').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Хедер при скролле + кнопка «наверх» ---------- */
  var header = $('#header');
  var toTop = $('#toTop');
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 20);
    if (toTop) toTop.classList.toggle('is-visible', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  /* ---------- Мобильное меню ---------- */
  var burger = $('#burger');
  var nav = $('#nav');
  function closeMenu() {
    burger.classList.remove('is-open');
    nav.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
  }
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = !nav.classList.contains('is-open');
      burger.classList.toggle('is-open', open);
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---------- Подсветка активного пункта меню ---------- */
  var navLinks = $$('.nav__link[href^="#"]');
  if (navLinks.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (l) {
          l.classList.toggle('is-active', l.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (l) {
      var sec = $(l.getAttribute('href'));
      if (sec) spy.observe(sec);
    });
  }

  /* ---------- HERO-слайдер ---------- */
  var slidesWrap = $('#heroSlides');
  if (slidesWrap) {
    var slides = $$('.slide', slidesWrap);
    var dotsWrap = $('#heroDots');
    var progress = $('#heroProgress');
    var hero = $('#hero');
    var DURATION = 6500;
    var current = 0;
    var startTime = 0;
    var elapsed = 0;
    var paused = false;
    var rafId;

    slides.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 'slider-dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Слайд ' + (i + 1));
      dot.addEventListener('click', function () { goTo(i); });
      dotsWrap.appendChild(dot);
    });
    var dots = $$('.slider-dot', dotsWrap);

    function goTo(i) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        var active = k === current;
        s.classList.toggle('is-active', active);
        s.setAttribute('aria-hidden', String(!active));
        $$('a', s).forEach(function (a) { a.tabIndex = active ? 0 : -1; });
      });
      dots.forEach(function (d, k) {
        d.classList.toggle('is-active', k === current);
        d.setAttribute('aria-selected', String(k === current));
      });
      elapsed = 0;
      startTime = performance.now();
    }

    function tick(now) {
      if (!paused) {
        var t = elapsed + (now - startTime);
        if (progress) progress.style.width = Math.min(t / DURATION * 100, 100) + '%';
        if (t >= DURATION) goTo(current + 1);
      }
      rafId = requestAnimationFrame(tick);
    }

    function pause() { if (!paused) { paused = true; elapsed += performance.now() - startTime; } }
    function resume() { if (paused) { paused = false; startTime = performance.now(); } }

    $('#heroPrev').addEventListener('click', function () { goTo(current - 1); });
    $('#heroNext').addEventListener('click', function () { goTo(current + 1); });
    hero.addEventListener('mouseenter', pause);
    hero.addEventListener('mouseleave', resume);
    hero.addEventListener('focusin', pause);
    hero.addEventListener('focusout', resume);
    document.addEventListener('visibilitychange', function () { document.hidden ? pause() : resume(); });

    // свайп на мобильных
    var touchX = null;
    hero.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) goTo(current + (dx < 0 ? 1 : -1));
      touchX = null;
    });

    // стрелки клавиатуры, когда фокус внутри слайдера
    hero.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') goTo(current + 1);
      if (e.key === 'ArrowLeft') goTo(current - 1);
    });

    goTo(0);
    if (!reduceMotion) rafId = requestAnimationFrame(tick);
  }

  /* ---------- Футуристичный фон: сеть частиц ---------- */
  function particleField(canvas) {
    if (!canvas || reduceMotion) return;
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w, h, points = [];
    var mouse = { x: -9999, y: -9999 };
    var running = true;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.min(Math.floor(w * h / 14000), 110);
      points = [];
      for (var i = 0; i < count; i++) {
        points.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.6 + 0.4
        });
      }
    }

    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      var LINK = 130;
      for (var i = 0; i < points.length; i++) {
        var p = points[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        // лёгкое притяжение к курсору
        var mdx = mouse.x - p.x, mdy = mouse.y - p.y;
        var md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < 180) { p.x += mdx * 0.004; p.y += mdy * 0.004; }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34,228,255,0.8)';
        ctx.fill();

        for (var j = i + 1; j < points.length; j++) {
          var q = points[j];
          var dx = p.x - q.x, dy = p.y - q.y;
          var d = dx * dx + dy * dy;
          if (d < LINK * LINK) {
            var a = 1 - Math.sqrt(d) / LINK;
            ctx.strokeStyle = 'rgba(139,92,246,' + (a * 0.35) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    canvas.parentElement.addEventListener('mousemove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    canvas.parentElement.addEventListener('mouseleave', function () { mouse.x = mouse.y = -9999; });

    // не рисуем, когда hero вне экрана — экономим батарею
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var vis = entries[0].isIntersecting;
        if (vis && !running) { running = true; draw(); }
        else if (!vis) running = false;
      }).observe(canvas);
    }
    draw();
  }
  particleField($('#heroCanvas'));

  /* ---------- Появление блоков при скролле ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 0.08 + 's';
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Счётчики ---------- */
  var counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = +el.getAttribute('data-count');
        var start = performance.now();
        var dur = reduceMotion ? 1 : 1600;
        (function step(now) {
          var p = Math.min((now - start) / dur, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        })(start);
        co.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  }

  /* ---------- Подсветка карточек за курсором ---------- */
  $$('.card').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- Фильтр портфолио ---------- */
  var filters = $$('.filter');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      filters.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      $$('.work').forEach(function (w) {
        w.classList.toggle('is-hidden', f !== 'all' && w.getAttribute('data-cat') !== f);
      });
    });
  });

  /* ---------- Терминал с «печатающимся» кодом ---------- */
  var codeEl = $('#typeCode');
  if (codeEl) {
    var lines = [
      '<span class="c">// iweb.uz — запуск проекта</span>',
      '<span class="k">const</span> project = {',
      '  client: <span class="s">"Ваш бизнес"</span>,',
      '  design: <span class="s">"уникальный"</span>,',
      '  speed: <span class="s">"&lt; 1 сек"</span>,',
      '  seo: <span class="k">true</span>,',
      '  languages: [<span class="s">"ru"</span>, <span class="s">"uz"</span>, <span class="s">"en"</span>]',
      '};',
      '',
      '<span class="f">launch</span>(project)',
      '  .<span class="f">then</span>(() =&gt; <span class="f">growth</span>(<span class="s">"🚀"</span>));'
    ];
    var full = lines.join('\n');
    var started = false;
    var typeIt = function () {
      if (started) return;
      started = true;
      if (reduceMotion) { codeEl.innerHTML = full; return; }
      // печатаем посимвольно, не разрывая HTML-теги и сущности
      var i = 0;
      (function step() {
        if (i >= full.length) return;
        var ch = full[i];
        if (ch === '<') i = full.indexOf('>', i) + 1;
        else if (ch === '&') i = full.indexOf(';', i) + 1;
        else i++;
        codeEl.innerHTML = full.slice(0, i);
        setTimeout(step, ch === '\n' ? 120 : 22);
      })();
    };
    if ('IntersectionObserver' in window) {
      var to = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { typeIt(); to.disconnect(); } }, { threshold: 0.4 });
      to.observe(codeEl);
    } else typeIt();
  }

  /* ---------- Форма заявки ---------- */
  var form = $('#contactForm');
  if (form) {
    var status = $('#formStatus');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name;
      var phone = form.elements.phone;
      var ok = true;
      [name, phone].forEach(function (f) {
        var bad = !f.value.trim() || (f === phone && f.value.replace(/\D/g, '').length < 9);
        f.classList.toggle('is-invalid', bad);
        if (bad) ok = false;
      });
      if (!ok) {
        status.className = 'form__status is-err';
        status.textContent = 'Пожалуйста, укажите имя и корректный номер телефона.';
        return;
      }

      /*
        Сайт статический, поэтому по умолчанию заявка открывается в почтовом клиенте.
        Для отправки без почтового клиента подключите Formspree / Getform или
        Telegram-бота и замените этот блок на fetch() к выбранному сервису.
      */
      var body = 'Имя: ' + name.value + '\nТелефон: ' + phone.value +
        '\nУслуга: ' + form.elements.service.value + '\n\n' + form.elements.message.value;
      window.location.href = 'mailto:info@iweb.uz?subject=' +
        encodeURIComponent('Заявка с сайта iWeb.uz') + '&body=' + encodeURIComponent(body);

      status.className = 'form__status is-ok';
      status.textContent = 'Спасибо! Мы свяжемся с вами в ближайшее время.';
      form.reset();
    });
  }

  /* ---------- Блог: поиск по статьям ---------- */
  var search = $('#blogSearch');
  if (search) {
    var cards = $$('.posts .post-card');
    var empty = $('#blogEmpty');
    search.addEventListener('input', function () {
      var q = search.value.trim().toLowerCase();
      var shown = 0;
      cards.forEach(function (c) {
        var match = !q || c.textContent.toLowerCase().indexOf(q) !== -1;
        c.classList.toggle('is-hidden', !match);
        if (match) shown++;
      });
      if (empty) empty.classList.toggle('is-visible', shown === 0);
    });
  }

  /* ---------- Статья: оглавление и прогресс чтения ---------- */
  var article = $('.article');
  var toc = $('#toc');
  if (article && toc) {
    var headings = $$('h2', article).filter(function (h) { return !h.closest('.cta-box'); });
    headings.forEach(function (h, i) {
      if (!h.id) h.id = 'section-' + (i + 1);
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      li.appendChild(a);
      toc.appendChild(li);
    });
    var tocLinks = $$('a', toc);
    if ('IntersectionObserver' in window) {
      var ho = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          tocLinks.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('href') === '#' + entry.target.id); });
        });
      }, { rootMargin: '-20% 0px -70% 0px' });
      headings.forEach(function (h) { ho.observe(h); });
    }
  }
  var bar = $('#readingProgress');
  if (bar && article) {
    window.addEventListener('scroll', function () {
      var rect = article.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      var p = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 1;
      bar.style.width = (p * 100) + '%';
    }, { passive: true });
  }
})();
