'use strict';

/*
  Robust scroll trigger:
  - checks hero.getBoundingClientRect() (works even when scroll events are strange)
  - IntersectionObserver fallback
  - listens to scroll/wheel/touchmove
  - keep click toggle for instant verification
*/

// expose scatter for debugging
window.__scatter = null;

class ScatterText {
  constructor(element) {
    this.element = element || null;
    this.chars = [];
    this.isScattered = false;
    if (this.element) this._wrapCharsPreservingBR();
  }

  _wrapCharsPreservingBR() {
    const frag = document.createDocumentFragment();
    const nodes = Array.from(this.element.childNodes);

    nodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        for (const ch of text) {
          const span = document.createElement('span');
          span.className = 'char';
          span.textContent = ch === ' ' ? '\u00A0' : ch;
          this.chars.push(span);
          frag.appendChild(span);
        }
      } else if (node.nodeName === 'BR') {
        frag.appendChild(document.createElement('br'));
      } else {
        // flatten other nodes' text as chars
        const inner = node.textContent || '';
        for (const ch of inner) {
          const span = document.createElement('span');
          span.className = 'char';
          span.textContent = ch === ' ' ? '\u00A0' : ch;
          this.chars.push(span);
          frag.appendChild(span);
        }
      }
    });

    this.element.innerHTML = '';
    this.element.appendChild(frag);
  }

  scatter(intensity = 1) {
    if (!this.element || this.isScattered) return;
    this.isScattered = true;

    this.chars.forEach((span, index) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = (90 + Math.random() * 170) * intensity;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const rotation = (Math.random() - 0.5) * 360;
      const scale = 0.6 + Math.random() * 0.7;

      setTimeout(() => {
        span.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(${scale})`;
        span.style.opacity = '0.25';
      }, index * 18);
    });
  }

  gather() {
    if (!this.element || !this.isScattered) return;
    this.isScattered = false;

    this.chars.forEach((span, index) => {
      setTimeout(() => {
        span.style.transform = 'translate3d(0,0,0) rotate(0deg) scale(1)';
        span.style.opacity = '1';
      }, index * 14);
    });
  }

  toggle() {
    if (this.isScattered) this.gather(); else this.scatter();
  }
}

/* ---------- initialization & cursor ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // cursor setup
  const cursor = document.querySelector('.cursor');
  let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
  });

  function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.15;
    cursorY += (mouseY - cursorY) * 0.15;
    if (cursor) cursor.style.transform = `translate(${cursorX - 12.5}px, ${cursorY - 12.5}px)`;
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // instantiate scatter
  const titleEl = document.querySelector('.scatter-text');
  const hero = document.querySelector('.hero');
  let scatterTitle = null;
  if (titleEl) {
    scatterTitle = new ScatterText(titleEl);
    // quick test toggle by clicking the title
    titleEl.addEventListener('click', () => scatterTitle.toggle());
    window.__scatter = scatterTitle; // expose for console tests
  }

  // unlock scrolling (in case scatter-locked was present)
  // keep short delay so visual doesn't jump
  setTimeout(() => document.body.classList.remove('scatter-locked'), 350);

  /* ---------- robust scroll detection ---------- */

  // primary check using hero bounding rect (very reliable)
  function checkScrollState() {
    if (!scatterTitle || !hero) return;
    const rect = hero.getBoundingClientRect();
    // scrolledPast becomes true as soon as you scroll the hero off the top a bit
    const scrolledPast = rect.top < -8; // tiny tolerance so small jitters don't trigger
    if (scrolledPast && !scatterTitle.isScattered) {
      const intensity = Math.min(2, 1 + Math.abs(rect.top) / window.innerHeight);
      scatterTitle.scatter(intensity);
    } else if (!scrolledPast && scatterTitle.isScattered) {
      scatterTitle.gather();
    }
  }

  // attach listeners: scroll, wheel, touchmove -> all call checkScrollState via rAF
  let pending = false;
  function scheduleCheck() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      checkScrollState();
      pending = false;
    });
  }
  window.addEventListener('scroll', scheduleCheck, { passive: true });
  window.addEventListener('wheel', scheduleCheck, { passive: true });
  window.addEventListener('touchmove', scheduleCheck, { passive: true });

  // intersection observer fallback (fires when hero leaves/enters viewport)
  if (hero && window.IntersectionObserver) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!scatterTitle) return;
        if (!entry.isIntersecting && !scatterTitle.isScattered) {
          scatterTitle.scatter();
        } else if (entry.isIntersecting && scatterTitle.isScattered) {
          scatterTitle.gather();
        }
      });
    }, { root: null, threshold: 0.1 });
    io.observe(hero);
  }

  // initial run (in case page initially loaded scrolled)
  requestAnimationFrame(checkScrollState);

  /* ---------- nav active state (unchanged) ---------- */
  function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.site-nav a');
    let currentSection = 'home';

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 100 && rect.bottom >= 100) {
        currentSection = section.id;
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  }
  window.addEventListener('scroll', updateActiveNav, { passive: true });

  /* ---------- cursor hover effects (using same cursorX/local cursorY) ---------- */
  document.addEventListener('mouseover', (e) => {
    if (!cursor) return;
    if (e.target.closest('a, button, [role="button"]')) {
      cursor.style.transform = `translate(${cursorX - 20}px, ${cursorY - 20}px) scale(1.6)`;
      cursor.style.background = '#ff6b6b';
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (!cursor) return;
    if (e.target.closest('a, button, [role="button"]')) {
      cursor.style.transform = `translate(${cursorX - 12.5}px, ${cursorY - 12.5}px) scale(1)`;
      cursor.style.background = '#4285f4';
    }
  });
  document.addEventListener('mouseenter', () => { if (cursor) cursor.style.opacity = '1'; });
  document.addEventListener('mouseleave', () => { if (cursor) cursor.style.opacity = '0'; });

}); // DOMContentLoaded
