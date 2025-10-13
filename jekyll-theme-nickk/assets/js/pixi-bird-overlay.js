/*!
 * Pixi Bird Overlay — guaranteed branch landing (fixed platform)
 *
 * What changed (to fix the alignment):
 * - The branch now includes a FIXED, perfectly horizontal "platform" segment (same size/shape every time).
 * - The branch no longer rotates; instead we mirror it for the right side. That keeps the platform flat.
 * - The bird always plans a landing on that platform, and we set the branch's Y so the toes sit right on it.
 * - Branch reveal is quick.
 *
 * Usage:
 *   <script src="https://unpkg.com/pixi.js@7.2.4/dist/pixi.min.js"></script> <!-- optional; auto-loaded if missing -->
 *   <script src="/assets/js/pixi-bird-overlay.js"></script>
 *   <script> PixiBirdOverlay.init(); </script>
 */
(() => {
  const CDN = "https://unpkg.com/pixi.js@7.2.4/dist/pixi.min.js";

  // -------------------- Utilities --------------------
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const onReady = (fn) => (document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", fn, { once: true })
    : fn());

  function ensureCanvas(id = "pixi-overlay") {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("canvas");
      el.id = id;
      document.body.appendChild(el);
    }
    Object.assign(el.style, {
      position: "fixed",
      inset: "0",
      pointerEvents: "none",
      zIndex: "9999"
    });
    return el;
  }

  function loadPixiIfNeeded() {
    if (window.PIXI) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = CDN;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load PIXI from CDN"));
      document.head.appendChild(s);
    });
  }

  // -------------------- Tunables --------------------
  const T = {
    SCROLL_TO_VEL: 0.18,
    MAX_VEL_Y: 220,
    MAX_VEL_X: 220,
    DRAG: 0.92,

    FLAP_SPEED_FLY: 6.0,
    FLAP_SPEED_PERCH: 0.0,

    // Faster idle → land
    NO_SCROLL_BEFORE_LAND_MS: 300,
    EXTRA_LAND_DELAY_MS: 200,
    LAND_DWELL_MS: 800,

    EDGE_MARGIN: 24,
    SIDE_BAND: 120,
    HOP_ON_LAND: 6,

    HOVER_SPRING: 5.0,
    HOVER_DAMP: 0.90,
    HOVER_NOISE_Y: 0.16,
    HOVER_NOISE_Y_SPEED: 1.6,
    HOVER_WANDER_RADIUS: 68,
    HOVER_WANDER_SPEED: 0.22,
    HOVER_JITTER_RADIUS: 6,

    LAND_SPRING: 5.0,
    LAND_DAMP: 0.90,

    LEG_LENGTH: 12,
    LEG_THICK: 3,
    FOOT_LEN: 6,

    TAKEOFF_IGNORE_SCROLL_MS: 220,

    // Branch geometry & dynamics
    PLATFORM_LEN: 140,           // ← fixed straight platform length (px) — SAME every time
    PLATFORM_THICK: 12,          // ← fixed thickness — SAME every time
    DECOR_LEN: 90,               // decorative back half (curvy), not used for landing
    BRANCH_GROW_SPEED: 7.5,      // faster reveal
    BRANCH_RETRACT_SPEED: 3.0,

    DECOR_KINKS_MIN: 2,
    DECOR_KINKS_MAX: 4,
    DECOR_KINK_AMP: 10,
    DECOR_TAPER_POWER: 1.25,

    // Landing window along the platform
    LAND_FROM_ROOT_MIN: 36,
    LAND_FROM_TIP_MARGIN: 16,
  };

  // -------------------- Pixi Helpers --------------------
  function createApp({ canvas }) {
    const app = new PIXI.Application({
      view: canvas,
      resizeTo: window,
      backgroundAlpha: 0,
      antialias: true,
      powerPreference: "high-performance",
    });
    app.stage.sortableChildren = true;
    return app;
  }

  // -------------------- Branch (fixed horizontal platform) --------------------
  class Branch extends PIXI.Container {
    constructor(app) {
      super();
      this.app = app;
      this.side = "right";      // 'left' | 'right'
      this.progress = 0;        // 0..1 reveal
      this.targetProgress = 0;

      // Children
      this.graphics = new PIXI.Graphics(); // platform + decor drawn here
      this.addChild(this.graphics);

      // We flip the whole container on X for right side (scale.x = -1),
      // so platform is ALWAYS horizontal and extends inward from the edge.
      this.scale.set(1, 1);
      this.zIndex = 1;

      this._drawShape();     // uses fixed PLATFORM_LEN and DECOR_LEN
      this._placeAtEdge();
      this._applyReveal();
    }

    // Draw a fixed, horizontal platform [0 → PLATFORM_LEN], then decorative curvy bit to PLATFORM_LEN+DECOR_LEN
    _drawShape() {
      const g = this.graphics;
      g.clear();

      const PL = T.PLATFORM_LEN;
      const TL = T.PLATFORM_THICK;
      const DL = T.DECOR_LEN;

      // Platform: solid rectangle, y centered at 0
      g.beginFill(0x000000, 1);
      g.drawRect(0, -TL * 0.5, PL, TL);
      g.endFill();

      // Decorative curvy extension beyond the platform
      const xs = [PL];
      const kinks = Math.floor(Math.random() * (T.DECOR_KINKS_MAX - T.DECOR_KINKS_MIN + 1)) + T.DECOR_KINKS_MIN;
      for (let i = 1; i <= kinks; i++) {
        xs.push(PL + (DL * (i / (kinks + 1))));
      }
      xs.push(PL + DL);

      // Offsets for the spine (small up/down bends)
      const ys = xs.map((x, i) => {
        if (x >= PL + DL) return 0; // tip centered
        return (Math.random() * 2 - 1) * T.DECOR_KINK_AMP;
      });

      // Width taper from platform thickness down to 0 at the tip
      const widths = xs.map((x) => {
        const t = (x - PL) / DL; // 0..1 across decorative section
        const taper = Math.max(0, Math.pow(1 - t, T.DECOR_TAPER_POWER));
        return TL * taper;
      });

      // Build polygon for decorative section
      const upper = [];
      const lower = [];
      for (let i = 0; i < xs.length; i++) {
        const x = xs[i], y = ys[i], wHalf = widths[i] * 0.5;
        const iPrev = Math.max(0, i - 1);
        const iNext = Math.min(xs.length - 1, i + 1);
        const tx = xs[iNext] - xs[iPrev];
        const ty = ys[iNext] - ys[iPrev];
        const mag = Math.max(1e-6, Math.hypot(tx, ty));
        const nx = -ty / mag, ny = tx / mag;
        upper.push([x + nx * wHalf, y + ny * wHalf]);
        lower.push([x - nx * wHalf, y - ny * wHalf]);
      }

      g.beginFill(0x000000, 1);
      g.moveTo(PL, -TL * 0.5);
      // connect platform edge to decorative upper
      for (let i = 0; i < upper.length; i++) g.lineTo(upper[i][0], upper[i][1]);
      // then back via lower
      for (let i = lower.length - 1; i >= 0; i--) g.lineTo(lower[i][0], lower[i][1]);
      // and finally to the bottom edge of platform
      g.lineTo(PL, TL * 0.5);
      g.closePath();
      g.endFill();
    }

    _applyReveal() {
      // Reveal by scaling inner graphics on X only (from the root)
      this.graphics.scale.set(this.progress, 1);
      this.graphics.visible = this.progress > 0.001;
      this.visible = this.progress > 0.001;
    }

    _placeAtEdge() {
      const w = this.app.renderer.width;
      // Horizontal placement at edges; we mirror scale.x for right side.
      if (this.side === "right") {
        this.x = w;
        this.scale.x = -1; // mirror so platform grows inward from the right
      } else {
        this.x = 0;
        this.scale.x = 1;  // normal (inward from left)
      }
      // Y is controlled externally to align with the bird's feet.
    }

    show(side) {
      this.side = side;
      this._drawShape();  // refresh decor only (platform stays identical)
      this._placeAtEdge();
      this.targetProgress = 1;
    }

    hide() { this.targetProgress = 0; }

    update(dt) {
      const speed = (this.targetProgress > this.progress) ? T.BRANCH_GROW_SPEED : T.BRANCH_RETRACT_SPEED;
      const dir = Math.sign(this.targetProgress - this.progress);
      if (dir !== 0) {
        this.progress += dir * speed * dt;
        if ((dir > 0 && this.progress > this.targetProgress) ||
            (dir < 0 && this.progress < this.targetProgress)) {
          this.progress = this.targetProgress;
        }
        this._applyReveal();
      }
    }
  }

  // -------------------- Bird --------------------
  class Bird extends PIXI.Container {
    constructor(app, branch) {
      super();
      this.app = app;
      this.branch = branch;

      this.state = "perched"; // 'perched' | 'hovering' | 'landing'
      this.vx = 0;
      this.vy = 0;
      this.flapPhase = 0;

      this.hoverTarget = { x: 0, y: 0 };
      this.landTarget  = { x: 0, y: 0 };
      this.lastLandingSide = "right";
      this.wanderTheta = Math.random() * Math.PI * 2;
      this.landDwellUntil = 0;
      this.takeoffIgnoreUntil = 0;

      // Parts
      this.body = new PIXI.Graphics();
      this.leftWing = new PIXI.Graphics();
      this.rightWing = new PIXI.Graphics();
      this._drawBody();
      this._drawWing(this.leftWing);
      this._drawWing(this.rightWing);
      this.addChild(this.leftWing, this.rightWing, this.body);
      this.rightWing.scale.x = -1;
      this.leftWing.position.set(-10, -6);
      this.rightWing.position.set(10, -6);
      this.legs.visible = false;

      this.scale.set(1.2);
      this.zIndex = 2;
    }

    _drawBody() {
      const g = this.body;
      g.clear();
      g.lineStyle(2, 0x222222, 1);
      g.beginFill(0x334455, 1); g.drawEllipse(0, 0, 16, 10); g.endFill();
      g.beginFill(0x445566, 1); g.drawCircle(14, -6, 6); g.endFill();
      g.beginFill(0xD99911, 1);
      g.moveTo(20, -6); g.lineTo(28, -4); g.lineTo(20, -2); g.closePath(); g.endFill();

      // Legs
      if (this.legs) this.removeChild(this.legs);
      this.legs = new PIXI.Graphics();
      this.legs.lineStyle(T.LEG_THICK, 0x3a2208, 1);

      // Left leg
      this.legs.moveTo(-3, 10);
      this.legs.lineTo(-3, 10 + T.LEG_LENGTH);
      this.legs.moveTo(-3, 10 + T.LEG_LENGTH);
      this.legs.lineTo(-3 - T.FOOT_LEN, 10 + T.LEG_LENGTH + 2);
      this.legs.moveTo(-3, 10 + T.LEG_LENGTH);
      this.legs.lineTo(-3 + T.FOOT_LEN, 10 + T.LEG_LENGTH + 2);

      // Right leg
      this.legs.moveTo(3, 10);
      this.legs.lineTo(3, 10 + T.LEG_LENGTH);
      this.legs.moveTo(3, 10 + T.LEG_LENGTH);
      this.legs.lineTo(3 - T.FOOT_LEN, 10 + T.LEG_LENGTH + 2);
      this.legs.moveTo(3, 10 + T.LEG_LENGTH);
      this.legs.lineTo(3 + T.FOOT_LEN, 10 + T.LEG_LENGTH + 2);

      this.addChild(this.legs);
    }

    _drawWing(wing) {
      wing.clear();
      wing.lineStyle(2, 0x222222, 1);
      wing.beginFill(0x556677, 1);
      wing.moveTo(0, 0);
      wing.quadraticCurveTo(-18, -6, -26, -2);
      wing.quadraticCurveTo(-14, 6, 0, 0);
      wing.endFill();
      wing.pivot.set(-2, 0);
    }

    setState(next) {
      if (this.state === next) return;
      this.state = next;
      if (next === "perched") {
        this.vx = 0; this.vy = 0;
        this.legs.visible = true;
        this.landDwellUntil = performance.now() + T.LAND_DWELL_MS;
      } else {
        this.legs.visible = false;
      }
    }

    _randSideBandX() {
      const w = this.app.renderer.width;
      const leftMax = w * 0.30 - T.EDGE_MARGIN;
      const rightMin = w * 0.70 + T.EDGE_MARGIN;
      return (Math.random() < 0.5)
        ? rand(T.EDGE_MARGIN + 60, Math.max(T.EDGE_MARGIN + 61, leftMax))
        : rand(Math.min(w - T.EDGE_MARGIN - 60, rightMin), w - T.EDGE_MARGIN - 60);
    }

    chooseRandomUpperHalfHover() {
      const h = this.app.renderer.height;
      this.hoverTarget.x = this._randSideBandX();
      this.hoverTarget.y = rand(T.EDGE_MARGIN, Math.max(T.EDGE_MARGIN + 1, h * 0.5 - T.EDGE_MARGIN));
      this.wanderTheta = Math.random() * Math.PI * 2;
    }

    /**
     * Plan a landing exactly on the fixed, horizontal platform.
     * - Select a side
     * - Choose a distance `d` along the platform
     * - Set branch X/Y so the platform Y equals toes Y
     * - Set bird landTarget at the body center above that point
     */
    planLandingOnPlatform() {
      const w = this.app.renderer.width;
      const h = this.app.renderer.height;

      const side = (Math.random() < 0.5) ? "right" : "left";
      this.lastLandingSide = side;
      this.branch.side = side;
      this.branch._placeAtEdge();

      // Choose body Y (target) in upper half; compute feet Y
      const bodyY = rand(T.EDGE_MARGIN, Math.max(T.EDGE_MARGIN + 1, h * 0.5 - T.EDGE_MARGIN));
      const FEET_OFFSET = 10 + T.LEG_LENGTH; // body center → toes
      const feetY = bodyY + FEET_OFFSET;

      // Choose distance along platform
      const dMin = T.LAND_FROM_ROOT_MIN;
      const dMax = Math.max(dMin + 1, T.PLATFORM_LEN - T.LAND_FROM_TIP_MARGIN);
      const d = rand(dMin, dMax);

      // Compute world X on platform (platform is horizontal)
      const x = (side === "right") ? (w - d) : d;

      // Align branch root Y to feet Y (+ tiny overlap) so toes sit ON the platform
      this.branch.y = feetY + 2;

      // Set land target to the body position centered above the platform contact
      this.landTarget.x = x;
      this.landTarget.y = bodyY;
    }

    gentleNudgeTowardHover(amount = 0.15) {
      this.x += (this.hoverTarget.x - this.x) * amount;
      this.y += (this.hoverTarget.y - this.y) * amount;
      this.vx = 0; this.vy = 0;
    }

    _applySpringTo(targetX, targetY, k, damp, dt) {
      const dx = targetX - this.x;
      const dy = targetY - this.y;
      this.vx = (this.vx + dx * k * dt) * damp;
      this.vy = (this.vy + dy * k * dt) * damp;
      this.vx = clamp(this.vx, -T.MAX_VEL_X, T.MAX_VEL_X);
      this.vy = clamp(this.vy, -T.MAX_VEL_Y, T.MAX_VEL_Y);
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }

    feetY() { return this.y + 10 + T.LEG_LENGTH; }

    update(dtMs) {
      const dt = dtMs / 1000;
      const t = performance.now() / 1000;

      // Wings
      const flapSpeed = this.state === "perched" ? T.FLAP_SPEED_PERCH : T.FLAP_SPEED_FLY;
      this.flapPhase += flapSpeed * dt * Math.PI * 2;
      const flap = Math.sin(this.flapPhase) * (this.state === "landing" ? 0.35 : 0.75);
      this.leftWing.rotation  = -0.4 + flap * 0.5;
      this.rightWing.rotation =  0.4 - flap * 0.5;

      if (this.state === "hovering") {
        // Wander around hover target, side bands only
        this.wanderTheta += T.HOVER_WANDER_SPEED * dt * Math.PI * 2;
        const wanderX = this.hoverTarget.x + Math.cos(this.wanderTheta) * T.HOVER_WANDER_RADIUS;
        const jitterX = (Math.random() - 0.5) * T.HOVER_JITTER_RADIUS;
        const jitterY = (Math.random() - 0.5) * T.HOVER_JITTER_RADIUS * 0.6;
        const targetX = wanderX + jitterX;
        const targetY = this.hoverTarget.y + jitterY + Math.sin(t * T.HOVER_NOISE_Y_SPEED * 2 * Math.PI) * T.HOVER_NOISE_Y;

        this._applySpringTo(targetX, targetY, T.HOVER_SPRING, T.HOVER_DAMP, dt);

        // Keep on screen vertically
        const minY = T.EDGE_MARGIN, maxY = this.app.renderer.height - T.EDGE_MARGIN;
        this.y = Math.max(minY, Math.min(maxY, this.y));

        // Light damping on scroll-driven vy
        this.vy *= T.DRAG;

      } else if (this.state === "landing") {
        // Consistent spring motion to land target
        this._applySpringTo(this.landTarget.x, this.landTarget.y, T.LAND_SPRING, T.LAND_DAMP, dt);

        // Touchdown
        if (Math.hypot(this.landTarget.x - this.x, this.landTarget.y - this.y) < 2) {
          this.position.set(this.landTarget.x, this.landTarget.y - T.HOP_ON_LAND);
          this.setState("perched");
          this.branch.show(this.lastLandingSide); // fast reveal
        }

      } else if (this.state === "perched") {
        // Tiny settle hop
        if (this.position.y < this.landTarget.y) {
          this.position.y = Math.min(this.landTarget.y, this.position.y + 40 * dt);
        }
      }
    }
  }

  // -------------------- Init & Loop --------------------
  function initSystem({ canvasId = "pixi-overlay" } = {}) {
    const canvas = ensureCanvas(canvasId);
    const app = createApp({ canvas });

    const branch = new Branch(app);
    const bird = new Bird(app, branch);
    app.stage.addChild(branch, bird);

    // Start off-screen at random side/height; enter on first scroll
    let hasEntered = false;
    function spawnOffscreen() {
      const side = Math.random() < 0.5 ? "left" : "right";
      const x = side === "left" ? -150 : app.renderer.width + 150; // off-screen
      const y = rand(T.EDGE_MARGIN, Math.max(T.EDGE_MARGIN + 1, app.renderer.height * 0.6));
      bird.position.set(x, y);
      bird.lastLandingSide = side;
      bird.setState("perched");
      branch.hide();
    }
    spawnOffscreen();

    // Input / idle logic
    let lastScrollY = window.scrollY;
    let lastScrollT = performance.now();
    let idlePrimaryTimer = null;
    let idleSecondaryTimer = null;

    function clearIdleTimers() {
      if (idlePrimaryTimer) { clearTimeout(idlePrimaryTimer); idlePrimaryTimer = null; }
      if (idleSecondaryTimer) { clearTimeout(idleSecondaryTimer); idleSecondaryTimer = null; }
    }

    function beginIdleCountdown() {
      if (!hasEntered) return;
      clearIdleTimers();
      idlePrimaryTimer = setTimeout(() => {
        idleSecondaryTimer = setTimeout(() => {
          // PLAN landing precisely on fixed horizontal platform
          bird.planLandingOnPlatform();
          bird.setState("landing");
          branch.hide();     // ensure we see growth after touchdown
        }, T.EXTRA_LAND_DELAY_MS);
      }, T.NO_SCROLL_BEFORE_LAND_MS);
    }

    function onScrollDelta(dy) {
      const now = performance.now();

      // First interaction: fly in from off-screen, then start hover
      if (!hasEntered) {
        hasEntered = true;
        branch.hide();
        bird.chooseRandomUpperHalfHover();
        bird.gentleNudgeTowardHover(0.18);
        bird.setState("hovering");
        bird.takeoffIgnoreUntil = now + T.TAKEOFF_IGNORE_SCROLL_MS;
        beginIdleCountdown();
        return;
      }

      // Respect landing dwell
      if (bird.state === "perched" && now < bird.landDwellUntil) return;

      const dt = Math.max(1, now - lastScrollT);
      lastScrollT = now;

      // Map scroll to vertical velocity
      const rawVy = (dy / (dt / 1000)) * T.SCROLL_TO_VEL;
      const clampedVy = clamp(rawVy, -T.MAX_VEL_Y, T.MAX_VEL_Y);

      if (bird.state === "perched" || bird.state === "landing") {
        // Takeoff: retract branch and begin hovering
        branch.hide();
        bird.chooseRandomUpperHalfHover();
        bird.gentleNudgeTowardHover(0.15);
        bird.setState("hovering");
        bird.takeoffIgnoreUntil = now + T.TAKEOFF_IGNORE_SCROLL_MS;
      }

      if (bird.state === "hovering" && now > bird.takeoffIgnoreUntil) {
        bird.vy = bird.vy * 0.3 + clampedVy * 0.7;
        bird.vy = clamp(bird.vy, -T.MAX_VEL_Y, T.MAX_VEL_Y);
      }

      beginIdleCountdown();
    }

    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      const dy = y - lastScrollY;
      lastScrollY = y;
      onScrollDelta(dy);
    }, { passive: true });

    window.addEventListener("wheel", (e) => {
      onScrollDelta(e.deltaY);
    }, { passive: true });

    // Ticker
    let lastT = performance.now();
    app.ticker.add(() => {
      const now = performance.now();
      const dt = (now - lastT) / 1000; lastT = now;

      // While landing/perched, keep platform y glued to toes (so it never visually drifts)
      if (bird.state === "landing" || bird.state === "perched") {
        branch.y = bird.feetY() + 2;
      }
      branch.update(dt);
      bird.update(dt * 1000);
    });

    window.addEventListener("resize", () => {
      branch._placeAtEdge();
      if (bird.state === "hovering") {
        bird.chooseRandomUpperHalfHover();
        bird.gentleNudgeTowardHover(0.12);
      }
    });

    // Public API
    return {
      app,
      bird,
      branch,
      showBranch(side = "right") { branch.show(side); },
      hideBranch() { branch.hide(); },
      destroy() {
        clearIdleTimers();
        app.destroy(true, { children: true, texture: true, baseTexture: true });
        canvas.remove();
      }
    };
  }

  // -------------------- Public API --------------------
  window.PixiBirdOverlay = {
    async init(opts = {}) {
      await loadPixiIfNeeded();
      return new Promise((resolve) => {
        onReady(() => resolve(initSystem(opts)));
      });
    }
  };
})();
