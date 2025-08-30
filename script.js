'use strict';

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
        for (const ch of node.textContent) {
          const span = document.createElement('span');
          span.className = 'char';
          span.textContent = ch === ' ' ? '\u00A0' : ch;
          this.chars.push(span);
          frag.appendChild(span);
        }
      } else if (node.nodeName === 'BR') {
        frag.appendChild(document.createElement('br'));
      } else {
        for (const ch of (node.textContent || '')) {
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
    if (!this.element || this.isScattered) return Promise.resolve();
    this.isScattered = true;

    return new Promise(resolve => {
      let completed = 0;
      const total = this.chars.length;

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

          completed++;
          if (completed === total) resolve(); // ✅ resolve when last char scattered
        }, index * 18);
      });
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

document.addEventListener('DOMContentLoaded', () => {
  const cursor = document.querySelector('.cursor');
  let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY;
  });
  function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.15;
    cursorY += (mouseY - cursorY) * 0.15;
    if (cursor) cursor.style.transform = `translate(${cursorX - 12.5}px, ${cursorY - 12.5}px)`;
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  const titleEl = document.querySelector('.scatter-text');
  const hero = document.querySelector('.hero');
  let scatterTitle = null;
  if (titleEl) {
    scatterTitle = new ScatterText(titleEl);
    titleEl.addEventListener('click', () => scatterTitle.toggle());
    window.__scatter = scatterTitle;
  }

  /* --- NEW: First scroll triggers scatter instead of page move --- */
  let firstScrollDone = false;

  function blockScrollAndScatter(e) {
    if (firstScrollDone || !scatterTitle) return;
    e.preventDefault(); // block actual scroll
    firstScrollDone = true;

    // scatter returns a promise → unlock only when finished
    scatterTitle.scatter().then(() => {
      document.body.classList.remove('scatter-locked');
    });
  }


  // lock initially
  document.body.classList.add('scatter-locked');
  // intercept wheel/touch scroll
  window.addEventListener('wheel', blockScrollAndScatter, { passive: false });
  window.addEventListener('touchmove', blockScrollAndScatter, { passive: false });

  /* --- After unlocked: normal scatter/gather on scroll --- */
  function checkScrollState() {
    if (!scatterTitle || !hero) return;
    const rect = hero.getBoundingClientRect();
    const scrolledPast = rect.top < -8;
    if (scrolledPast && !scatterTitle.isScattered) {
      scatterTitle.scatter();
    } else if (!scrolledPast && scatterTitle.isScattered && firstScrollDone) {
      scatterTitle.gather();
    }
  }
  window.addEventListener('scroll', () => requestAnimationFrame(checkScrollState), { passive: true });

  /* --- Nav highlighting (unchanged) --- */
  function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.site-nav a');
    let currentSection = 'home';
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 100 && rect.bottom >= 100) currentSection = section.id;
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) link.classList.add('active');
    });
  }
  window.addEventListener('scroll', updateActiveNav, { passive: true });

  /* --- Cursor hover effects --- */
  document.addEventListener('mouseover', e => {
    if (!cursor) return;
    if (e.target.closest('a, button, [role="button"]')) {
      cursor.style.transform = `translate(${cursorX - 20}px, ${cursorY - 20}px) scale(1.6)`;
      cursor.style.background = '#ff6b6b';
    }
  });
  document.addEventListener('mouseout', e => {
    if (!cursor) return;
    if (e.target.closest('a, button, [role="button"]')) {
      cursor.style.transform = `translate(${cursorX - 12.5}px, ${cursorY - 12.5}px) scale(1)`;
      cursor.style.background = '#4285f4';
    }
  });
  document.addEventListener('mouseenter', () => { if (cursor) cursor.style.opacity = '1'; });
  document.addEventListener('mouseleave', () => { if (cursor) cursor.style.opacity = '0'; });
});
