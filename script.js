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
    if (!this.originalHTML) {
      this.originalHTML = this.element.innerHTML;
    }
    const heroHeight = this.element.parentElement.offsetHeight;
    this.element.innerHTML = '';
    this.chars = [];
    this.transforms = [];
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = this.originalHTML;
    const processNode = (node, container) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          if (char === ' ') {
            container.appendChild(document.createTextNode('\u00A0'));
          } else {
            const span = document.createElement('span');
            span.className = 'char';
            span.textContent = char;
            this.chars.push(span);
            container.appendChild(span);
            const maxScatter = Math.max(heroHeight * 0.8, 200);
            const y = -Math.random() * maxScatter;
            const rotation = (Math.random() - 0.5) * 30;
            const scale = 1;
            this.transforms.push({ x: 0, y, rotation, scale });
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const clonedElement = node.cloneNode(false);
        container.appendChild(clonedElement);
        Array.from(node.childNodes).forEach(child => {
          processNode(child, clonedElement);
        });
      }
    };
    Array.from(tempDiv.childNodes).forEach(node => {
      if (node.nodeName === 'BR') {
        this.element.appendChild(document.createElement('br'));
      } else {
        processNode(node, this.element);
      }
    });
    this.applyTransforms();
  }
  setTargetProgress(progress) {
    this.targetProgress = Math.max(0, Math.min(1, progress));
  }
  applyTransforms() {
    this.chars.forEach((span, i) => {
      if (!this.transforms[i]) return;
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

class PhysicsCursor {
  constructor(element) {
    this.element = element;
    this.mouseX = 0;
    this.mouseY = 0;
    this.x = 0;
    this.y = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.friction = 0.85;
    this.spring = 0.02;
    this.mass = 1;
    this.isHovering = false;
    this.targetScale = 1;
    this.currentScale = 1;
    this.init();
  }
  init() {
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest('a, button, [role="button"]')) {
        this.isHovering = true;
        this.targetScale = 1.6;
        this.element.style.background = 'radial-gradient(circle, #ff6b6b 0%, #ff4757 100%)';
        this.element.style.boxShadow = '0 0 30px rgba(255, 107, 107, 0.8)';
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('a, button, [role="button"]')) {
        this.isHovering = false;
        this.targetScale = 1;
        this.element.style.background = 'radial-gradient(circle, #228B22 0%, #006400 100%)';
        this.element.style.boxShadow = '0 0 20px rgba(34, 139, 34, 0.6)';
      }
    });
    document.addEventListener('click', () => {
      this.velocityX += (Math.random() - 0.5) * 20;
      this.velocityY += (Math.random() - 0.5) * 20;
      this.targetScale = 0.8;
      setTimeout(() => {
        this.targetScale = this.isHovering ? 1.6 : 1;
      }, 100);
    });
    this.animate();
  }
  animate() {
    const forceX = (this.mouseX - this.x) * this.spring;
    const forceY = (this.mouseY - this.y) * this.spring;
    this.velocityX += forceX / this.mass;
    this.velocityY += forceY / this.mass;
    this.velocityX *= this.friction;
    this.velocityY *= this.friction;
    this.x += this.velocityX;
    this.y += this.velocityY;
    this.currentScale += (this.targetScale - this.currentScale) * 0.2;
    const speed = Math.sqrt(this.velocityX * this.velocityX + this.velocityY * this.velocityY);
    const angle = Math.atan2(this.velocityY, this.velocityX) * (180 / Math.PI);
    const maxStretch = 2.5;
    const stretchAmount = Math.min(speed * 0.1, maxStretch);
    const scaleX = 1 + stretchAmount;
    const scaleY = Math.max(0.5, 1 - stretchAmount * 0.3);
    const wobble = Math.sin(Date.now() * 0.01) * Math.min(speed * 0.1, 2);
    this.element.style.transform = `
      translate(${this.x - 12.5 + wobble}px, ${this.y - 12.5}px) 
      scale(${this.currentScale}) 
      rotate(${angle}deg) 
      scaleX(${scaleX}) 
      scaleY(${scaleY})
    `;
    requestAnimationFrame(() => this.animate());
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
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const currentProgress = scatterTitle.currentProgress;
      scatterTitle.init();
      scatterTitle.currentProgress = currentProgress;
      scatterTitle.targetProgress = currentProgress;
      onScroll();
    }, 100);
  });
  onScroll();
  const cursor = document.querySelector('.cursor');
  if (cursor) {
    new PhysicsCursor(cursor);
  }
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

  // --- Floating Social Toggle ---
  const socialMenu = document.querySelector('.social-menu');
  const socialToggle = document.querySelector('.social-toggle');
  if (socialToggle) {
    socialToggle.addEventListener('click', () => {
      socialMenu.classList.toggle('active');
      socialToggle.textContent = socialMenu.classList.contains('active') ? '×' : '+';
    });
  }
});
