'use strict';

class ScatterText {
  constructor(element) {
    this.element = element;
    this.chars = [];
    this.transforms = [];
    this.currentProgress = 0;
    this.targetProgress = 0;
    this.originalHTML = '';
    this.navButton = null;
    this.navChars = [];
    this.navCharTransforms = [];
    this.isNavButtonVisible = false;
    this.navCurrentProgress = 1;
    this.navTargetProgress = 1;
    this.init();
    this.isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;
  }
  
  init() {
    if (!this.originalHTML) {
      this.originalHTML = this.element.innerHTML;
    }
    const heroHeight = this.element.parentElement.offsetHeight;
    this.element.innerHTML = '';
    this.chars = [];
    this.transforms = [];
    
    if (!this.navButton) {
      this.createNavButton();
    }
    
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
            
            const maxScatter = Math.max(window.innerWidth * 0.8, 300);
            const x = Math.random() * maxScatter;
            const y = (Math.random() - 0.5) * 100;
            const rotation = (Math.random() - 0.5) * 45;
            const scale = 1;
            this.transforms.push({ x, y, rotation, scale });
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
  
  createNavButton() {
    this.navButton = document.createElement('div');
    this.navButton.className = 'nav-title-button';
    this.navChars = [];
    this.navCharTransforms = [];
    
    const abbreviatedText = 'James\nTurner';
    
    let isSecondLine = false;
    let isFirstCharOfSecondLine = true;
    
    for (let i = 0; i < abbreviatedText.length; i++) {
      const char = abbreviatedText[i];
      
      if (char === '\n') {
        this.navButton.appendChild(document.createElement('br'));
        isSecondLine = true;
        isFirstCharOfSecondLine = true;
        continue;
      }
      
      if (char === ' ') {
        this.navButton.appendChild(document.createTextNode('\u00A0'));
      } else {
        const span = document.createElement('span');
        span.className = 'nav-char';
        span.textContent = char;
        span.style.display = 'inline-block';
        span.style.willChange = 'transform, opacity';
        
        if (isSecondLine && isFirstCharOfSecondLine) {
          span.style.marginLeft = '8px';
          isFirstCharOfSecondLine = false;
        }
        
        this.navChars.push(span);
        
        const scatterX = -200 - (Math.random() * 300);
        const scatterY = (Math.random() - 0.5) * 150;
        const scatterRotation = (Math.random() - 0.5) * 60;
        
        this.navCharTransforms.push({ x: scatterX, y: scatterY, rotation: scatterRotation });
        span.style.transform = `translate(${scatterX}px, ${scatterY}px) rotate(${scatterRotation}deg)`;
        span.style.opacity = '0';
        
        this.navButton.appendChild(span);
      }
    }
    
    this.navCurrentProgress = 1;
    this.navTargetProgress = 1;
    this.isNavButtonVisible = false;
    
    this.applyNavTransforms();
    this.navButton.style.opacity = '1';
    this.navButton.style.pointerEvents = 'none';
    
    this.navButton.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById('home') || document.querySelector('.hero');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    
    const existingNav = document.querySelector('.site-nav');
    if (existingNav && existingNav.parentNode) {
      existingNav.parentNode.insertBefore(this.navButton, existingNav);
    } else {
      document.body.insertBefore(this.navButton, document.body.firstChild);
    }
  }
  
  applyNavTransforms() {
    this.navChars.forEach((span, i) => {
      if (!this.navCharTransforms[i]) return;
      const t = this.navCharTransforms[i];
      const x = t.x * this.navCurrentProgress;
      const y = t.y * this.navCurrentProgress;
      const rot = t.rotation * this.navCurrentProgress;
      span.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
      const opacity = 1 - this.navCurrentProgress;
      span.style.opacity = opacity.toString();
      
      if (opacity > 0.5) {
        span.classList.add('gathering');
        span.classList.remove('scattering');
      } else {
        span.classList.add('scattering');
        span.classList.remove('gathering');
      }
    });
  }
  
  showNavButton() {
    this.isNavButtonVisible = true;
    this.navTargetProgress = 0;
  }
  
  hideNavButton() {
    this.isNavButtonVisible = false;
    this.navTargetProgress = 1;
  }
  
  updateNavAnimation() {
    const animationSpeed = 0.05;
    this.navCurrentProgress += (this.navTargetProgress - this.navCurrentProgress) * animationSpeed;
    
    this.applyNavTransforms();
    
    const maxCharOpacity = Math.max(...this.navChars.map(span => parseFloat(span.style.opacity) || 0));
    
    if (maxCharOpacity > 0.1) {
      this.navButton.style.pointerEvents = 'auto';
      this.navButton.classList.add('visible');
    } else {
      this.navButton.style.pointerEvents = 'none';
      this.navButton.classList.remove('visible');
    }
  }
  
  setTargetProgress(progress) {
    this.targetProgress = Math.max(0, Math.min(1, progress));
    
    const isMainTitle = this.element.closest('.hero');
    if (isMainTitle) {
      // Visibility handled explicitly in scroll handler for instant behavior
    }
  }

  // Instantly show/hide nav button (no easing)
  showNavButtonInstant() {
    this.isNavButtonVisible = true;
    this.navTargetProgress = 0;
    this.navCurrentProgress = 0;
    this.applyNavTransforms();
  }
  hideNavButtonInstant() {
    this.isNavButtonVisible = false;
    this.navTargetProgress = 1;
    this.navCurrentProgress = 1;
    this.applyNavTransforms();
  }
  
  applyTransforms() {
    this.chars.forEach((span, i) => {
      if (!this.transforms[i]) return;
      const t = this.transforms[i];
      const scatterFactor = this.isTouch ? 0.5 : 1; // reduce scatter on touch
      const x = t.x * this.currentProgress * scatterFactor;
      const y = t.y * this.currentProgress * scatterFactor;
      const rot = t.rotation * this.currentProgress;
      const scale = 1 + (t.scale - 1) * this.currentProgress;
      span.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale})`;
      span.style.opacity = 1;
    });
  }
  
  update() {
    this.currentProgress += (this.targetProgress - this.currentProgress) * 0.15;
    this.applyTransforms();
    this.updateNavAnimation();
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
    this.spring = 0.08;
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
      if (e.target.closest('a, button, [role="button"], .nav-title-button, .nav-char')) {
        this.isHovering = true;
        this.targetScale = 1.6;
        this.element.style.background = 'radial-gradient(circle, #1a1a1a 0%, #000 100%)';
        this.element.style.boxShadow = '0 0 30px rgba(26, 26, 26, 0.8)';
      }
    });
    
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('a, button, [role="button"], .nav-title-button, .nav-char')) {
        this.isHovering = false;
        this.targetScale = 1;
        this.element.style.background = 'radial-gradient(circle, #1a1a1a 0%, #333 100%)';
        this.element.style.boxShadow = '0 0 20px rgba(26, 26, 26, 0.4)';
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

// Enhanced Background System
class EnhancedBackgroundSystem {
  constructor() {
    this.particles = [];
    this.cursorTrails = [];
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;
    this.init();
  }

  init() {
    this.createBackgroundElements();
    this.createParticleSystem();
    this.createLightBeams();
    this.createCursorTrails();
    this.bindEvents();
    this.animate();
  }

  createBackgroundElements() {
    const shapesContainer = document.createElement('div');
    shapesContainer.className = 'bg-shapes';
    
    for (let i = 0; i < 4; i++) {
      const shape = document.createElement('div');
      shape.className = 'bg-shape';
      shapesContainer.appendChild(shape);
    }
    
    document.body.appendChild(shapesContainer);

    const noiseOverlay = document.createElement('div');
    noiseOverlay.className = 'noise-overlay';
    document.body.appendChild(noiseOverlay);
  }

  createParticleSystem() {
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'bg-particles';
    
    const initialCount = this.isTouch ? 6 : 15;
    for (let i = 0; i < initialCount; i++) {
      setTimeout(() => {
        this.createParticle(particlesContainer);
      }, i * 1000);
    }
    
    document.body.appendChild(particlesContainer);
    
    const spawnInterval = this.isTouch ? 3500 : 2000;
    setInterval(() => {
      this.createParticle(particlesContainer);
    }, spawnInterval);
  }

  createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    particle.style.left = Math.random() * window.innerWidth + 'px';
    particle.style.top = window.innerHeight + 'px';
    
    const duration = 15 + Math.random() * 10;
    const delay = Math.random() * 2;
    
    particle.style.animationDuration = duration + 's';
    particle.style.animationDelay = delay + 's';
    
    container.appendChild(particle);
    
    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    }, (duration + delay) * 1000);
  }

  createLightBeams() {
    const beamsContainer = document.createElement('div');
    beamsContainer.className = 'light-beams';
    
    const beamCount = this.isTouch ? 1 : 3;
    for (let i = 0; i < beamCount; i++) {
      const beam = document.createElement('div');
      beam.className = 'light-beam';
      beamsContainer.appendChild(beam);
    }
    
    document.body.appendChild(beamsContainer);
  }

  createCursorTrails() {
    const trailCount = this.isTouch ? 0 : 8;
    for (let i = 0; i < trailCount; i++) {
      const trail = document.createElement('div');
      trail.className = 'cursor-trail';
      trail.style.zIndex = 5000 - i; // Lower z-index to avoid conflicts
      document.body.appendChild(trail);
      this.cursorTrails.push({
        element: trail,
        x: 0,
        y: 0,
        opacity: 1 - (i * 0.15)
      });
    }
  }

  updateCursorTrails(mouseX, mouseY) {
    this.cursorTrails.forEach((trail, index) => {
      const delay = index * 0.1;
      const targetX = mouseX - (index * 2);
      const targetY = mouseY - (index * 2);
      
      trail.x += (targetX - trail.x) * (0.3 - delay);
      trail.y += (targetY - trail.y) * (0.3 - delay);
      
      trail.element.style.transform = `translate(${trail.x - 3}px, ${trail.y - 3}px)`;
      trail.element.style.opacity = trail.opacity;
    });
  }

  bindEvents() {
    let isMouseMoving = false;
    let mouseTimeout;

    document.addEventListener('mousemove', (e) => {
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      
      if (!isMouseMoving) {
        isMouseMoving = true;
        this.cursorTrails.forEach(trail => {
          trail.element.style.opacity = trail.opacity;
        });
      }

      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => {
        isMouseMoving = false;
        this.cursorTrails.forEach(trail => {
          trail.element.style.opacity = '0';
        });
      }, 100);
    });

    window.addEventListener('scroll', () => {
      this.updateBackgroundIntensity();
    }, { passive: true });

    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  updateBackgroundIntensity() {
    const scrollY = window.pageYOffset;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const scrollProgress = Math.min(scrollY / maxScroll, 1);
    
    const shapesContainer = document.querySelector('.bg-shapes');
    const noiseOverlay = document.querySelector('.noise-overlay');
    
    if (shapesContainer) {
      shapesContainer.style.opacity = 1 - (scrollProgress * 0.3);
    }
    
    if (noiseOverlay) {
      noiseOverlay.style.opacity = 0.03 + (scrollProgress * 0.02);
    }
  }

  handleResize() {
    const particles = document.querySelectorAll('.particle');
    particles.forEach(particle => {
      if (parseFloat(particle.style.left) > window.innerWidth) {
        particle.style.left = Math.random() * window.innerWidth + 'px';
      }
    });
  }

  animate() {
    this.updateCursorTrails(this.lastMouseX, this.lastMouseY);
    requestAnimationFrame(() => this.animate());
  }
}

// Performance monitor
class BackgroundPerformanceMonitor {
  constructor() {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 60;
    this.init();
  }

  init() {
    this.monitor();
  }

  monitor() {
    this.frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      if (this.fps < 30) {
        document.body.classList.add('low-performance');
        this.reduceEffects();
      } else {
        document.body.classList.remove('low-performance');
      }
    }
    
    requestAnimationFrame(() => this.monitor());
  }

  reduceEffects() {
    const particles = document.querySelectorAll('.particle');
    particles.forEach((particle, index) => {
      if (index % 2 === 0) {
        particle.style.display = 'none';
      }
    });
    
    const shapes = document.querySelectorAll('.bg-shape');
    shapes.forEach(shape => {
      shape.style.animationDuration = '60s';
    });
  }
}

// Enhanced color interpolation function
function interpolateColor(color1, color2, factor) {
  const hex2rgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };
  
  const rgb2hex = (r, g, b) => {
    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
  };
  
  const [r1, g1, b1] = hex2rgb(color1);
  const [r2, g2, b2] = hex2rgb(color2);
  
  const smoothFactor = factor * factor * (3 - 2 * factor);
  
  const r = r1 + smoothFactor * (r2 - r1);
  const g = g1 + smoothFactor * (g2 - g1);
  const b = b1 + smoothFactor * (b2 - b1);
  
  return rgb2hex(r, g, b);
}

// Enhanced section background updates (consolidated function)
function updateSectionBackgrounds() {
  const sections = document.querySelectorAll('section[id]');
  const sectionsArray = Array.from(sections);
  const windowHeight = window.innerHeight;
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;
  
  const sectionColors = {
    hero: '#efe9dd',
    home: '#efe9dd',
    about: '#dfd5c6',
    projects: '#ccbda8',
    contact: '#baa891'
  };
  
  let activeSection = 'hero';
  
  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    const sectionCenter = rect.top + rect.height / 2;
    const windowCenter = windowHeight / 2;
    const distance = Math.abs(sectionCenter - windowCenter);
    
    if (distance < windowHeight / 3) {
      activeSection = section.id;
      section.classList.add('active');
      
      const intensity = 1 - (distance / (windowHeight / 3));
      section.style.setProperty('--glow-intensity', intensity);
    } else {
      section.classList.remove('active');
    }
  });
  
  const tops = sectionsArray.map(s => s.offsetTop);
  tops.push(document.documentElement.scrollHeight);
  const colorsList = sectionsArray.map(s => sectionColors[s.id] || sectionColors.hero);
  colorsList.push(colorsList[colorsList.length - 1]);
  
  let currentColor = colorsList[0];
  
  for (let i = 0; i < sectionsArray.length; i++) {
    if (scrollY >= tops[i] && scrollY < tops[i + 1]) {
      const progress = (scrollY - tops[i]) / (tops[i + 1] - tops[i]);
      currentColor = interpolateColor(colorsList[i], colorsList[i + 1], progress);
      break;
    }
  }
  
  document.body.style.backgroundColor = currentColor;
  document.body.classList.remove('hero-active', 'home-active', 'about-active', 'projects-active', 'contact-active');
  document.body.classList.add(`${activeSection}-active`);
}

// Main initialization (consolidated)
document.addEventListener('DOMContentLoaded', () => {
  // Initialize scatter text system
  const titleElements = document.querySelectorAll('.scatter-text');
  let scatterTexts = [];
  
  titleElements.forEach(element => {
    const isHeroTitle = element.closest('.hero');
    if (isHeroTitle) {
      scatterTexts.push(new ScatterText(element));
    }
  });
  
  // Initialize enhanced background system
  const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;
  const backgroundSystem = new EnhancedBackgroundSystem();
  const performanceMonitor = new BackgroundPerformanceMonitor();
  
  // Animation loop for scatter text
  function animate() {
    scatterTexts.forEach(scatter => scatter.update());
    requestAnimationFrame(animate);
  }
  animate();
  
  // Scroll handler
  function onScroll() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    
    updateSectionBackgrounds();
    
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionBottom = sectionTop + sectionHeight;
      
      const isInViewport = sectionBottom > scrollY && sectionTop < scrollY + windowHeight;
      section.classList.toggle('in-viewport', isInViewport);
      
      const sectionCenter = sectionTop + (sectionHeight / 2);
      const windowCenter = scrollY + (windowHeight / 2);
      const distanceFromCenter = Math.abs(windowCenter - sectionCenter);
      
      if (distanceFromCenter < sectionHeight / 2) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });
    
    scatterTexts.forEach(scatterText => {
      const section = scatterText.element.closest('section');
      if (!section) return;
      const heroRect = section.getBoundingClientRect();
      const heroFullyOut = heroRect.bottom <= 0; // hero no longer visible
      const heroVisible = heroRect.bottom > 0;   // any part visible

      if (heroFullyOut) {
        scatterText.showNavButtonInstant();
      } else if (heroVisible) {
        scatterText.hideNavButtonInstant();
      }

      // Keep scatter transform progress logic as-is
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionBottom = sectionTop + sectionHeight;
      const isInViewport = sectionBottom > scrollY && sectionTop < scrollY + windowHeight;
      if (isInViewport) {
        const sectionCenter = sectionTop + (sectionHeight / 2);
        const windowCenter = scrollY + (windowHeight / 2);
        const distance = Math.abs(windowCenter - sectionCenter);
        const maxDistance = sectionHeight;
        const progress = Math.min(distance / maxDistance, 1);
        scatterText.setTargetProgress(progress);
      } else {
        scatterText.setTargetProgress(1);
      }
    });
  }
  
  // Coalesce scroll events to once-per-frame for smoother scrolling
  let isScrollScheduled = false;
  function scheduleScroll() {
    if (isScrollScheduled) return;
    isScrollScheduled = true;
    requestAnimationFrame(() => {
      onScroll();
      isScrollScheduled = false;
    });
  }
  window.addEventListener('scroll', scheduleScroll, { passive: true });
  
  // Resize handler
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      scatterTexts.forEach(scatterText => {
        const currentProgress = scatterText.currentProgress;
        const navCurrentProgress = scatterText.navCurrentProgress;
        scatterText.init();
        scatterText.currentProgress = currentProgress;
        scatterText.targetProgress = currentProgress;
        scatterText.navCurrentProgress = navCurrentProgress;
        scatterText.navTargetProgress = navCurrentProgress;
      });
      onScroll();
    }, 100);
  });
  
  // Initialize cursor
  const cursor = document.querySelector('.cursor');
  if (cursor && !isTouch) {
    new PhysicsCursor(cursor);
  }
  
  // Navigation active state
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
  
  // Click handler for smooth scrolling
  document.addEventListener('click', e => {
    const link = e.target.closest('.site-nav a[href^="#"], .nav-title-button');
    if (!link) return;
    e.preventDefault();
    const targetId = link.getAttribute('href')?.slice(1) || 'home';
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  
  // 3D tilt for project cards (desktop only)
  const isTouchDevice = matchMedia('(hover: none), (pointer: coarse)').matches;
  if (!isTouchDevice) {
    const tiltCards = document.querySelectorAll('.project-card');
    const maxTilt = 8;
    tiltCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        const rx = (-dy * maxTilt).toFixed(2);
        const ry = (dx * maxTilt).toFixed(2);
        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // Subtle parallax on about collage images
  const collage = document.querySelector('.about-collage');
  if (collage) {
    const imgs = collage.querySelectorAll('img');
    window.addEventListener('scroll', () => {
      const rect = collage.getBoundingClientRect();
      const progress = Math.min(Math.max(1 - Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2) / (rect.height / 2), 0), 1);
      imgs.forEach((img, i) => {
        const offset = (i % 3 - 1) * 6 * (1 - progress);
        img.style.transform = `translateY(${offset}px)`;
      });
    }, { passive: true });
  }
  // Initial call
  onScroll();

  // Animate section dividers on entering viewport
  const dividerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      if (entry.isIntersecting) {
        el.classList.add('visible');
      } else {
        el.classList.remove('visible');
      }
    });
  }, { rootMargin: '0px 0px -20% 0px', threshold: 0.1 });

  document.querySelectorAll('.section-divider').forEach(divider => dividerObserver.observe(divider));
});