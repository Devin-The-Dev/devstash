(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  initNavbar();
  initReveal();
  initPricingToggle();
  initChaos();
  setYear();

  // Nav background fades from translucent to near-opaque over the first 240px.
  function initNavbar() {
    const nav = document.querySelector("[data-nav]");
    if (!nav) return;

    const MIN_ALPHA = 0.55;
    const MAX_ALPHA = 0.94;
    const RANGE = 240;
    let queued = false;

    function update() {
      const progress = Math.min(window.scrollY / RANGE, 1);
      nav.style.setProperty("--nav-alpha", String(MIN_ALPHA + (MAX_ALPHA - MIN_ALPHA) * progress));
      queued = false;
    }

    window.addEventListener(
      "scroll",
      () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(update);
      },
      { passive: true },
    );
    update();
  }

  function initReveal() {
    const elements = document.querySelectorAll(".reveal");
    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    elements.forEach((el) => observer.observe(el));
  }

  function initPricingToggle() {
    const toggle = document.querySelector("[data-billing-toggle]");
    if (!toggle) return;

    const price = document.querySelector("[data-price]");
    const period = document.querySelector("[data-period]");
    const note = document.querySelector("[data-price-note]");
    const labels = document.querySelectorAll("[data-billing-label]");
    const PLANS = {
      monthly: { price: "$8", period: "/month", note: "Billed monthly, cancel anytime" },
      yearly: { price: "$72", period: "/year", note: "Just $6/month, billed annually" },
    };

    function render(yearly) {
      const plan = yearly ? PLANS.yearly : PLANS.monthly;
      toggle.setAttribute("aria-checked", String(yearly));
      price.textContent = plan.price;
      period.textContent = plan.period;
      note.textContent = plan.note;
      labels.forEach((label) => {
        label.classList.toggle("is-active", (label.dataset.billingLabel === "yearly") === yearly);
      });
    }

    toggle.addEventListener("click", () => {
      render(toggle.getAttribute("aria-checked") !== "true");
    });
    labels.forEach((label) => {
      label.addEventListener("click", () => render(label.dataset.billingLabel === "yearly"));
    });
    render(false);
  }

  // Icons drift, bounce off the walls, wobble and pulse, and flee the cursor.
  function initChaos() {
    const field = document.querySelector("[data-chaos-field]");
    if (!field) return;

    const REPEL_RADIUS = 120;
    const REPEL_FORCE = 2600; // px/s² at the cursor, fading to 0 at the radius
    const MAX_SPEED = 320; // px/s
    const TAU = Math.PI * 2;
    const random = (min, max) => min + Math.random() * (max - min);

    const pointer = { x: 0, y: 0, active: false };
    let width = 0;
    let height = 0;
    let frameId = 0;
    let lastTime = 0;
    let inView = true;

    const particles = [...field.querySelectorAll(".chaos-icon")].map((el) => {
      const angle = random(0, TAU);
      const baseSpeed = random(28, 48);
      return {
        el,
        size: el.offsetWidth || 52,
        x: 0,
        y: 0,
        vx: Math.cos(angle) * baseSpeed,
        vy: Math.sin(angle) * baseSpeed,
        baseSpeed,
        phase: random(0, TAU),
        wobble: random(6, 14), // max rotation, degrees
      };
    });

    function measure() {
      width = field.clientWidth;
      height = field.clientHeight;
    }

    // Spread icons over a jittered 4×2 grid so they don't start stacked.
    function scatter() {
      const cols = 4;
      const rows = Math.ceil(particles.length / cols);
      const cellW = width / cols;
      const cellH = height / rows;
      particles.forEach((p, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        p.x = col * cellW + random(0, Math.max(0, cellW - p.size));
        p.y = row * cellH + random(0, Math.max(0, cellH - p.size));
      });
    }

    function render(time) {
      const t = time / 1000;
      for (const p of particles) {
        const rotation = Math.sin(t * 0.7 + p.phase) * p.wobble;
        const scale = 1 + Math.sin(t * 1.4 + p.phase * 2) * 0.06;
        p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${rotation}deg) scale(${scale})`;
      }
    }

    function step(dt) {
      for (const p of particles) {
        if (pointer.active) {
          const dx = p.x + p.size / 2 - pointer.x;
          const dy = p.y + p.size / 2 - pointer.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < REPEL_RADIUS) {
            const push = REPEL_FORCE * (1 - dist / REPEL_RADIUS) * dt;
            p.vx += (dx / dist) * push;
            p.vy += (dy / dist) * push;
          }
        }

        // Ease speed back toward the icon's cruising speed after a push.
        const speed = Math.hypot(p.vx, p.vy) || 1;
        const target = Math.min(speed + (p.baseSpeed - speed) * Math.min(1, dt * 1.6), MAX_SPEED);
        p.vx = (p.vx / speed) * target;
        p.vy = (p.vy / speed) * target;

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        const maxX = width - p.size;
        const maxY = height - p.size;
        if (p.x < 0) {
          p.x = 0;
          p.vx = Math.abs(p.vx);
        } else if (p.x > maxX) {
          p.x = maxX;
          p.vx = -Math.abs(p.vx);
        }
        if (p.y < 0) {
          p.y = 0;
          p.vy = Math.abs(p.vy);
        } else if (p.y > maxY) {
          p.y = maxY;
          p.vy = -Math.abs(p.vy);
        }
      }
    }

    function frame(time) {
      const dt = Math.min((time - lastTime) / 1000, 0.05); // clamp after tab switches
      lastTime = time;
      step(dt);
      render(time);
      frameId = requestAnimationFrame(frame);
    }

    function start() {
      if (frameId || reducedMotion.matches || !inView) return;
      lastTime = performance.now();
      frameId = requestAnimationFrame(frame);
    }

    function stop() {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }

    function updatePointer(event) {
      const rect = field.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    }

    field.addEventListener("pointermove", updatePointer);
    field.addEventListener("pointerdown", updatePointer);
    field.addEventListener("pointerleave", () => (pointer.active = false));
    field.addEventListener("pointercancel", () => (pointer.active = false));

    new ResizeObserver(() => {
      measure();
      for (const p of particles) {
        p.x = Math.min(p.x, Math.max(0, width - p.size));
        p.y = Math.min(p.y, Math.max(0, height - p.size));
      }
      if (!frameId) render(performance.now());
    }).observe(field);

    // Only animate while the hero is on screen.
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) start();
      else stop();
    }).observe(field);

    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) stop();
      else start();
    });

    measure();
    scatter();
    render(0);
    start();
  }

  function setYear() {
    document.querySelectorAll("[data-year]").forEach((el) => {
      el.textContent = String(new Date().getFullYear());
    });
  }
})();
