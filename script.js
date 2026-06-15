/* ===== PURPLE-BLUE CONSTELLATION NETWORK ===== */
(function () {
  const canvas = document.getElementById('bgCanvas');
  const ctx    = canvas.getContext('2d');

  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    init();
  });

  const mouse = { x: -9999, y: -9999 };
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  /* Section brightness */
  let bMult = 1.0, bTarget = 1.0;
  function updateBrightness() {
    const inView = el => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight * 0.65 && r.bottom > window.innerHeight * 0.35;
    };
    if      (inView(document.getElementById('contact')))                                              bTarget = 1.5;
    else if (inView(document.getElementById('skills')) || inView(document.getElementById('experience'))) bTarget = 0.35;
    else                                                                                               bTarget = 0.8;
  }
  window.addEventListener('scroll', updateBrightness);
  updateBrightness();

  /* Fewer particles = no cluster */
  const COUNT     = () => window.innerWidth < 768 ? 32 : 48;
  const LINK_DIST = 130;   /* proximity trigger distance */
  const GLOW_DIST = 70;    /* extra glow when very close */
  const MOUSE_R   = 140;
  const MOUSE_F   = 0.009;

  const COLORS = [
    [108, 99,  255],
    [79,  140, 255],
    [139, 92,  246],
    [99,  179, 255],
  ];

  let particles = [];
  const rand = (a, b) => Math.random() * (b - a) + a;

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x  = rand(0, W);
      this.y  = rand(0, H);
      this.vx = rand(-0.12, 0.12);
      this.vy = rand(-0.12, 0.12);
      /* ensure minimum speed so particles always move */
      if (Math.abs(this.vx) < 0.04) this.vx = 0.04 * Math.sign(this.vx || 1);
      if (Math.abs(this.vy) < 0.04) this.vy = 0.04 * Math.sign(this.vy || 1);
      this.r     = rand(1.2, 2.2);
      this.alpha = rand(0.4, 0.75);
      this.c     = COLORS[Math.floor(Math.random() * COLORS.length)];
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      /* WRAP edges — prevents wall-bounce clustering */
      if (this.x < -10) this.x = W + 10;
      if (this.x > W+10) this.x = -10;
      if (this.y < -10) this.y = H + 10;
      if (this.y > H+10) this.y = -10;

      /* gentle cursor attraction */
      const dx = mouse.x - this.x, dy = mouse.y - this.y;
      const d  = Math.sqrt(dx*dx + dy*dy);
      if (d < MOUSE_R && d > 0) {
        const f = (1 - d/MOUSE_R) * MOUSE_F;
        this.vx += (dx/d)*f; this.vy += (dy/d)*f;
        const spd = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
        if (spd > 0.45) { this.vx=(this.vx/spd)*0.45; this.vy=(this.vy/spd)*0.45; }
      }
    }
    draw(glowBoost = 0) {
      const [r,g,b] = this.c;
      const a = Math.min(1, (this.alpha + glowBoost) * bMult);

      /* proximity glow — brightens when another particle is very close */
      if (glowBoost > 0) {
        const gr = ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.r*7);
        gr.addColorStop(0, `rgba(${r},${g},${b},${Math.min(0.6, glowBoost * 0.8)})`);
        gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath(); ctx.arc(this.x,this.y,this.r*7,0,Math.PI*2);
        ctx.fillStyle = gr; ctx.fill();
      }

      /* soft base halo */
      const grd = ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.r*3.5);
      grd.addColorStop(0, `rgba(${r},${g},${b},${a*0.3})`);
      grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath(); ctx.arc(this.x,this.y,this.r*3.5,0,Math.PI*2);
      ctx.fillStyle = grd; ctx.fill();

      /* core dot */
      ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(${r},${g},${b},${a})`; ctx.fill();
    }
  }

  /* Pre-compute proximity glow boost per particle */
  function computeGlows() {
    const boosts = new Float32Array(particles.length);
    for (let i = 0; i < particles.length; i++) {
      for (let j = i+1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        if (d < GLOW_DIST) {
          const b = (1 - d/GLOW_DIST) * 0.5; /* glow strength */
          boosts[i] += b; boosts[j] += b;
        }
      }
    }
    return boosts;
  }

  function drawLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i+1; j < particles.length; j++) {
        const dx = particles[i].x-particles[j].x;
        const dy = particles[i].y-particles[j].y;
        const d  = Math.sqrt(dx*dx+dy*dy);
        if (d < LINK_DIST) {
          const fade = 1 - d/LINK_DIST;
          const op   = Math.min(1, fade * 0.30 * bMult);
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(120,100,255,${op})`;
          ctx.lineWidth   = fade * 0.8;
          ctx.stroke();
        }
      }
    }
  }

  function init() {
    particles = [];
    for (let i = 0; i < COUNT(); i++) particles.push(new Particle());
  }

  function animate() {
    bMult += (bTarget - bMult) * 0.04;
    ctx.clearRect(0, 0, W, H);
    const boosts = computeGlows();
    drawLines();
    particles.forEach((p, i) => { p.update(); p.draw(boosts[i]); });
    requestAnimationFrame(animate);
  }

  init();
  animate();
})();


/* ===== TYPED TEXT ===== */
const phrases = ['Data Analyst','Business Analyst','SQL Developer','Python Enthusiast','Insight Storyteller'];
let phraseIndex = 0, charIndex = 0, isDeleting = false;
const typedEl = document.getElementById('typedText');

function type() {
  const current = phrases[phraseIndex];
  typedEl.textContent = isDeleting
    ? current.substring(0, charIndex - 1)
    : current.substring(0, charIndex + 1);
  isDeleting ? charIndex-- : charIndex++;
  let delay = isDeleting ? 60 : 100;
  if (!isDeleting && charIndex === current.length) { delay = 1800; isDeleting = true; }
  else if (isDeleting && charIndex === 0) {
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
const navCenter = document.querySelector('.nav-center');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navCenter.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navCenter.classList.remove('open');
  });
});

/* ===== ACTIVE NAV LINK ON SCROLL ===== */
const sections   = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting)
      navAnchors.forEach(a =>
        a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id)
      );
  });
}, { rootMargin: '-40% 0px -55% 0px' });
sections.forEach(s => sectionObserver.observe(s));

/* ===== SCROLL REVEAL ===== */
const revealEls = document.querySelectorAll('.skill-category,.timeline-item,.project-card,.edu-entry');
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
const filterBtns   = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    projectCards.forEach(card => {
      card.classList.toggle('hidden',
        filter !== 'all' && !(card.dataset.category || '').includes(filter));
    });
  });
});

/* ===== SMOOTH SCROLL OFFSET ===== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - 70,
        behavior: 'smooth'
      });
    }
  });
});
