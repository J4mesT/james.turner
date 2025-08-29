document.addEventListener('DOMContentLoaded', () => {
  // ---------------- Custom Cursor ----------------
  const cursor = document.querySelector('.cursor');
  let mouseX = 0, mouseY = 0, posX = 0, posY = 0, vX = 0, vY = 0;
  const mass = 0.2, damping = 0.7;
  let cursorHalfW = 12.5, cursorHalfH = 12.5; // defaults for 25x25 cursor

  if (cursor) {
    // measure cursor size (in case you change it in CSS)
    const rect = cursor.getBoundingClientRect();
    cursorHalfW = rect.width / 2;
    cursorHalfH = rect.height / 2;

    window.addEventListener('resize', () => {
      const r = cursor.getBoundingClientRect();
      cursorHalfW = r.width / 2;
      cursorHalfH = r.height / 2;
    });

    document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });

    (function animateCursor(){
      const ax = (mouseX - posX) * mass;
      const ay = (mouseY - posY) * mass;
      vX = (vX + ax) * damping;
      vY = (vY + ay) * damping;
      posX += vX; posY += vY;

      const speed = Math.hypot(vX, vY);
      const scale = 1 + Math.min(speed / 20, 0.5);
      const angle = Math.atan2(vY, vX) * 180 / Math.PI;

      // center the cursor on the mouse
      const cx = posX - cursorHalfW;
      const cy = posY - cursorHalfH;

      cursor.style.transform = `translate(${cx}px, ${cy}px) rotate(${angle}deg) scale(${scale}, ${2 - scale})`;
      requestAnimationFrame(animateCursor);
    })();
  }

  // ---------------- Elements ----------------
  const container = document.querySelector('#scroll-container');
  if (!container) {
    console.warn('#scroll-container not found — aborting smooth scroll script.');
    return;
  }

  // ---------------- Smooth scroll (native window scroll) ----------------
  let scrollTarget = window.scrollY;
  let scrollCurrent = 0;
  const ease = 0.08;

  // update target when the user scrolls natively (wheel, touch, keyboard, etc.)
  window.addEventListener('scroll', () => {
    scrollTarget = window.scrollY;
  }, { passive: true });

  function smoothScroll() {
    scrollCurrent += (scrollTarget - scrollCurrent) * ease;
    if (Math.abs(scrollTarget - scrollCurrent) < 0.01) scrollCurrent = scrollTarget;
    container.style.transform = `translateY(${-scrollCurrent}px)`;
    updateScatter(scrollCurrent);
    requestAnimationFrame(smoothScroll);
  }
  smoothScroll();

  // ---------------- Scatter effect ----------------
  const title = document.querySelector('.scatter-text');
  const hero = document.querySelector('.hero');

  // split text into spans if not already split
  function splitText(el) {
    if (!el) return;
    if (el.querySelector('span')) return; // already split
    const html = el.innerHTML.replace(/<br\s*\/?>/gi, '\n');
    el.innerHTML = '';
    for (let ch of html) {
      if (ch === '\n') { el.appendChild(document.createElement('br')); continue; }
      const span = document.createElement('span');
      span.textContent = (ch === ' ') ? '\u00A0' : ch;
      el.appendChild(span);
    }
  }
  splitText(title);

  let spans = title ? [...title.querySelectorAll('span')] : [];

  function assignRandomTargets() {
    spans = title ? [...title.querySelectorAll('span')] : [];
    spans.forEach(span => {
      span.dataset.tx = ((Math.random() - 0.5) * window.innerWidth).toFixed(1);
      span.dataset.ty = ((Math.random() - 0.5) * window.innerHeight).toFixed(1);
      span.dataset.r  = ((Math.random() - 0.5) * 720).toFixed(1);
      span.style.willChange = 'transform';
      // ensure transitions exist (can be overridden by CSS)
      if (!span.style.transition) span.style.transition = 'transform 700ms cubic-bezier(.2,.8,.2,1), opacity 400ms ease';
    });
  }
  assignRandomTargets();
  window.addEventListener('resize', () => {
    // recompute targets on resize
    setTimeout(assignRandomTargets, 120);
  });

  let scattered = false;
  function updateScatter(scrollY) {
    if (!hero || !title) return;
    const threshold = hero.offsetHeight * 0.3;
    if (scrollY > threshold && !scattered) {
      scattered = true;
      title.classList.add('scattered');
      spans.forEach(span => {
        span.style.transform = `translate(${span.dataset.tx}px, ${span.dataset.ty}px) rotate(${span.dataset.r}deg)`;
        span.style.opacity = '0.9';
      });
    } else if (scrollY <= threshold && scattered) {
      scattered = false;
      title.classList.remove('scattered');
      spans.forEach(span => {
        span.style.transform = 'translate(0,0) rotate(0)';
        span.style.opacity = '';
      });
    }
  }

  // trigger an initial update (in case page is loaded scrolled)
  scrollTarget = window.scrollY;
  scrollCurrent = window.scrollY;
  container.style.transform = `translateY(${-scrollCurrent}px)`;
  updateScatter(scrollCurrent);

  // optional: keyboard page up/down support to update scrollTarget quickly when user uses keys
  window.addEventListener('keydown', (e) => {
    if (['PageDown','PageUp','ArrowDown','ArrowUp','Home','End'].includes(e.key)) {
      // let the browser handle the native scroll; we just sync scrollTarget after a short delay
      setTimeout(() => { scrollTarget = window.scrollY; }, 50);
    }
  }, { passive: true });
});
