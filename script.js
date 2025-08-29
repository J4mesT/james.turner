document.addEventListener('DOMContentLoaded', () => {
  /* ---------------- Custom Cursor ---------------- */
  const cursor = document.querySelector('.cursor');
  let mouseX = 0, mouseY = 0, posX = 0, posY = 0, vX = 0, vY = 0;
  const mass = 0.2, damping = 0.7;
  let cursorHalfW = 12.5, cursorHalfH = 12.5;

  if (cursor) {
    const rect = cursor.getBoundingClientRect();
    cursorHalfW = rect.width / 2;
    cursorHalfH = rect.height / 2;
    window.addEventListener('resize', () => {
      const r = cursor.getBoundingClientRect();
      cursorHalfW = r.width / 2; cursorHalfH = r.height / 2;
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

      const cx = posX - cursorHalfW;
      const cy = posY - cursorHalfH;
      cursor.style.transform = `translate(${cx}px, ${cy}px) rotate(${angle}deg) scale(${scale}, ${2 - scale})`;

      requestAnimationFrame(animateCursor);
    })();
  }

  /* ---------------- Elements + Smooth scroll (native) ---------------- */
  const container = document.querySelector('#scroll-container');
  if (!container) {
    console.warn('#scroll-container not found — aborting smooth scroll script.');
    return;
  }

  let scrollTarget = window.scrollY;
  let scrollCurrent = window.scrollY;
  const ease = 0.08;

  window.addEventListener('scroll', () => {
    scrollTarget = window.scrollY;
  }, { passive: true });

  function smoothScroll() {
    scrollCurrent += (scrollTarget - scrollCurrent) * ease;
    if (Math.abs(scrollTarget - scrollCurrent) < 0.01) scrollCurrent = scrollTarget;
    container.style.transform = `translateY(${-scrollCurrent}px)`;
    requestAnimationFrame(smoothScroll);
  }
  smoothScroll();

  /* ---------------- Scatter effect ---------------- */
  const title = document.querySelector('.scatter-text');

  function splitText(el) {
    if (!el) return;
    if (el.querySelector('span')) return;
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
      if (!span.style.transition) span.style.transition = 'transform 700ms cubic-bezier(.2,.8,.2,1), opacity 400ms ease';
    });
  }
  assignRandomTargets();
  window.addEventListener('resize', () => setTimeout(assignRandomTargets, 120));

  // --- NEW scatter-before-scroll logic ---
  let scatterProgress = 0; // 0 → start, 1 → fully scattered
  const scatterSpeed = 0.002; // adjust sensitivity
  let scatterDone = false;

  window.addEventListener("wheel", (e) => {
    if (scatterDone) return; // already unlocked
    e.preventDefault(); // block native scroll

    scatterProgress += e.deltaY * scatterSpeed;
    scatterProgress = Math.min(Math.max(scatterProgress, 0), 1);

    spans.forEach(span => {
      const tx = span.dataset.tx * scatterProgress;
      const ty = span.dataset.ty * scatterProgress;
      const r  = span.dataset.r  * scatterProgress;
      span.style.transform = `translate(${tx}px, ${ty}px) rotate(${r}deg)`;
      span.style.opacity = 0.9 * scatterProgress + 0.1;
    });

    if (scatterProgress >= 1) {
      scatterDone = true;
      document.body.classList.remove("locked"); // allow scroll
    }
  }, { passive: false });

  /* ---------------- Nav active link highlighting ---------------- */
  const navLinks = document.querySelectorAll('.site-nav a');
  const sections = document.querySelectorAll('section[id]');
  if (sections.length && navLinks.length) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.id;
        const link = document.querySelector(`.site-nav a[href="#${id}"]`);
        if (entry.isIntersecting) {
          navLinks.forEach(l => l.classList.remove('active'));
          if (link) link.classList.add('active');
        }
      });
    }, { root: null, rootMargin: '0px', threshold: 0.55 });
    sections.forEach(s => obs.observe(s));
  }

  // quick sync after keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (['PageDown','PageUp','ArrowDown','ArrowUp','Home','End'].includes(e.key)) {
      setTimeout(() => { scrollTarget = window.scrollY; }, 60);
    }
  }, { passive: true });

}); // DOMContentLoaded
