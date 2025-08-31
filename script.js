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
    this.navTargetProgress = 1; // Start scattered (invisible)
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
    
    // Use hardcoded "First" and "Last" instead of extracting from original HTML
    const abbreviatedText = 'First\nLast';
    
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
        
        // Generate scattered transform values - all from left side
        const scatterX = -200 - (Math.random() * 300); // Always from left side (-200 to -500px)
        const scatterY = (Math.random() - 0.5) * 150; // Vertical variation
        const scatterRotation = (Math.random() - 0.5) * 60; // More rotation variation
        
        // Store the transform values
        this.navCharTransforms.push({
          x: scatterX,
          y: scatterY,
          rotation: scatterRotation
        });
        
        // Apply initial scattered position immediately
        span.style.transform = `translate(${scatterX}px, ${scatterY}px) rotate(${scatterRotation}deg)`;
        span.style.opacity = '0';
        
        this.navButton.appendChild(span);
        charIndex++;
      }
    }
    
    // Set initial state - start scattered (invisible) to match main title behavior
    this.navCurrentProgress = 1; // Start scattered (invisible)
    this.navTargetProgress = 1; // Stay scattered initially
    this.isNavButtonVisible = false;
    
    // Apply initial state
    this.applyNavTransforms();
    this.navButton.style.opacity = '1'; // Keep container visible for animation
    this.navButton.style.pointerEvents = 'none'; // But not interactive initially
    
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
      
      // When scattered (progress = 1), opacity should be 0 (invisible)
      // When gathered (progress = 0), opacity should be 1 (visible)
      const opacity = 1 - this.navCurrentProgress;
      span.style.opacity = opacity.toString();
      
      // Add/remove CSS classes for debugging
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
    this.navTargetProgress = 0; // Gather characters to center (make visible)
  }
  
  hideNavButton() {
    this.isNavButtonVisible = false;
    this.navTargetProgress = 1; // Scatter characters away (make invisible)
  }
  
  updateNavAnimation() {
    // Very fast animation for instant response
    const animationSpeed = 0.4; // Much faster for instant feel
    this.navCurrentProgress += (this.navTargetProgress - this.navCurrentProgress) * animationSpeed;
    
    this.applyNavTransforms();
    
    // Update pointer events based on visibility
    const maxCharOpacity = Math.max(...this.navChars.map(span => parseFloat(span.style.opacity) || 0));
    
    if (maxCharOpacity > 0.1) { // Lower threshold for interactivity
      this.navButton.style.pointerEvents = 'auto';
      this.navButton.classList.add('visible');
    } else {
      this.navButton.style.pointerEvents = 'none';
      this.navButton.classList.remove('visible');
    }
  }
  
  setTargetProgress(progress) {
    this.targetProgress = Math.max(0, Math.min(1, progress));
    
    // Only apply nav button logic to the main hero title (not section titles)
    const isMainTitle = this.element.closest('.hero');
    if (isMainTitle) {
      // Show nav button immediately when main title starts to scatter
      if (this.targetProgress > 0.05) { // Much lower threshold for instant response
        this.showNavButton();
      } else {
        this.hideNavButton();
      }
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

// Color interpolation utility
function interpolateColor(color1, color2, factor) {
  // Convert hex to RGB
  const hex2rgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };
  
  // Convert RGB to hex
  const rgb2hex = (r, g, b) => {
    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
  };
  
  const [r1, g1, b1] = hex2rgb(color1);
  const [r2, g2, b2] = hex2rgb(color2);
  
  const r = r1 + factor * (r2 - r1);
  const g = g1 + factor * (g2 - g1);
  const b = b1 + factor * (b2 - b1);
  
  return rgb2hex(r, g, b);
}

// Enhanced background morphing function with smooth color transitions
function updateSectionBackgrounds() {
  const sections = document.querySelectorAll('section[id]');
  const sectionsArray = Array.from(sections);
  const windowHeight = window.innerHeight;
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;
  
  // Define section colors with more apparent differences
  const sectionColors = {
    hero: '#faf9f6',     // Light cream
    home: '#faf9f6',     // Same as hero
    about: '#e8e0d6',    // Warm beige
    projects: '#d4c4b0', // Light brown
    contact: '#c0a990'   // Medium brown
  };
  
  let activeSection = 'hero';
  
  // Find the active section first
  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= windowHeight / 3 && rect.bottom >= windowHeight / 3) {
      activeSection = section.id;
    }
  });
  
  // Prepare tops and colors list
  const tops = sectionsArray.map(s => s.offsetTop);
  tops.push(document.documentElement.scrollHeight); // For the end of the page
  const colorsList = sectionsArray.map(s => sectionColors[s.id] || sectionColors.hero);
  colorsList.push(colorsList[colorsList.length - 1]); // Last color extends to the end
  
  let currentColor = colorsList[0];
  
  // Find the current segment and interpolate
  for (let i = 0; i < sectionsArray.length; i++) {
    if (scrollY >= tops[i] && scrollY < tops[i + 1]) {
      const progress = (scrollY - tops[i]) / (tops[i + 1] - tops[i]);
      currentColor = interpolateColor(colorsList[i], colorsList[i + 1], progress);
      break;
    }
  }
  
  // Apply the calculated color
  document.body.style.backgroundColor = currentColor;
  
  // Remove all active classes
  document.body.classList.remove('hero-active', 'home-active', 'about-active', 'projects-active', 'contact-active');
  
  // Add the current active class
  document.body.classList.add(`${activeSection}-active`);
}

document.addEventListener('DOMContentLoaded', () => {
  const titleElements = document.querySelectorAll('.scatter-text');
  if (!titleElements.length) return;
  
  let scatterTexts = [];
  titleElements.forEach(element => {
    // Only apply scatter effect to hero section
    const isHeroTitle = element.closest('.hero');
    if (isHeroTitle) {
      scatterTexts.push(new ScatterText(element));
    }
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
    
    // Update smooth background morphing
    updateSectionBackgrounds();
    
    // Update all sections' viewport and active status
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionBottom = sectionTop + sectionHeight;
      
      // Check if section is in viewport
      const isInViewport = sectionBottom > scrollY && sectionTop < scrollY + windowHeight;
      section.classList.toggle('in-viewport', isInViewport);
      
      // Add active class for the section that's most centered
      const sectionCenter = sectionTop + (sectionHeight / 2);
      const windowCenter = scrollY + (windowHeight / 2);
      const distanceFromCenter = Math.abs(windowCenter - sectionCenter);
      
      if (distanceFromCenter < sectionHeight / 2) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });
    
    // Update scatter text effects (only for hero)
    scatterTexts.forEach(scatterText => {
      const section = scatterText.element.closest('section');
      if (!section) return;
      
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionBottom = sectionTop + sectionHeight;
      
      const isInViewport = sectionBottom > scrollY && sectionTop < scrollY + windowHeight;
      
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
  
  // Keep original scroll event handling to preserve text animations
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
  
  // Initialize scroll state
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
    const targetId = link.getAttribute('href')?.slice(1) || 'home';
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  
  // Initialize background state
  updateSectionBackgrounds();
});