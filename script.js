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
    this.navCurrentProgress = 1; // Start scattered (invisible)
    this.navTargetProgress = 1;
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
    
    // Create navigation button if it doesn't exist
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
            
            // Changed scatter direction to right instead of up
            const maxScatter = Math.max(window.innerWidth * 0.8, 300);
            const x = Math.random() * maxScatter; // Scatter to the right
            const y = (Math.random() - 0.5) * 100; // Small vertical variation
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
    
    // Use hardcoded "first" and "last" instead of extracting from original HTML
    const abbreviatedText = 'James\nTurner';
    
    // Process the abbreviated text into character spans
    let isSecondLine = false;
    let charIndex = 0;
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
        
        // Add slight right offset only for the first character of second line
        if (isSecondLine && isFirstCharOfSecondLine) {
          span.style.marginLeft = '8px';
          isFirstCharOfSecondLine = false;
        }
        
        this.navChars.push(span);
        
        // Generate scatter transform values (scatter from left)
        const scatterDistance = -(150 + Math.random() * 300); // Negative for left scatter
        const scatterY = (Math.random() - 0.5) * 100;
        const scatterRotation = (Math.random() - 0.5) * 60;
        
        // Store the transform values
        this.navCharTransforms.push({
          x: scatterDistance,
          y: scatterY,
          rotation: scatterRotation
        });
        
        this.navButton.appendChild(span);
        charIndex++;
      }
    }
    
    // Apply initial scattered state
    this.applyNavTransforms();
    
    // Make the button clickable
    this.navButton.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById('home') || document.querySelector('.hero');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    
    // Insert before existing navigation or at the beginning of body
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
      span.style.opacity = Math.max(0.1, 1 - this.navCurrentProgress * 0.8);
    });
  }
  
  showNavButton() {
    if (!this.isNavButtonVisible) {
      this.isNavButtonVisible = true;
      this.navButton.classList.add('visible');
      this.navTargetProgress = 0; // Gather characters to center
      
      // Force immediate visibility of the button container
      this.navButton.style.opacity = '1';
      this.navButton.style.pointerEvents = 'auto';
    }
  }
  
  hideNavButton() {
    if (this.isNavButtonVisible) {
      this.isNavButtonVisible = false;
      this.navTargetProgress = 1; // Scatter characters to the left
      
      // Hide the whole button after characters scatter out
      setTimeout(() => {
        this.navButton.classList.remove('visible');
        this.navButton.style.opacity = '0';
        this.navButton.style.pointerEvents = 'none';
      }, 800);
    }
  }
  
  updateNavAnimation() {
    // Smoothly animate nav characters between scattered and gathered states
    // Slower animation when gathering (coming in) vs scattering (going out)
    const animationSpeed = this.navTargetProgress === 0 ? 0.06 : 0.12;
    this.navCurrentProgress += (this.navTargetProgress - this.navCurrentProgress) * animationSpeed;
    this.applyNavTransforms();
  }
  
  setTargetProgress(progress) {
    this.targetProgress = Math.max(0, Math.min(1, progress));
    
    // Show/hide nav button based on progress - only show when title is completely scattered
    if (this.targetProgress > 0.9) {
      this.showNavButton();
    } else {
      this.hideNavButton();
    }
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
      span.style.opacity = 1; // Keep opacity at 1 - no fading
    });
  }
  
  update() {
    this.currentProgress += (this.targetProgress - this.currentProgress) * 0.15;
    this.applyTransforms();
    
    // Update nav button animation
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
        this.element.style.background = 'radial-gradient(circle, #ff6b6b 0%, #ff4757 100%)';
        this.element.style.boxShadow = '0 0 30px rgba(255, 107, 107, 0.8)';
      }
    });
    
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('a, button, [role="button"], .nav-title-button, .nav-char')) {
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
  const titleElements = document.querySelectorAll('.scatter-text');
  if (!titleElements.length) return;
  
  let scatterTexts = [];
  titleElements.forEach(element => {
    scatterTexts.push(new ScatterText(element));
  });
  
  let resizeTimeout;
  
  function animate() {
    scatterTexts.forEach(scatter => scatter.update());
    requestAnimationFrame(animate);
  }
  animate();
  
  function onScroll() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    
    scatterTexts.forEach(scatterText => {
      const section = scatterText.element.closest('section');
      if (!section) return;
      
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionBottom = sectionTop + sectionHeight;
      
      // Check if section is in viewport
      const isInViewport = sectionBottom > scrollY && sectionTop < scrollY + windowHeight;
      section.classList.toggle('in-viewport', isInViewport);
      
      if (isInViewport) {
        const sectionCenter = sectionTop + (sectionHeight / 2);
        const windowCenter = scrollY + (windowHeight / 2);
        
        // Calculate distance from section center
        const distance = Math.abs(windowCenter - sectionCenter);
        const maxDistance = sectionHeight;
        
        // Progress is 0 when centered on section, 1 when far away
        const progress = Math.min(distance / maxDistance, 1);
        
        scatterText.setTargetProgress(progress);
      } else {
        // Hide scattered characters when section is out of viewport
        scatterText.setTargetProgress(1);
      }
    });
  }
  
  window.addEventListener('scroll', onScroll, { passive: true });
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
    const link = e.target.closest('.site-nav a[href^="#"], .nav-title-button');
    if (!link) return;
    e.preventDefault();
    const targetId = link.getAttribute('href').slice(1);
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});