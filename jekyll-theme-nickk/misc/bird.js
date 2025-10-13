/*!
 * Pixi Bird Overlay — drop-in JS (no HTML needed)
 * Usage:
 *   <script src="https://unpkg.com/pixi.js@7.2.4/dist/pixi.min.js"></script> <!-- optional; this file will lazy-load if missing -->
 *   <script src="pixi-bird-overlay.js"></script>
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
    // Ensure overlay styling
    Object.assign(el.style, {
      position: "fixed",
      inset: "0",
      pointerEvents: "none",
      zIndex: "9999"
    });
    return el;
  }

  function ensureBaseStyles() {
    // Inject minimal CSS once (idempotent)
    const STYLE_ID = "__pixi_bird_overlay_style__";
    if (document.getElementById(STYLE_ID)) return;
    const css = `
      .pixi-bird-wrap { max-width: 60ch; margin: 4rem auto; padding: 0 1rem; line-height: 1.55; }
      .pixi-bird-spacer { height: 220vh; }
    `;
    const tag = document.createElement("style");
    tag.id = STYLE_ID;
    tag.textContent = css;
    document.head.appendChild(tag);
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

    NO_SCROLL_BEFORE_LAND_MS: 3500,
    EXTRA_LAND_DELAY_MS: 1500,
    LAND_DWELL_MS: 1400,

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

    LAND_SPRING: 5.0,  // tied to hover spring
    LAND_DAMP: 0.90,   // tied to hover damp

    LEG_LENGTH: 12,
    LEG_THICK: 3,
    FOOT_LEN: 6,

    TAKEOFF_IGNORE_SCROLL_MS: 220,

    BRANCH_LENGTH: 216,
    BRANCH_THICK: 12,
    BRANCH_GROW_SPEED: 2.5,
    BRANCH_RETRACT_SPEED: 3.0,
    BRANCH_ANGLE_UP_DEG: 18,
    BRANCH_ANGLE_DOWN_DEG: 12,
    BRANCH_ANGLE_BIAS_UP: 0.65,
    BRANCH_KINKS_MIN: 2,
    BRANCH_KINKS_MAX: 4,
    BRANCH_KINK_AMP: 10,
    BRANCH_TAPER_POWER: 1.25,
  };

  // -------------------- Pixi Bird Overlay --------------------
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

  class Branch extends PIXI.Container {
    constructor(app) {
      super();
      this.app = app;
      this.side = "right";
      this.progress = 0;
      this.targetProgress = 0;
      this.len = T.BRANCH_LENGTH;
      this.angleOffsetRad = 0;
      this.graphics = new PIXI.Graphics();
      this.addChild(this.graphics);
      this.graphics.scale.set(0, 1);
      this.zIndex = 1;
      this._buildRandomShape();
      this._placeAtEdge();
    }
    show(side) {
      this.side = side;
      const tiltUp = Math.random() < T.BRANCH_ANGLE_BIAS_UP;
      const deg = tiltUp ? -(Math.random() * T.BRANCH_ANGLE_UP_DEG)
                         :  (Math.random() * T.BRANCH_ANGLE_DOWN_DEG);
      this.angleOffsetRad = deg * Math.PI / 180;
      this._buildRandomShape();
      this._placeAtEdge();
      this.targetProgress = 1;
    }
    hide() { this.targetProgress = 0; }

    _placeAtEdge() {
      const w = this.app.renderer.width;
      if (this.side === "right") {
        this.x = w;
        this.rotation = Math.PI + this.angleOffsetRad;
      } else {
        this.x = 0;
        this.rotation = 0 + this.angleOffsetRad;
      }
    }
    _buildRandomShape() {
      const g = this.graphics;
      g.clear();
      const L = this.len;
      const straightEnd = L * 0.5;

      const xs = [0, straightEnd];
      const kinkCount = Math.floor(Math.random() * (T.BRANCH_KINKS_MAX - T.BRANCH_KINKS_MIN + 1)) + T.BRANCH_KINKS_MIN;
      for (let i = 0; i < kinkCount; i++) xs.push(L * (0.55 + 0.35 * Math.random()));
      xs.push(L);
      xs.sort((a, b) => a - b);

      const ys = xs.map((x) => {
        if (x <= straightEnd) return 0;
        if (x >= L) return 0;
        return (Math.random() * 2 - 1) * T.BRANCH_KINK_AMP;
      });

      const widths = xs.map(x => {
        if (x <= straightEnd) return T.BRANCH_THICK;
        const t = (x - straightEnd) / (L - straightEnd);
        const taper = Math.pow(1 - t, T.BRANCH_TAPER_POWER);
        return Math.max(0, T.BRANCH_THICK * taper);
      });

      const upper = [], lower = [];
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
      g.moveTo(upper[0][0], upper[0][1]);
      for (let i = 1; i < upper.length; i++) g.lineTo(upper[i][0], upper[i][1]);
      for (let i = lower.length - 1; i >= 0; i--) g.lineTo(lower[i][0], lower[i][1]);
      g.closePath();
      g.endFill();

      // pointed tip
      const tipX = xs[xs.length - 1], tipY = ys[ys.length - 1];
      g.beginFill(0x000000, 1);
      g.moveTo(tipX, tipY);
      g.lineTo(tipX - 12, tipY - 4);
      g.lineTo(tipX - 12, tipY + 4);
      g.closePath();
      g.endFill();

      g.scale.x = this.progress;
      this.visible = this.progress > 0.001;
    }

    update(dt) {
      const speed = (this.targetProgress > this.progress) ? T.BRANCH_GROW_SPEED : T.BRANCH_RETRACT_SPEED;
      const dir = Math.sign(this.targetProgress - this.progress);
      if (dir !== 0) {
        this.progress += dir * speed * dt;
        if ((dir > 0 && this.progress > this.targetProgress) ||
            (dir < 0 && this.progress < this.targetProgress)) {
          this.progress = this.targetProgress;
        }
        this.graphics.scale.x = this.progress;
        this.visible = this.progress > 0.001;
      }
    }
  }

  class Bird extends PIXI.Container {
    constructor(app) {
      super();
      this.app = app;
      this.state = "perched"; // 'perched' | 'hovering' | 'landing'
      this.vx = 0; this.vy = 0;
      this.flapPhase = 0;
      this.hoverTarget = { x: 0, y: 0 };
      this.landTarget = { x: 0, y: 0 };
      this.lastLandingSide = "right";
      this.wanderTheta = Math.random() * Math.PI * 2;
      this.landDwellUntil = 0;
      this.takeoffIgnoreUntil = 0;

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

      this.position.set(this.app.renderer.width - T.SIDE_BAND, this.app.renderer.height * 0.75);
    }

    _drawBody() {
      const g = this.body;
      g.clear();
      g.lineStyle(2, 0x222222, 1);
      g.beginFill(0x334455, 1); g.drawEllipse(0, 0, 16, 10); g.endFill();
      g.beginFill(0x445566, 1); g.drawCircle(14, -6, 6); g.endFill();
      g.beginFill(0xD99911, 1);
      g.moveTo(20, -6); g.lineTo(28, -4); g.lineTo(20, -2); g.closePath(); g.endFill();

      if (this.legs) this.removeChild(this.legs);
      this.legs = new PIXI.Graphics();
      this.legs.lineStyle(T.LEG_THICK, 0x3a2208, 1);

      // left leg
      this.legs.moveTo(-3, 10);
      this.legs.lineTo(-3, 10 + T.LEG_LENGTH);
      this.legs.moveTo(-3, 10 + T.LEG_LENGTH);
      this.legs.lineTo(-3 - T.FOOT_LEN, 10 + T.LEG_LENGTH + 2);
      this.legs.moveTo(-3, 10 + T.LEG_LENGTH);
      this.legs.lineTo(-3 + T.FOOT_LEN, 10 + T.LEG_LENGTH + 2);

      // right leg
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

    chooseRandomUpperHalfSideLanding() {
      const w = this.app.renderer.width, h = this.app.renderer.height;
      const onRight = Math.random() < 0.5;
      this.lastLandingSide = onRight ? "right" : "left";
      this.landTarget.x = onRight
        ? Math.max(w - T.SIDE_BAND, w - T.EDGE_MARGIN - 40)
        : Math.min(T.SIDE_BAND, T.EDGE_MARGIN + 40);
      this.landTarget.y = rand(T.EDGE_MARGIN, Math.max(T.EDGE_MARGIN + 1, h * 0.5 - T.EDGE_MARGIN));
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
      const flapSpeed = this.state === "perched" ? T.FLAP_SPEED_PERCH : T.FLAP_SPEED_FLY;
      this.flapPhase += flapSpeed * dt * Math.PI * 2;
      const flap = Math.sin(this.flapPhase) * (this.state === "landing" ? 0.35 : 0.75);
      this.leftWing.rotation  = -0.4 + flap * 0.5;
      this.rightWing.rotation =  0.4 - flap * 0.5;

      if (this.state === "hovering") {
        this.wanderTheta += T.HOVER_WANDER_SPEED * dt * Math.PI * 2;
        const wanderX = this.hoverTarget.x + Math.cos(this.wanderTheta) * T.HOVER_WANDER_RADIUS;
        const jitterX = (Math.random() - 0.5) * T.HOVER_JITTER_RADIUS;
        const jitterY = (Math.random() - 0.5) * T.HOVER_JITTER_RADIUS * 0.6;
        const targetX = wanderX + jitterX;
        const targetY = this.hoverTarget.y + jitterY + Math.sin(t * T.HOVER_NOISE_Y_SPEED * 2 * Math.PI) * T.HOVER_NOISE_Y;
        this._applySpringTo(targetX, targetY, T.HOVER_SPRING, T.HOVER_DAMP, dt);

        const minY = T.EDGE_MARGIN, maxY = this.app.renderer.height - T.EDGE_MARGIN;
        this.y = Math.max(minY, Math.min(maxY, this.y));
        this.vy *= T.DRAG;

      } else if (this.state === "landing") {
        this._applySpringTo(this.landTarget.x, this.landTarget.y, T.LAND_SPRING, T.LAND_DAMP, dt);
        if (Math.hypot(this.landTarget.x - this.x, this.landTarget.y - this.y) < 2) {
          this.position.set(this.landTarget.x, this.landTarget.y - T.HOP_ON_LAND);
          this.setState("perched");
        }

      } else if (this.state === "perched") {
        if (this.position.y < this.landTarget.y) {
          this.position.y = Math.min(this.landTarget.y, this.position.y + 40 * dt);
        }
      }
    }
  }

  function initSystem({ canvasId = "pixi-overlay" } = {}) {
    ensureBaseStyles();
    const canvas = ensureCanvas(canvasId);
    const app = createApp({ canvas });

    const branch = new Branch(app);
    const bird = new Bird(app);
    app.stage.addChild(branch, bird);

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
      clearIdleTimers();
      idlePrimaryTimer = setTimeout(() => {
        idleSecondaryTimer = setTimeout(() => {
          bird.chooseRandomUpperHalfSideLanding();
          bird.setState("landing");
          branch.hide();
          branch.side = bird.lastLandingSide;
          branch._placeAtEdge();
        }, T.EXTRA_LAND_DELAY_MS);
      }, T.NO_SCROLL_BEFORE_LAND_MS);
    }

    function onScrollDelta(dy) {
      const now = performance.now();
      if (bird.state === "perched" && now < bird.landDwellUntil) return;

      const dt = Math.max(1, now - lastScrollT);
      lastScrollT = now;

      const rawVy = (dy / (dt / 1000)) * T.SCROLL_TO_VEL;
      const clampedVy = clamp(rawVy, -T.MAX_VEL_Y, T.MAX_VEL_Y);

      if (bird.state === "perched" || bird.state === "landing") {
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

    beginIdleCountdown();

    // Main loop
    let lastT = performance.now();
    app.ticker.add(() => {
      const now = performance.now();
      const dt = (now - lastT) / 1000; lastT = now;

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

    // Public API (optional)
    return {
      app,
      bird,
      branch,
      destroy() {
        clearIdleTimers();
        app.destroy(true, { children: true, texture: true, baseTexture: true });
        canvas.remove();
      }
    };
  }

  // -------------------- Public API --------------------
  window.PixiBirdOverlay = {
    /**
     * Initialize the overlay.
     * @param {Object} opts
     * @param {string} [opts.canvasId="pixi-overlay"] - existing canvas id to use (will create if not found)
     */
    async init(opts = {}) {
      await loadPixiIfNeeded();
      return new Promise((resolve) => {
        onReady(() => resolve(initSystem(opts)));
      });
    }
  };
})();
