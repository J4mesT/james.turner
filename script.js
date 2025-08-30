'use strict';

class ScatterText {
  constructor(element) {
    this.element = element;
    this.chars = [];
    this.transforms = [];
    this.currentProgress = 0;
    this.targetProgress = 0;
    this.originalHTML = '';
    this.init();
  }

  init() {
    // Store original HTML only once
    if (!this.originalHTML) {
      this.originalHTML = this.element.innerHTML;
    }

    const heroHeight = this.element.parentElement.offsetHeight;
    
    // Clear existing content but preserve structure
    this.element.innerHTML = '';
    this.chars = [];
    this.transforms = [];

    const textParts = this.originalHTML.split('<br>');

    textParts.forEach((part, partIndex) => {
      for (let i = 0; i < part.length; i++) {
        const char = part[i];
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = char === ' ' ? '\u00A0' : char;
        this.chars.push(span);
        this.element.appendChild(span);

        // Generate transforms based on current hero height
        const maxScatter = Math.max(heroHeight * 0.8, 200); // minimum 200px to prevent issues
        const y = -Math.random() * maxScatter;
        const rotation = (Math.random() - 0.5) * 30;
        const scale = 0.6 + Math.random() * 0.7;

        this.transforms.push({ x: 0, y, rotation, scale });
      }

      if (partIndex < textParts.length - 1) {
        this.element.appendChild(document.createElement('br'));
      }
    });

    // Immediately apply current progress to prevent visual jumps
    this.applyTransforms();
  }

  setTargetProgress(progress) {
    this.targetProgress = Math.max(0, Math.min(1, progress));
  }

  applyTransforms() {
    this.chars.forEach((span, i) => {
      if (!this.transforms[i]) return; // Safety check
      
      const t = this.transforms[i];
      const x = t.x * this.currentProgress;
      const y = t.y * this.currentProgress;
      const rot = t.rotation * this.currentProgress;
      const scale = 1 + (t.scale - 1) * this.currentProgress;
      
      span.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale})`;
      span.style.opacity = 1;
    });
  }

  update() {
    this.currentProgress += (this.targetProgress - this.currentProgress) * 0.15;
    this.applyTransforms();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const titleElement = document.querySelector('.scatter-text');
  if (!titleElement) return;

  let scatterTitle = new ScatterText(titleElement);
  let resizeTimeout;

  function animate() {
    scatterTitle.update();
    requestAnimationFrame(animate);
  }
  animate();

  function onScroll() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const heroHeight = scatterTitle.element.parentElement?.offsetHeight || window.innerHeight;
    const progress = Math.min(scrollY / heroHeight, 1);
    scatterTitle.setTargetProgress(progress);
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // Improved resize handling with debouncing
  window.addEventListener('resize', () => {
    // Clear any existing timeout
    clearTimeout(resizeTimeout);
    
    // Debounce resize to prevent excessive re-initialization
    resizeTimeout = setTimeout(() => {
      // Store current progress to maintain visual continuity
      const currentProgress = scatterTitle.currentProgress;
      
      // Re-initialize with new dimensions
      scatterTitle.init();
      
      // Restore progress to prevent visual jump
      scatterTitle.currentProgress = currentProgress;
      scatterTitle.targetProgress = currentProgress;
      
      // Recalculate scroll-based progress
      onScroll();
    }, 100); // 100ms debounce
  });

  // Initial scroll calculation
  onScroll();

  // --- Custom cursor ---
  const cursor = document.querySelector('.cursor');
  if (cursor) {
    let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0;
    
    document.addEventListener('mousemove', e => { 
      mouseX = e.clientX; 
      mouseY = e.clientY; 
    });
    
    function animateCursor() {
      cursorX += (mouseX - cursorX) * 0.15;
      cursorY += (mouseY - cursorY) * 0.15;
      cursor.style.transform = `translate(${cursorX - 12.5}px, ${cursorY - 12.5}px)`;
      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    document.addEventListener('mouseover', e => {
      if (e.target.closest('a, button, [role="button"]')) {
        cursor.style.transform = `translate(${cursorX - 20}px, ${cursorY - 20}px) scale(1.6)`;
        cursor.style.background = '#ff6b6b';
      }
    });
    
    document.addEventListener('mouseout', e => {
      if (e.target.closest('a, button, [role="button"]')) {
        cursor.style.transform = `translate(${cursorX - 12.5}px, ${cursorY - 12.5}px) scale(1)`;
        cursor.style.background = '#4285f4';
      }
    });
  }

  // --- Navigation highlighting ---
  const navLinks = document.querySelectorAll('.site-nav a');
  
  function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    let current = 'home';
    
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 100 && rect.bottom >= 100) {
        current = section.id;
      }
    });
    
    navLinks.forEach(link => {
      const isActive = link.getAttribute('href') === `#${current}`;
      link.classList.toggle('active', isActive);
    });
  }
  
  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();

  document.addEventListener('click', e => {
    const link = e.target.closest('.site-nav a[href^="#"]');
    if (!link) return;
    
    e.preventDefault();
    const targetId = link.getAttribute('href').slice(1);
    const target = document.getElementById(targetId);
    
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});