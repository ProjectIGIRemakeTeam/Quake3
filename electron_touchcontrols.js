/**
 * controller-js.js
 * A mobile-friendly virtual joystick controller that automatically detects devices
 * and provides touch/click controls with visual feedback and console logging.
 */

// Vector2 class for 2D vector operations
class Vector2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(vector) {
    return new Vector2(this.x + vector.x, this.y + vector.y);
  }

  sub(vector) {
    return new Vector2(this.x - vector.x, this.y - vector.y);
  }

  mul(n) {
    return new Vector2(this.x * n, this.y * n);
  }

  div(n) {
    return new Vector2(this.x / n, this.y / n);
  }

  mag() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  normalize() {
    return this.mag() === 0 ? new Vector2(0, 0) : this.div(this.mag());
  }
}

// Joystick Controller Class
class JoystickController {
  constructor(options = {}) {
    // Default options
    this.options = {
      enabled: true,
      showLogs: true,
      joystickSize: 50,
      handleSize: 25,
      position: "bottom", // 'bottom', 'top', 'left', 'right'
      opacity: 0.7,
      leftColor: "#3498db",
      rightColor: "#e74c3c",
      baseColor: "#707070",
      handleColor: "#3d3d3d",
      ...options,
    };

    // State tracking
    this.isMobile = this.detectMobile();
    this.isEnabled = this.options.enabled;
    this.joysticks = [];
    this.canvas = null;
    this.context = null;
    this.animationId = null;
    this.currentInput = {
      left: { x: 0, y: 0, direction: "center" },
      right: { x: 0, y: 0, direction: "center" },
    };

    // Initialize
    this.initialize();
    this.bindEvents();
  }

  // Detect if device is mobile
  detectMobile() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0
    );
  }

  // Initialize the controller
  initialize() {
    if (!this.isEnabled) return;

    // Create canvas
    this.canvas = document.createElement("canvas");
    this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
            pointer-events: ${this.isEnabled ? "auto" : "none"};
            opacity: ${this.options.opacity};
            touch-action: none;
        `;
    this.context = this.canvas.getContext("2d");
    document.body.appendChild(this.canvas);

    // Set canvas size
    this.resizeCanvas();

    // Create joysticks
    this.createJoysticks();

    // Start animation loop
    this.animate();

    if (this.options.showLogs) {
      console.log(
        `🎮 Joystick Controller Initialized (${
          this.isMobile ? "Mobile" : "Desktop"
        })`
      );
    }
  }

  // Create joysticks based on position
  createJoysticks() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const padding = 80;
    const joystickRadius = this.options.joystickSize;
    const handleRadius = this.options.handleSize;

    let leftPos, rightPos;

    switch (this.options.position) {
      case "top":
        leftPos = new Vector2(padding, padding);
        rightPos = new Vector2(width - padding, padding);
        break;
      case "left":
        leftPos = new Vector2(padding, height / 2);
        rightPos = new Vector2(padding, height - padding);
        break;
      case "right":
        leftPos = new Vector2(width - padding, height / 2);
        rightPos = new Vector2(width - padding, height - padding);
        break;
      default: // bottom
        leftPos = new Vector2(padding, height - padding);
        rightPos = new Vector2(width - padding, height - padding);
    }

    this.joysticks = [
      new VirtualJoystick(
        leftPos.x,
        leftPos.y,
        joystickRadius,
        handleRadius,
        "left"
      ),
      new VirtualJoystick(
        rightPos.x,
        rightPos.y,
        joystickRadius,
        handleRadius,
        "right"
      ),
    ];
  }

  // Resize canvas to match window size
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Recreate joysticks with new positions
    if (this.joysticks.length > 0) {
      this.createJoysticks();
    }
  }

  // Bind event listeners
  bindEvents() {
    // Window resize
    window.addEventListener("resize", () => this.resizeCanvas());

    // Enable/disable toggle (example: double-tap with three fingers)
    if (this.isMobile) {
      let lastTouchTime = 0;
      document.addEventListener("touchstart", (e) => {
        if (e.touches.length === 3) {
          const currentTime = Date.now();
          if (currentTime - lastTouchTime < 300) {
            this.toggle();
          }
          lastTouchTime = currentTime;
        }
      });
    } else {
      // Desktop: Ctrl+Shift+J to toggle
      document.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === "J") {
          this.toggle();
        }
      });
    }
  }

  // Draw circle helper
  circle(pos, radius, color) {
    this.context.beginPath();
    this.context.fillStyle = color;
    this.context.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    this.context.fill();
    this.context.closePath();
  }

  // Clear canvas
  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Animation loop
  animate() {
    this.clear();

    if (this.isEnabled) {
      for (const joystick of this.joysticks) {
        joystick.update();
        joystick.draw(this.context, this.circle.bind(this));

        // Update current input
        const input = joystick.getInput();
        this.currentInput[joystick.side] = input;
      }
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  // Toggle controller on/off
  toggle() {
    this.isEnabled = !this.isEnabled;
    this.canvas.style.pointerEvents = this.isEnabled ? "auto" : "none";
    this.canvas.style.opacity = this.isEnabled ? this.options.opacity : "0";

    if (this.options.showLogs) {
      console.log(
        `🎮 Joystick Controller ${this.isEnabled ? "Enabled" : "Disabled"}`
      );
    }
  }

  // Enable controller
  enable() {
    this.isEnabled = true;
    this.canvas.style.pointerEvents = "auto";
    this.canvas.style.opacity = this.options.opacity;
  }

  // Disable controller
  disable() {
    this.isEnabled = false;
    this.canvas.style.pointerEvents = "none";
    this.canvas.style.opacity = "0";
  }

  // Get current input values
  getInput() {
    return this.currentInput;
  }

  // Clean up
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    if (this.options.showLogs) {
      console.log("🎮 Joystick Controller Destroyed");
    }
  }
}

// Virtual Joystick Class
class VirtualJoystick {
  constructor(x, y, radius, handleRadius, side) {
    this.origin = new Vector2(x, y);
    this.pos = new Vector2(x, y);
    this.radius = radius;
    this.handleRadius = handleRadius;
    this.handleFriction = 0.25;
    this.ondrag = false;
    this.touchPos = new Vector2(0, 0);
    this.side = side; // 'left' or 'right'
    this.lastDirection = "center";

    this.bindEvents();
  }

  bindEvents() {
    const handleEvent = (e, isTouch) => {
      const pos = isTouch
        ? new Vector2(e.touches[0].pageX, e.touches[0].pageY)
        : new Vector2(e.pageX, e.pageY);

      if (this.touchPos.sub(this.origin).mag() <= this.radius) {
        this.ondrag = true;
      }

      this.touchPos = pos;
    };

    // Touch events
    document.addEventListener("touchstart", (e) => handleEvent(e, true));
    document.addEventListener("touchmove", (e) => {
      if (this.ondrag) {
        this.touchPos = new Vector2(e.touches[0].pageX, e.touches[0].pageY);
        e.preventDefault();
      }
    });
    document.addEventListener("touchend", () => {
      this.ondrag = false;
      this.logInput("center");
    });

    // Mouse events
    document.addEventListener("mousedown", (e) => handleEvent(e, false));
    document.addEventListener("mousemove", (e) => {
      if (this.ondrag) {
        this.touchPos = new Vector2(e.pageX, e.pageY);
      }
    });
    document.addEventListener("mouseup", () => {
      this.ondrag = false;
      this.logInput("center");
    });
  }

  reposition() {
    if (!this.ondrag) {
      // Return to center
      this.pos = this.pos.add(
        this.origin.sub(this.pos).mul(this.handleFriction)
      );
    } else {
      // Limit movement within joystick radius
      const diff = this.touchPos.sub(this.origin);
      const maxDist = Math.min(diff.mag(), this.radius);
      this.pos = this.origin.add(diff.normalize().mul(maxDist));

      // Log input direction
      this.logInput();
    }
  }

  logInput(direction = null) {
    if (!window.controller || !window.controller.options.showLogs) return;

    const input = this.getInput();
    const newDirection = input.direction;

    if (direction) {
      newDirection = direction;
    }

    if (newDirection !== this.lastDirection) {
      console.log(
        `🎮 ${this.side.toUpperCase()} Joystick: ${newDirection} (x: ${input.x.toFixed(
          2
        )}, y: ${input.y.toFixed(2)})`
      );
      this.lastDirection = newDirection;
    }
  }

  draw(context, circleFunc) {
    // Draw base
    circleFunc(this.origin, this.radius, "#707070");

    // Draw handle
    const handleColor = this.side === "left" ? "#3498db" : "#e74c3c";
    circleFunc(this.pos, this.handleRadius, handleColor);

    // Draw direction indicators
    if (this.ondrag) {
      context.save();
      context.globalAlpha = 0.5;
      context.strokeStyle = handleColor;
      context.lineWidth = 2;

      // Draw line from origin to handle
      context.beginPath();
      context.moveTo(this.origin.x, this.origin.y);
      context.lineTo(this.pos.x, this.pos.y);
      context.stroke();

      context.restore();
    }
  }

  update() {
    this.reposition();
  }

  getInput() {
    const diff = this.pos.sub(this.origin);
    const normalized = diff.div(this.radius);

    // Determine direction
    let direction = "center";
    if (diff.mag() > this.radius * 0.3) {
      const angle = Math.atan2(normalized.y, normalized.x) * (180 / Math.PI);

      if (angle >= -45 && angle < 45) direction = "right";
      else if (angle >= 45 && angle < 135) direction = "down";
      else if (angle >= 135 || angle < -135) direction = "left";
      else if (angle >= -135 && angle < -45) direction = "up";
    }

    return {
      x: normalized.x,
      y: normalized.y,
      direction: direction,
      raw: diff,
    };
  }
}

// Auto-initialize when script loads
(function () {
  // Create global controller instance
  window.controller = new JoystickController();

  // Public API
  window.JoystickController = JoystickController;
  window.Vector2 = Vector2;

  // Add CSS for better mobile experience
  const style = document.createElement("style");
  style.textContent = `
        @media (max-width: 768px) {
            canvas[data-joystick] {
                opacity: 0.9 !important;
            }
        }
        
        .joystick-debug {
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            z-index: 10000;
            pointer-events: none;
        }
    `;
  document.head.appendChild(style);

  console.log("🎮 controller-js.js loaded successfully!");
  console.log("📱 Mobile detected:", window.controller.isMobile);
  console.log("🎯 Use window.controller.getInput() to get joystick values");
  console.log("⚙️  Use window.controller.toggle() to enable/disable");
  console.log("🖥️  Desktop: Press Ctrl+Shift+J to toggle");
  console.log("📱 Mobile: Double-tap with three fingers to toggle");
})();
