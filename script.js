/* ===== ANIMATED PARTICLE BACKGROUND ===== */
(function () {
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');

  let W = window.innerWidth;
  let H = window.innerHeight;
  canvas.width = W;
  canvas.height = H;

  // Track mouse position
  let mouse = { x: -9999, y: -9999 };
  const HOVER_RADIUS = 120;   // particles within this distance react
  const REPEL_DIST   = 80;    // particles this close get pushed away

  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  window.addEventListener('resize', () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    initParticles();
  });

  const PARTICLE_COUNT = 90;
  const MAX_DIST       = 140;
  const COLORS = ['#6c63ff', '#8b5cf6', '#a78bfa', '#00d4aa', '#c4b5fd'];

  let particles = [];

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function Particle() {
    this.x    = rand(0, W);
    this.y    = rand(0, H);
    this.ox   = this.x;   // original x
    this.oy   = this.y;   // original y
    this.vx   = rand(-0.4, 0.4);
    this.vy   = rand(-0.4, 0.4);
    this.r    = rand(1.5, 3.5);
    this.baseR = this.r;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.alpha = rand(0.4, 0.9);
    this.baseAlpha = this.alpha;
  }

  Particle.prototype.update = function () {
    // Normal drift
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > W) this.vx *= -1;
    if (this.y < 0 || this.y > H) this.vy *= -1;

    // Mouse interaction
    const dx   = this.x - mouse.x;
    const dy   = this.y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < HOVER_RADIUS) {
      const force = (HOVER_RADIUS - dist) / HOVER_RADIUS;

      if (dist < REPEL_DIST) {
        // Repel — push away from cursor
        this.x += (dx / dist) * force * 3;
        this.y += (dy / dist) * force * 3;
      }

      // Glow effect: grow size and brighten
      this.r     = this.baseR + force * 4;
      this.alpha = Math.min(1, this.baseAlpha + force * 0.6);
    } else {
      // Ease back to normal
      this.r     += (this.baseR - this.r) * 0.1;
      this.alpha += (this.baseAlpha - this.alpha) * 0.1;
    }
  };

  Particle.prototype.draw = function () {
    // Glow halo when near mouse
    const dx   = this.x - mouse.x;
    const dy   = this.y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < HOVER_RADIUS) {
      const force = (HOVER_RADIUS - dist) / HOVER_RADIUS;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 3, 0, Math.PI * 2);
      const grd = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 3);
      grd.addColorStop(0, `rgba(167,139,250,${force * 0.35})`);
      grd.addColorStop(1, 'rgba(167,139,250,0)');
      ctx.fillStyle = grd;
      ctx.globalAlpha = 1;
      ctx.fill();
    }

    // Core dot
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.alpha;
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  function initParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }
  }

  function drawLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx   = particles[i].x - particles[j].x;
        const dy   = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          // Lines near mouse glow brighter
          const mi = Math.sqrt((particles[i].x-mouse.x)**2+(particles[i].y-mouse.y)**2);
          const mj = Math.sqrt((particles[j].x-mouse.x)**2+(particles[j].y-mouse.y)**2);
          const nearMouse = Math.min(mi, mj) < HOVER_RADIUS;
          const baseOpacity = (1 - dist / MAX_DIST) * 0.25;
          const opacity = nearMouse ? Math.min(0.8, baseOpacity * 4) : baseOpacity;
          const color   = nearMouse ? `rgba(167,139,250,${opacity})` : `rgba(108,99,255,${opacity})`;

          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = color;
          ctx.lineWidth = nearMouse ? 1.5 : 0.8;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    drawLines();
    requestAnimationFrame(animate);
  }

  initParticles();
  animate();
})();


/* ===== TYPED TEXT ===== */
const phrases = [
  'Data Analyst',
  'Business Analyst',
  'SQL Developer',
  'Python Enthusiast',
  'Insight Storyteller'
];
let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;
const typedEl = document.getElementById('typedText');

function type() {
  const current = phrases[phraseIndex];
  if (isDeleting) {
    typedEl.textContent = current.substring(0, charIndex - 1);
    charIndex--;
  } else {
    typedEl.textContent = current.substring(0, charIndex + 1);
    charIndex++;
  }

  let delay = isDeleting ? 60 : 100;

  if (!isDeleting && charIndex === current.length) {
    delay = 1800;
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    phraseIndex = (phraseIndex + 1) % phrases.length;
    delay = 400;
  }

  setTimeout(type, delay);
}
type();

/* ===== NAVBAR SCROLL ===== */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

/* ===== HAMBURGER MENU ===== */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

/* ===== ACTIVE NAV LINK ON SCROLL ===== */
const sections   = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navAnchors.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => sectionObserver.observe(s));

/* ===== SCROLL REVEAL ===== */
const revealEls = document.querySelectorAll(
  '.skill-category, .timeline-item, .project-card, .edu-entry, .contact-item, .contact-form'
);
revealEls.forEach(el => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

revealEls.forEach(el => revealObserver.observe(el));

/* ===== PROJECT FILTER ===== */
const filterBtns  = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    projectCards.forEach(card => {
      const cats = card.dataset.category || '';
      card.classList.toggle('hidden', filter !== 'all' && !cats.includes(filter));
    });
  });
});

/* ===== SMOOTH SCROLL OFFSET ===== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});
