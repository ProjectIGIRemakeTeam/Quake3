// virtualgamepad.js - Complete Touch-to-Keyboard Mapper with Mobile Keyboard Support
// Features: Visual joystick circles, mobile keyboard compatibility, full calibration, detailed logging

(function () {
  ("use strict");

  // Default configuration
  const DEFAULT_CONFIG = {
    zIndex: 99999999,
    buttonSize: 60,
    joystickSize: "150px",
    buttonOpacity: 0.7,
    enableButtonText: "🎮",
    enableButtonPosition: "bottom-right",
    controlsPosition: "split",
    includeShoulderButtons: true,
    showButtonLabels: true,
    mouseLookSensitivity: 2.5,
    autoEnableOnTouch: true,
    clickableThumbsticks: true,
    doubleTapThreshold: 300,
    vibration: false,
    showCalibrationButton: true,
    defaultProfile: "quake3",
    saveToLocalStorage: true,
    buttonClusterPosition: "top-right",
    joystickDeadZone: 0.3,
    showJoystickOutline: true,
    joystickOutlineColor: "rgba(255, 255, 255, 0.5)",
    joystickNubColor: "rgba(255, 255, 255, 0.9)",
    enableMobileKeyboardSupport: true,
    debugMode: true, // NEW: Enable detailed console logging
  };

  // Default game profiles
  const GAME_PROFILES = {
    quake3: {
      name: "Quake III Arena",
      mappings: {
        // Movement
        JOYSTICK_LEFT_UP: "w",
        JOYSTICK_LEFT_DOWN: "s",
        JOYSTICK_LEFT_LEFT: "a",
        JOYSTICK_LEFT_RIGHT: "d",

        // Mouse Look (Right Joystick)
        JOYSTICK_RIGHT_UP: "MOUSE_UP",
        JOYSTICK_RIGHT_DOWN: "MOUSE_DOWN",
        JOYSTICK_RIGHT_LEFT: "MOUSE_LEFT",
        JOYSTICK_RIGHT_RIGHT: "MOUSE_RIGHT",

        // Buttons
        BUTTON_A: " ", // Jump
        BUTTON_B: "ctrl", // Crouch
        BUTTON_X: "r", // Reload
        BUTTON_Y: "e", // Use
        BUTTON_LB: "q", // Previous weapon
        BUTTON_RB: "e", // Next weapon
        BUTTON_LT: "MOUSE_RIGHT", // Alt-fire
        BUTTON_RT: "MOUSE_LEFT", // Fire
        BUTTON_L3: "shift", // Run (L3 click)
        BUTTON_R3: "f", // Flashlight (R3 click)
        BUTTON_START: "esc", // Menu
        BUTTON_SELECT: "tab", // Score
        BUTTON_DPAD_UP: "1", // Weapon 1
        BUTTON_DPAD_DOWN: "2", // Weapon 2
        BUTTON_DPAD_LEFT: "3", // Weapon 3
        BUTTON_DPAD_RIGHT: "4", // Weapon 4

        // Extra buttons
        BUTTON_EXTRA1: "5", // Weapon 5
        BUTTON_EXTRA2: "6", // Weapon 6
        BUTTON_EXTRA3: "7", // Weapon 7
        BUTTON_EXTRA4: "8", // Weapon 8
      },
    },
    fps: {
      name: "Generic FPS",
      mappings: {
        JOYSTICK_LEFT_UP: "w",
        JOYSTICK_LEFT_DOWN: "s",
        JOYSTICK_LEFT_LEFT: "a",
        JOYSTICK_LEFT_RIGHT: "d",
        BUTTON_A: " ",
        BUTTON_B: "ctrl",
        BUTTON_X: "r",
        BUTTON_Y: "e",
        BUTTON_RT: "MOUSE_LEFT",
        BUTTON_LT: "MOUSE_RIGHT",
      },
    },
    platformer: {
      name: "Platformer",
      mappings: {
        JOYSTICK_LEFT_LEFT: "ArrowLeft",
        JOYSTICK_LEFT_RIGHT: "ArrowRight",
        BUTTON_A: " ",
        BUTTON_B: "Shift",
      },
    },
    custom: {
      name: "Custom Mapping",
      mappings: {},
    },
  };

  // State management
  let config = { ...DEFAULT_CONFIG };
  let currentProfile = GAME_PROFILES[config.defaultProfile];
  let isEnabled = false;
  let isCalibrating = false;
  let calibratingButton = null;
  let mouseLookActive = false;
  let lastTouchPosition = { x: 0, y: 0 };
  let currentMouseDelta = { x: 0, y: 0 };
  let pressedKeys = new Set();
  let mouseButtons = new Set();
  let touchPoints = new Map();
  let doubleTapTimers = new Map();

  // DOM elements
  let enableButton = null;
  let overlay = null;
  let calibrationDialog = null;
  let mobileTextInput = null; // NEW: Mobile keyboard support

  // ================ LOGGING FUNCTIONS ================

  function logDebug(message, data = null) {
    if (!config.debugMode) return;

    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    const prefix = `🎮 [${timestamp}]`;

    // Console logging
    if (data) {
      console.log(`${prefix} ${message}:`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }

    // Create or get debug overlay
    let debugOverlay = document.getElementById("virtualgamepad-debug-overlay");
    if (!debugOverlay) {
      debugOverlay = document.createElement("div");
      debugOverlay.id = "virtualgamepad-debug-overlay";
      debugOverlay.style.cssText = `
            position: fixed;
            top: calc(50%);
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            color: #00ff00;
            padding: 8px 0;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            font-size: 8px;
            z-index: 99999999;
            pointer-events: none;
            white-space: nowrap;
            border: 1px solid #00aa00;
            box-shadow: 0 2px 10px rgba(0,0,0,0.5);
            width: 80%;
            max-height: 200px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            align-items: center;
         `;
      document.body.appendChild(debugOverlay);
    }

    // Create log entry
    const logEntry = document.createElement("div");
    logEntry.className = "debug-log-entry";
    logEntry.style.cssText = `
        padding: 4px 12px;
        margin: 2px 0;
        background: rgba(0, 20, 0, 0.5);
        border-radius: 3px;
        width: 100%;
        box-sizing: border-box;
        animation: fadeIn 0.2s ease;
        border-left: 2px solid #00aa00;
    `;

    // Format the message
    let displayText = `[${timestamp}] ${message}`;
    if (data) {
      try {
        if (typeof data === "object") {
          // Try to create a compact string representation
          const dataStr = JSON.stringify(data, null, 0)
            .replace(/[{}"]/g, "")
            .replace(/:/g, "=")
            .replace(/,/g, " ");
          displayText += `: ${dataStr}`;
        } else {
          displayText += `: ${data}`;
        }
      } catch (e) {
        displayText += `: ${String(data)}`;
      }
    }

    // Truncate if too long
    if (displayText.length > 80) {
      displayText = displayText.substring(0, 77) + "...";
    }

    logEntry.textContent = displayText;

    // Add to overlay (newest on top)
    debugOverlay.insertBefore(logEntry, debugOverlay.firstChild);

    // Limit number of visible logs
    const maxLogs = 5;
    const allLogs = debugOverlay.querySelectorAll(".debug-log-entry");
    if (allLogs.length > maxLogs) {
      for (let i = maxLogs; i < allLogs.length; i++) {
        allLogs[i].remove();
      }
    }

    // Remove this log entry after 1 second
    setTimeout(() => {
      if (logEntry.parentNode === debugOverlay) {
        // Fade out animation
        logEntry.style.opacity = "0";
        logEntry.style.transition = "opacity 0.3s ease";
        setTimeout(() => {
          if (logEntry.parentNode === debugOverlay) {
            logEntry.remove();

            // Remove overlay if empty
            if (debugOverlay.children.length === 0) {
              debugOverlay.remove();
            }
          }
        }, 300);
      }
    }, 1000);

    // Add CSS for animations if not already present
    if (!document.getElementById("debug-overlay-styles")) {
      const style = document.createElement("style");
      style.id = "debug-overlay-styles";
      style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-5px); }
                to { opacity: 1; transform: translateY(0); }
            }
            #virtualgamepad-debug-overlay::-webkit-scrollbar {
                width: 4px;
            }
            #virtualgamepad-debug-overlay::-webkit-scrollbar-track {
                background: rgba(0, 20, 0, 0.3);
            }
            #virtualgamepad-debug-overlay::-webkit-scrollbar-thumb {
                background: #00aa00;
                border-radius: 2px;
            }
        `;
      document.head.appendChild(style);
    }
  }

  function logButtonEvent(buttonId, action, keyMapping) {
    logDebug(`Button ${action.toUpperCase()}`, {
      button: buttonId,
      mapping: keyMapping,
      profile: config.defaultProfile,
      timestamp: Date.now(),
    });
  }

  function logJoystickEvent(side, type, x, y, actions) {
    logDebug(`Joystick ${side.toUpperCase()} ${type.toUpperCase()}`, {
      side: side,
      type: type,
      position: { x: x.toFixed(3), y: y.toFixed(3) },
      magnitude: Math.sqrt(x * x + y * y).toFixed(3),
      actions: actions,
      timestamp: Date.now(),
    });
  }

  function logKeyboardEvent(key, type, source = "virtualgamepad") {
    logDebug(`Keyboard ${type.toUpperCase()}`, {
      key: key,
      type: type,
      source: source,
      timestamp: Date.now(),
      pressedKeys: Array.from(pressedKeys),
    });
  }

  function logMouseEvent(button, type, delta = null) {
    logDebug(`Mouse ${type.toUpperCase()}`, {
      button: button,
      type: type,
      delta: delta,
      timestamp: Date.now(),
      activeButtons: Array.from(mouseButtons),
    });
  }

  // ================ KEYBOARD/MOUSE EMULATION ================

  function sendKeyEvent(key, type) {
    let keyCode, keyChar;

    // Special keys mapping
    const specialKeys = {
      " ": "Space",
      ctrl: "Control",
      shift: "Shift",
      alt: "Alt",
      tab: "Tab",
      esc: "Escape",
      enter: "Enter",
      backspace: "Backspace",
    };

    // Mouse events
    if (key.startsWith("MOUSE_")) {
      const button = key.replace("MOUSE_", "").toLowerCase();

      if (["up", "down", "left", "right"].includes(button)) {
        // Mouse movement
        if (type === "down") {
          currentMouseDelta[button] = 1;
          logMouseEvent(button, "move_down");
        } else {
          currentMouseDelta[button] = 0;
          logMouseEvent(button, "move_up");
        }
      } else {
        // Mouse button
        const buttonCode = {
          left: 0,
          middle: 1,
          right: 2,
        }[button];

        if (buttonCode !== undefined) {
          if (type === "down") {
            mouseButtons.add(buttonCode);
            logMouseEvent(button, "button_down");
          } else {
            mouseButtons.delete(buttonCode);
            logMouseEvent(button, "button_up");
          }
        }
      }
      return;
    }

    // Determine key code
    if (specialKeys[key]) {
      keyCode = specialKeys[key];
      keyChar = key;
    } else if (key.length === 1) {
      keyCode = key.toUpperCase();
      keyChar = key;
    } else if (key.startsWith("Arrow")) {
      keyCode = key;
      keyChar = key;
    } else if (key.match(/^[F1-F12]$/i)) {
      keyCode = key.toUpperCase();
      keyChar = key;
    } else {
      keyCode = key;
      keyChar = key;
    }

    // Create and dispatch event
    const eventType = type === "down" ? "keydown" : "keyup";
    const event = new KeyboardEvent(eventType, {
      key: keyChar,
      code: keyCode,
      keyCode: keyChar.charCodeAt ? keyChar.charCodeAt(0) : 0,
      which: keyChar.charCodeAt ? keyChar.charCodeAt(0) : 0,
      bubbles: true,
      cancelable: true,
    });

    if (type === "down") {
      pressedKeys.add(key);
      logKeyboardEvent(key, "down");
    } else {
      pressedKeys.delete(key);
      logKeyboardEvent(key, "up");
    }

    document.dispatchEvent(event);
  }

  function simulateMouseMove(deltaX, deltaY) {
    // Create mouse move event
    const event = new MouseEvent("mousemove", {
      movementX: deltaX,
      movementY: deltaY,
      bubbles: true,
      cancelable: true,
    });

    logMouseEvent("look", "move", {
      x: deltaX.toFixed(2),
      y: deltaY.toFixed(2),
    });
    document.dispatchEvent(event);
  }

  // ================ MOBILE KEYBOARD SUPPORT ================

  function createMobileTextInput() {
    if (mobileTextInput) return;

    mobileTextInput = document.createElement("textarea");
    mobileTextInput.id = "virtualgamepad-textinput";
    mobileTextInput.setAttribute("autocapitalize", "off");
    mobileTextInput.setAttribute("autocorrect", "off");
    mobileTextInput.setAttribute("autocomplete", "off");
    mobileTextInput.setAttribute("spellcheck", "false");
    mobileTextInput.rows = 1;

    mobileTextInput.style.cssText = `
            position: absolute;
            left: -10000px;
            top: -10000px;
            width: 1px;
            height: 1px;
            opacity: 0.01;
            pointer-events: none;
            z-index: -9999;
        `;

    document.body.appendChild(mobileTextInput);

    // Set up event listeners for mobile keyboard input
    mobileTextInput.addEventListener("input", handleMobileInput);
    mobileTextInput.addEventListener("keydown", handleMobileKeyDown);
    mobileTextInput.addEventListener("keyup", handleMobileKeyUp);

    logDebug("Mobile keyboard input element created");
  }

  function handleMobileInput(ev) {
    if (!config.enableMobileKeyboardSupport) return;

    const char = ev.data;
    if (char) {
      const char_keycode = char.codePointAt(0);
      const upper_key = char.toUpperCase();
      const upper_keycode = upper_key.codePointAt(0);

      const down_up_options = {
        code: "Key" + upper_key,
        key: char,
        keyCode: upper_keycode,
        which: upper_keycode,
      };

      logDebug("Mobile keyboard input detected", {
        character: char,
        charCode: char_keycode,
        keyCode: upper_keycode,
      });

      // Dispatch fake keyboard events
      window.dispatchEvent(new KeyboardEvent("keydown", down_up_options));
      window.dispatchEvent(
        new KeyboardEvent("keypress", {
          charCode: char_keycode,
          code: "Key" + upper_key,
          key: char,
          keyCode: char_keycode,
          which: char_keycode,
        })
      );
      window.dispatchEvent(new KeyboardEvent("keyup", down_up_options));
    }

    // Reset the textarea
    mobileTextInput.value = "";
    mobileTextInput.blur();
    mobileTextInput.focus();

    ev.preventDefault();
    ev.stopPropagation();
  }

  function handleMobileKeyDown(ev) {
    if (!config.enableMobileKeyboardSupport) return;

    logDebug("Mobile keyboard keydown", {
      which: ev.which,
      keyCode: ev.keyCode,
      key: ev.key,
    });

    if (ev.which === 8) {
      // Backspace
      const options = {
        code: "Backspace",
        key: "Backspace",
        keyCode: 8,
        which: 8,
      };
      window.dispatchEvent(new KeyboardEvent("keydown", options));
      window.dispatchEvent(new KeyboardEvent("keyup", options));
      ev.preventDefault();
      ev.stopPropagation();
    } else if (ev.which === 13) {
      // Enter
      const options = {
        charCode: 13,
        code: "Enter",
        key: "Enter",
        keyCode: 13,
        which: 13,
      };
      window.dispatchEvent(new KeyboardEvent("keydown", options));
      window.dispatchEvent(new KeyboardEvent("keypress", options));
      window.dispatchEvent(new KeyboardEvent("keyup", options));
      ev.preventDefault();
      ev.stopPropagation();
    } else if (ev.which === 229) {
      // Mobile virtual keyboard sends 229 for most keys
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

  function handleMobileKeyUp(ev) {
    if (!config.enableMobileKeyboardSupport) return;

    if (ev.which === 8 || ev.which === 13 || ev.which === 229) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

  function focusMobileTextInput() {
    if (mobileTextInput && config.enableMobileKeyboardSupport) {
      mobileTextInput.focus();
      logDebug("Mobile keyboard input focused");
    }
  }

  // ================ CALIBRATION SYSTEM ================

  function showCalibrationDialog() {
    if (calibrationDialog) {
      calibrationDialog.remove();
    }

    calibrationDialog = document.createElement("div");
    calibrationDialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #00ff00;
            border-radius: 10px;
            padding: 20px;
            z-index: ${config.zIndex + 1000};
            color: white;
            font-family: Arial, sans-serif;
            max-width: 90%;
            min-width: 80%;
            max-height: 90%;
            overflow-y: auto;
        `;

    calibrationDialog.innerHTML = `
            <h2 style="margin-top: 0; color: #00ff00">🎮 Touch Controller Calibration</h2>
            <p style="color: #aaa">Click any button below, then press the key you want to assign.</p>
            
            <div style="margin: 20px 0">
                <label style="display: block; margin-bottom: 5px">Profile:</label>
                <select id="profile-selector" style="
                    width: 100%;
                    padding: 10px;
                    background: #333;
                    color: white;
                    border: 1px solid #555;
                    border-radius: 5px;
                    margin-bottom: 20px;
                ">
                    ${Object.entries(GAME_PROFILES)
                      .map(
                        ([id, profile]) =>
                          `<option value="${id}" ${
                            id === config.defaultProfile ? "selected" : ""
                          }>
                            ${profile.name}
                        </option>`
                      )
                      .join("")}
                </select>
            </div>
            
            <div id="calibration-buttons" style="
                display: grid;
                grid-template-columns: repeat(4, minmax(200px, 1fr));
                gap: 10px;
                margin-bottom: 20px;
                overflow-y: auto;
                max-height: 60vh;
            ">
                <!-- Buttons will be generated here -->
            </div>
            
            <div style="
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                border-top: 1px solid #444;
                padding-top: 20px;
            ">
                <button id="save-calibration" style="
                    padding: 10px 20px;
                    background: #00aa00;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                ">Save & Apply</button>
                <button id="reset-calibration" style="
                    padding: 10px 20px;
                    background: #aa0000;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                ">Reset to Default</button>
                <button id="close-calibration" style="
                    padding: 10px 20px;
                    background: #555;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                ">Close</button>
            </div>
        `;

    document.body.appendChild(calibrationDialog);

    // Populate calibration buttons
    const buttonsContainer = calibrationDialog.querySelector(
      "#calibration-buttons"
    );
    const buttonTypes = [
      // Joystick directions
      "JOYSTICK_LEFT_UP",
      "JOYSTICK_LEFT_DOWN",
      "JOYSTICK_LEFT_LEFT",
      "JOYSTICK_LEFT_RIGHT",
      "JOYSTICK_RIGHT_UP",
      "JOYSTICK_RIGHT_DOWN",
      "JOYSTICK_RIGHT_LEFT",
      "JOYSTICK_RIGHT_RIGHT",

      // Face buttons
      "BUTTON_A",
      "BUTTON_B",
      "BUTTON_X",
      "BUTTON_Y",

      // Shoulder buttons
      "BUTTON_LB",
      "BUTTON_LT",
      "BUTTON_RB",
      "BUTTON_RT",

      // Thumbstick clicks
      "BUTTON_L3",
      "BUTTON_R3",

      // System buttons
      "BUTTON_START",
      "BUTTON_SELECT",

      // D-pad
      "BUTTON_DPAD_UP",
      "BUTTON_DPAD_DOWN",
      "BUTTON_DPAD_LEFT",
      "BUTTON_DPAD_RIGHT",
    ];

    buttonTypes.forEach((buttonType) => {
      const buttonDiv = document.createElement("div");
      buttonDiv.style.cssText = `
                background: #222;
                padding: 10px;
                border-radius: 5px;
                border: 1px solid #444;
                cursor: pointer;
                transition: all 0.2s;
            `;

      const displayName = buttonType
        .replace(/_/g, " ")
        .replace(
          /JOYSTICK (\w+) (\w+)/,
          (match, side, dir) =>
            `${side === "LEFT" ? "Left Stick" : "Right Stick"} ${dir}`
        )
        .replace(/BUTTON (\w+)/, (match, btn) => {
          const names = {
            A: "A Button",
            B: "B Button",
            X: "X Button",
            Y: "Y Button",
            LB: "LB",
            LT: "LT",
            RB: "RB",
            RT: "RT",
            L3: "L3",
            R3: "R3",
            START: "Start",
            SELECT: "Select",
            DPAD_UP: "D-Pad Up",
            DPAD_DOWN: "D-Pad Down",
            DPAD_LEFT: "D-Pad Left",
            DPAD_RIGHT: "D-Pad Right",
          };
          return names[btn] || btn;
        });

      const currentKey = currentProfile.mappings[buttonType] || "Not Set";

      buttonDiv.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 5px">${displayName}</div>
                <div style="font-size: 12px; color: #888">ID: ${buttonType}</div>
                <div style="
                    margin-top: 5px;
                    padding: 5px;
                    background: #333;
                    border-radius: 3px;
                    font-family: monospace;
                    text-align: center;
                " id="key-display-${buttonType}">
                    ${currentKey}
                </div>
            `;

      buttonDiv.addEventListener("click", () =>
        startCalibratingButton(buttonType, buttonDiv)
      );
      buttonsContainer.appendChild(buttonDiv);
    });

    // Event listeners for dialog
    calibrationDialog
      .querySelector("#profile-selector")
      .addEventListener("change", (e) => {
        const profileId = e.target.value;
        switchProfile(profileId);
        updateCalibrationButtons();
      });

    calibrationDialog
      .querySelector("#save-calibration")
      .addEventListener("click", saveCalibration);
    calibrationDialog
      .querySelector("#reset-calibration")
      .addEventListener("click", resetCalibration);
    calibrationDialog
      .querySelector("#close-calibration")
      .addEventListener("click", () => {
        calibrationDialog.remove();
        calibrationDialog = null;
        isCalibrating = false;
      });

    isCalibrating = true;
    logDebug("Calibration dialog opened");
  }

  function startCalibratingButton(buttonType, buttonElement) {
    if (calibratingButton) {
      calibratingButton.style.background = "#222";
    }

    calibratingButton = buttonElement;
    calibratingButton.style.background = "#444";

    const keyDisplay = calibratingButton.querySelector(
      `#key-display-${buttonType}`
    );
    keyDisplay.textContent = "Press a key...";
    keyDisplay.style.color = "#ff9900";

    logDebug("Starting calibration for button", {
      button: buttonType,
      currentMapping: currentProfile.mappings[buttonType],
    });

    // Listen for next key press
    const keyListener = (e) => {
      e.preventDefault();
      e.stopPropagation();

      let keyValue;

      if (e.type === "keydown") {
        // Keyboard key
        if (e.key === "Escape") {
          keyValue = "esc";
        } else if (e.key === " ") {
          keyValue = " ";
        } else if (e.key === "Control") {
          keyValue = "ctrl";
        } else if (e.key === "Shift") {
          keyValue = "shift";
        } else if (e.key === "Alt") {
          keyValue = "alt";
        } else if (e.key === "Tab") {
          keyValue = "tab";
        } else if (e.key === "Enter") {
          keyValue = "enter";
        } else if (e.key === "Backspace") {
          keyValue = "backspace";
        } else if (e.key.startsWith("Arrow")) {
          keyValue = e.key;
        } else if (e.key.match(/^[F1-F12]$/i)) {
          keyValue = e.key.toLowerCase();
        } else if (e.key.length === 1) {
          keyValue = e.key.toLowerCase();
        } else {
          keyValue = e.key;
        }
      } else if (e.type === "mousedown") {
        // Mouse button
        if (e.button === 0) keyValue = "MOUSE_LEFT";
        else if (e.button === 1) keyValue = "MOUSE_MIDDLE";
        else if (e.button === 2) keyValue = "MOUSE_RIGHT";
        else return;
      } else {
        return;
      }

      // Save the mapping
      currentProfile.mappings[buttonType] = keyValue;

      // Update display
      keyDisplay.textContent = keyValue;
      keyDisplay.style.color = "#00ff00";
      calibratingButton.style.background = "#222";

      logDebug("Button calibrated", {
        button: buttonType,
        newMapping: keyValue,
        oldMapping: currentProfile.mappings[buttonType],
      });

      // Remove listeners
      document.removeEventListener("keydown", keyListener);
      document.removeEventListener("mousedown", keyListener);
      calibratingButton = null;
    };

    // Add temporary listeners
    document.addEventListener("keydown", keyListener, { once: true });
    document.addEventListener("mousedown", keyListener, { once: true });

    // Cancel after 5 seconds
    setTimeout(() => {
      if (calibratingButton === buttonElement) {
        document.removeEventListener("keydown", keyListener);
        document.removeEventListener("mousedown", keyListener);
        keyDisplay.textContent =
          currentProfile.mappings[buttonType] || "Not Set";
        keyDisplay.style.color = "#aaa";
        calibratingButton.style.background = "#222";
        calibratingButton = null;
        logDebug("Calibration cancelled (timeout)", { button: buttonType });
      }
    }, 5000);
  }

  function updateCalibrationButtons() {
    if (!calibrationDialog) return;

    Object.entries(currentProfile.mappings).forEach(
      ([buttonType, keyValue]) => {
        const keyDisplay = calibrationDialog.querySelector(
          `#key-display-${buttonType}`
        );
        if (keyDisplay) {
          keyDisplay.textContent = keyValue || "Not Set";
          keyDisplay.style.color = keyValue ? "#00ff00" : "#aaa";
        }
      }
    );
  }

  function switchProfile(profileId) {
    if (GAME_PROFILES[profileId]) {
      currentProfile = JSON.parse(JSON.stringify(GAME_PROFILES[profileId]));
      config.defaultProfile = profileId;

      if (config.saveToLocalStorage) {
        const saved = localStorage.getItem(`virtualgamepad_${profileId}`);
        if (saved) {
          const customMappings = JSON.parse(saved);
          currentProfile.mappings = {
            ...currentProfile.mappings,
            ...customMappings,
          };
        }
      }

      logDebug("Profile switched", {
        profile: profileId,
        name: currentProfile.name,
        mappings: currentProfile.mappings,
      });
    }
  }

  function saveCalibration() {
    if (config.saveToLocalStorage) {
      localStorage.setItem(
        `virtualgamepad_${config.defaultProfile}`,
        JSON.stringify(currentProfile.mappings)
      );

      // Show saved notification
      const notification = document.createElement("div");
      notification.textContent = "✅ Mappings saved!";
      notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #00aa00;
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                z-index: ${config.zIndex + 1000};
                animation: fadeOut 2s forwards;
            `;

      const style = document.createElement("style");
      style.textContent = `
                @keyframes fadeOut {
                    0% { opacity: 1; }
                    70% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `;
      document.head.appendChild(style);

      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    }

    logDebug("Calibration saved", {
      profile: config.defaultProfile,
      mappings: currentProfile.mappings,
    });
  }

  function resetCalibration() {
    if (confirm("Reset all mappings to default?")) {
      switchProfile(config.defaultProfile);
      updateCalibrationButtons();

      if (config.saveToLocalStorage) {
        localStorage.removeItem(`virtualgamepad_${config.defaultProfile}`);
      }

      logDebug("Calibration reset to defaults");
    }
  }

  // ================ TOP BUTTONS WRAPPER ================

  function createTopButtonsWrapper() {
    const wrapper = document.createElement("div");
    wrapper.id = "virtualgamepad-top-buttons";

    wrapper.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 15px;
        align-items: center;
        justify-content: center;
        z-index: ${config.zIndex};
        pointer-events: auto;
        background: transparent;
        padding: 0;
    `;

    document.body.appendChild(wrapper);
    logDebug("Top buttons wrapper created");
    return wrapper;
  }

  // ================ QR CODE DIALOG ================

  function showQrDialog() {
    // Create dialog container
    const dialog = document.createElement("div");
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.95);
        border: 2px solid #00ff00;
        border-radius: 15px;
        padding: 25px;
        z-index: ${config.zIndex + 1000};
        color: white;
        font-family: Arial, sans-serif;
        max-width: 90%;
        min-width: 300px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `;

    // Generate current page URL for QR code
    const currentUrl = window.location.href;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      currentUrl
    )}`;

    dialog.innerHTML = `
        <h2 style="margin-top: 0; color: #00ff00; margin-bottom: 20px;">
            <i class="fas fa-qrcode" style="margin-right: 10px;"></i>Share This Page
        </h2>
        
        <div style="margin: 20px 0; display: flex; justify-content: center;">
            <img src="${qrCodeUrl}" 
                 alt="QR Code for ${currentUrl}"
                 style="width: 200px; height: 200px; border: 2px solid #555; border-radius: 10px;"
                 onerror="this.onerror=null; this.src='https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ErrorGeneratingQR'">
        </div>
        
        <div style="margin: 15px 0; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px; word-break: break-all;">
            <strong>URL:</strong><br>
            <span style="font-size: 12px; color: #aaa;">${currentUrl}</span>
        </div>
        
        <p style="color: #aaa; font-size: 14px; margin-bottom: 20px;">
            Scan this QR code with your mobile device to open this page
        </p>
        
        <div style="display: flex; gap: 10px; justify-content: center;">
            <button id="copy-url-btn" style="
                padding: 10px 20px;
                background: #0066cc;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.3s;
            ">
                <i class="fas fa-copy" style="margin-right: 5px;"></i>Copy URL
            </button>
            
            <button id="close-qr-dialog" style="
                padding: 10px 20px;
                background: #555;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.3s;
            ">
                <i class="fas fa-times" style="margin-right: 5px;"></i>Close
            </button>
        </div>
    `;

    document.body.appendChild(dialog);

    // Add event listeners
    dialog.querySelector("#copy-url-btn").addEventListener("click", () => {
      navigator.clipboard
        .writeText(currentUrl)
        .then(() => {
          const btn = dialog.querySelector("#copy-url-btn");
          const originalHtml = btn.innerHTML;
          btn.innerHTML =
            '<i class="fas fa-check" style="margin-right: 5px;"></i>Copied!';
          btn.style.background = "#00aa00";

          setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.style.background = "#0066cc";
          }, 2000);
        })
        .catch((err) => {
          console.error("Failed to copy URL:", err);
          alert("Failed to copy URL to clipboard");
        });
    });

    dialog.querySelector("#close-qr-dialog").addEventListener("click", () => {
      dialog.remove();
      logDebug("QR dialog closed");
    });

    // Close on background click
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) {
        dialog.remove();
      }
    });

    logDebug("QR dialog opened", { url: currentUrl });
  }

  // ================ CREATE QR BUTTON ================

  function createQrButton(wrapper) {
    const qrButton = document.createElement("button");

    // Create SVG icon
    const svgIcon = document.createElement("div");
    svgIcon.innerHTML = `
        <svg width="24px" height="24px" viewBox="0 0 24 24" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
            <path d="M11,4V9a2,2,0,0,1-2,2H4A2,2,0,0,1,2,9V4A2,2,0,0,1,4,2H9A2,2,0,0,1,11,4Zm9-2H15a2,2,0,0,0-2,2V9a2,2,0,0,0,2,2h5a2,2,0,0,0,2-2V4A2,2,0,0,0,20,2ZM9,13H4a2,2,0,0,0-2,2v5a2,2,0,0,0,2,2H9a2,2,0,0,0,2-2V15A2,2,0,0,0,9,13Zm5,5h3a1,1,0,0,0,1-1V14a1,1,0,0,0-1-1H14a1,1,0,0,0-1,1v3A1,1,0,0,0,14,18Zm7-5a1,1,0,0,0-1,1v5a1,1,0,0,1-1,1H14a1,1,0,0,0,0,2h5a3,3,0,0,0,3-3V14A1,1,0,0,0,21,13Z"/>
        </svg>
    `;

    qrButton.appendChild(svgIcon);
    qrButton.title = "Share QR Code";
    qrButton.style.cssText = `
        width: ${config.buttonSize}px;
        height: ${config.buttonSize}px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border: 2px solid #ff66cc;
        border-radius: 2px;
        font-size: 20px;
        cursor: pointer;
        opacity: 0.9;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    `;

    // Style the SVG to be white and centered
    const svg = qrButton.querySelector("svg");
    svg.style.cssText = `
        width: 24px;
        height: 24px;
        fill: currentColor;
        display: block;
    `;

    qrButton.addEventListener("click", showQrDialog);
    qrButton.addEventListener("touchstart", (e) => {
      e.preventDefault();
      showQrDialog();
    });

    wrapper.appendChild(qrButton);
    logDebug("QR button created with custom SVG");
    return qrButton;
  }

  // ================ UPDATED ENABLE BUTTON ================

  function createEnableButton(wrapper) {
    if (enableButton) return;

    enableButton = document.createElement("button");
    enableButton.innerHTML = config.enableButtonText;
    enableButton.title = "Toggle Virtual Gamepad";
    enableButton.style.cssText = `
        width: ${config.buttonSize}px;
        height: ${config.buttonSize}px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border: 2px solid #00aaff;
        border-radius: 5px;
        font-size: 24px;
        cursor: pointer;
        opacity: 0.9;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    enableButton.addEventListener("click", toggleVirtualGamepad);
    enableButton.addEventListener("touchstart", (e) => {
      e.preventDefault();
      toggleVirtualGamepad();
    });

    wrapper.appendChild(enableButton);
    logDebug("Enable button created (in wrapper)");
    return enableButton;
  }

  // ================ UPDATED CALIBRATION BUTTON ================

  function createCalibrationButton(wrapper) {
    const calButton = document.createElement("button");
    calButton.innerHTML = "⚙️";
    calButton.title = "Calibrate Controls";
    calButton.style.cssText = `
        width: ${config.buttonSize}px;
        height: ${config.buttonSize}px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border: 2px solid #ffaa00;
        border-radius: 5px;
        font-size: 20px;
        cursor: pointer;
        opacity: 0.9;
        transition: all 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
     `;

    calButton.addEventListener("click", showCalibrationDialog);
    calButton.addEventListener("touchstart", (e) => {
      e.preventDefault();
      showCalibrationDialog();
    });

    wrapper.appendChild(calButton);
    logDebug("Calibration button created (in wrapper)");
    return calButton;
  }

  // ================ SHOULDER BUTTONS (L1/L2, R1/R2) ================

  function createLeftShoulderButtons() {
    const container = document.createElement("div");
    container.className = "shoulder-buttons-left";

    container.style.cssText = `
        position: absolute;
        left: 20px;
        top: 50%;
        width: 60px;
        height: 120px;
        pointer-events: auto;
        z-index: ${config.zIndex - 1};
        touch-action: none;
        display: flex;
        flex-direction: column;
        gap: 10px;
        align-items: center;
    `;

    const buttons = [
      {
        id: "L1",
        label: "L1",
        key: "BUTTON_LB",
        color: "#ff6b6b",
        size: "55px",
      },
      {
        id: "L2",
        label: "L2",
        key: "BUTTON_LT",
        color: "#ff8e53",
        size: "55px",
      },
    ];

    // State tracking for buttons
    const buttonStates = {
      BUTTON_LB: { pressed: false, element: null },
      BUTTON_LT: { pressed: false, element: null },
    };

    buttons.forEach((btn) => {
      const button = document.createElement("div");
      button.className = "shoulder-button";
      button.dataset.key = btn.key;
      button.dataset.id = btn.id;

      button.style.cssText = `
            width: ${btn.size};
            height: ${btn.size};
            background: rgba(0, 0, 0, ${config.buttonOpacity});
            border: 3px solid ${btn.color};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            touch-action: none;
            user-select: none;
            -webkit-user-select: none;
            transition: all 0.1s;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            position: relative;
            z-index: 99999;
        `;

      button.textContent = btn.label;
      buttonStates[btn.key].element = button;

      // Create indicator dot for pressed state
      const indicator = document.createElement("div");
      indicator.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            width: 10px;
            height: 10px;
            background: #00ff00;
            border-radius: 50%;
            opacity: 0;
            transition: opacity 0.2s;
            box-shadow: 0 0 5px #00ff00;
        `;
      button.appendChild(indicator);

      // Store button reference for cleanup
      let currentButton = button;
      let currentIndicator = indicator;

      // Handle button press
      const pressButton = () => {
        if (!buttonStates[btn.key].pressed) {
          buttonStates[btn.key].pressed = true;

          // Visual feedback
          currentButton.style.background = "rgba(255, 255, 255, 0.9)";
          currentButton.style.color = "black";
          currentButton.style.boxShadow = "0 0 15px " + btn.color;
          currentButton.style.transform = "scale(0.95) translateY(2px)";
          currentIndicator.style.opacity = "1";

          // Trigger key press
          const mapping = currentProfile.mappings[btn.key];
          if (mapping) {
            sendKeyEvent(mapping, "down");
            logButtonEvent(btn.label, "pressed", mapping);
            logDebug(`Shoulder button ${btn.label} PRESSED`, {
              button: btn.label,
              key: btn.key,
              mapping: mapping,
              side: "left",
            });
          }
        }
      };

      // Handle button release
      const releaseButton = () => {
        if (buttonStates[btn.key].pressed) {
          buttonStates[btn.key].pressed = false;

          // Visual feedback
          currentButton.style.background = `rgba(0, 0, 0, ${config.buttonOpacity})`;
          currentButton.style.color = "white";
          currentButton.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
          currentButton.style.transform = "scale(1) translateY(0)";
          currentIndicator.style.opacity = "0";

          // Trigger key release
          const mapping = currentProfile.mappings[btn.key];
          if (mapping) {
            sendKeyEvent(mapping, "up");
            logButtonEvent(btn.label, "released", mapping);
            logDebug(`Shoulder button ${btn.label} RELEASED`, {
              button: btn.label,
              key: btn.key,
              mapping: mapping,
              side: "left",
            });
          }
        }
      };

      // Touch event handlers
      const touchStartHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        pressButton();
      };

      const touchEndHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        releaseButton();
      };

      const touchCancelHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        releaseButton();
      };

      // Mouse event handlers
      const mouseDownHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        pressButton();
      };

      const mouseUpHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        releaseButton();
      };

      const mouseLeaveHandler = (e) => {
        if (buttonStates[btn.key].pressed) {
          releaseButton();
        }
      };

      // Add touch event listeners
      button.addEventListener("touchstart", touchStartHandler, {
        passive: false,
      });
      button.addEventListener("touchend", touchEndHandler, { passive: false });
      button.addEventListener("touchcancel", touchCancelHandler, {
        passive: false,
      });

      // Add mouse event listeners
      button.addEventListener("mousedown", mouseDownHandler);
      button.addEventListener("mouseup", mouseUpHandler);
      button.addEventListener("mouseleave", mouseLeaveHandler);

      // Prevent context menu on long press
      button.addEventListener("contextmenu", (e) => {
        e.preventDefault();
      });

      // Store handlers for cleanup if needed
      button._handlers = {
        touchStart: touchStartHandler,
        touchEnd: touchEndHandler,
        touchCancel: touchCancelHandler,
        mouseDown: mouseDownHandler,
        mouseUp: mouseUpHandler,
        mouseLeave: mouseLeaveHandler,
      };

      container.appendChild(button);
    });

    // Clean up function
    container.cleanup = function () {
      buttons.forEach((btn) => {
        const button = buttonStates[btn.key].element;
        if (button && button._handlers) {
          button.removeEventListener("touchstart", button._handlers.touchStart);
          button.removeEventListener("touchend", button._handlers.touchEnd);
          button.removeEventListener(
            "touchcancel",
            button._handlers.touchCancel
          );
          button.removeEventListener("mousedown", button._handlers.mouseDown);
          button.removeEventListener("mouseup", button._handlers.mouseUp);
          button.removeEventListener("mouseleave", button._handlers.mouseLeave);
        }
      });
    };

    logDebug("Left shoulder buttons created", {
      buttons: buttons.map((b) => ({
        label: b.label,
        key: b.key,
        mapping: currentProfile.mappings[b.key],
        position: "center-left",
      })),
    });

    return container;
  }

  function createRightShoulderButtons() {
    const container = document.createElement("div");
    container.className = "shoulder-buttons-right";

    container.style.cssText = `
        position: absolute;
        right: 20px;
        top: 50%;
        width: 60px;
        height: 120px;
        pointer-events: auto;
        z-index: ${config.zIndex - 1};
        touch-action: none;
        display: flex;
        flex-direction: column;
        gap: 10px;
        align-items: center;
    `;

    const buttons = [
      {
        id: "R1",
        label: "R1",
        key: "BUTTON_RB",
        color: "#6b9fff",
        size: "55px",
      },
      {
        id: "R2",
        label: "R2",
        key: "BUTTON_RT",
        color: "#53b8ff",
        size: "55px",
      },
    ];

    // State tracking for buttons
    const buttonStates = {
      BUTTON_RB: { pressed: false, element: null },
      BUTTON_RT: { pressed: false, element: null },
    };

    buttons.forEach((btn) => {
      const button = document.createElement("div");
      button.className = "shoulder-button";
      button.dataset.key = btn.key;
      button.dataset.id = btn.id;

      button.style.cssText = `
            width: ${btn.size};
            height: ${btn.size};
            background: rgba(0, 0, 0, ${config.buttonOpacity});
            border: 3px solid ${btn.color};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            touch-action: none;
            user-select: none;
            -webkit-user-select: none;
            transition: all 0.1s;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            position: relative;
            z-index: 99999;
        `;

      button.textContent = btn.label;
      buttonStates[btn.key].element = button;

      // Create indicator dot for pressed state
      const indicator = document.createElement("div");
      indicator.style.cssText = `
            position: absolute;
            top: 5px;
            left: 5px;
            width: 10px;
            height: 10px;
            background: #00ff00;
            border-radius: 50%;
            opacity: 0;
            transition: opacity 0.2s;
            box-shadow: 0 0 5px #00ff00;
        `;
      button.appendChild(indicator);

      // Store button reference for cleanup
      let currentButton = button;
      let currentIndicator = indicator;

      // Handle button press
      const pressButton = () => {
        if (!buttonStates[btn.key].pressed) {
          buttonStates[btn.key].pressed = true;

          // Visual feedback
          currentButton.style.background = "rgba(255, 255, 255, 0.9)";
          currentButton.style.color = "black";
          currentButton.style.boxShadow = "0 0 15px " + btn.color;
          currentButton.style.transform = "scale(0.95) translateY(2px)";
          currentIndicator.style.opacity = "1";

          // Trigger key press
          const mapping = currentProfile.mappings[btn.key];
          if (mapping) {
            sendKeyEvent(mapping, "down");
            logButtonEvent(btn.label, "pressed", mapping);
            logDebug(`Shoulder button ${btn.label} PRESSED`, {
              button: btn.label,
              key: btn.key,
              mapping: mapping,
              side: "right",
            });
          }
        }
      };

      // Handle button release
      const releaseButton = () => {
        if (buttonStates[btn.key].pressed) {
          buttonStates[btn.key].pressed = false;

          // Visual feedback
          currentButton.style.background = `rgba(0, 0, 0, ${config.buttonOpacity})`;
          currentButton.style.color = "white";
          currentButton.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
          currentButton.style.transform = "scale(1) translateY(0)";
          currentIndicator.style.opacity = "0";

          // Trigger key release
          const mapping = currentProfile.mappings[btn.key];
          if (mapping) {
            sendKeyEvent(mapping, "up");
            logButtonEvent(btn.label, "released", mapping);
            logDebug(`Shoulder button ${btn.label} RELEASED`, {
              button: btn.label,
              key: btn.key,
              mapping: mapping,
              side: "right",
            });
          }
        }
      };

      // Touch event handlers
      const touchStartHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        pressButton();
      };

      const touchEndHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        releaseButton();
      };

      const touchCancelHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        releaseButton();
      };

      // Mouse event handlers
      const mouseDownHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        pressButton();
      };

      const mouseUpHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        releaseButton();
      };

      const mouseLeaveHandler = (e) => {
        if (buttonStates[btn.key].pressed) {
          releaseButton();
        }
      };

      // Add touch event listeners
      button.addEventListener("touchstart", touchStartHandler, {
        passive: false,
      });
      button.addEventListener("touchend", touchEndHandler, { passive: false });
      button.addEventListener("touchcancel", touchCancelHandler, {
        passive: false,
      });

      // Add mouse event listeners
      button.addEventListener("mousedown", mouseDownHandler);
      button.addEventListener("mouseup", mouseUpHandler);
      button.addEventListener("mouseleave", mouseLeaveHandler);

      // Prevent context menu on long press
      button.addEventListener("contextmenu", (e) => {
        e.preventDefault();
      });

      // Store handlers for cleanup if needed
      button._handlers = {
        touchStart: touchStartHandler,
        touchEnd: touchEndHandler,
        touchCancel: touchCancelHandler,
        mouseDown: mouseDownHandler,
        mouseUp: mouseUpHandler,
        mouseLeave: mouseLeaveHandler,
      };

      container.appendChild(button);
    });

    // Clean up function
    container.cleanup = function () {
      buttons.forEach((btn) => {
        const button = buttonStates[btn.key].element;
        if (button && button._handlers) {
          button.removeEventListener("touchstart", button._handlers.touchStart);
          button.removeEventListener("touchend", button._handlers.touchEnd);
          button.removeEventListener(
            "touchcancel",
            button._handlers.touchCancel
          );
          button.removeEventListener("mousedown", button._handlers.mouseDown);
          button.removeEventListener("mouseup", button._handlers.mouseUp);
          button.removeEventListener("mouseleave", button._handlers.mouseLeave);
        }
      });
    };

    logDebug("Right shoulder buttons created", {
      buttons: buttons.map((b) => ({
        label: b.label,
        key: b.key,
        mapping: currentProfile.mappings[b.key],
        position: "center-right",
      })),
    });

    return container;
  }

  function createTouchControls() {
    if (overlay) return;

    overlay = document.createElement("div");
    overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: ${config.zIndex - 1};
            touch-action: none;
            -webkit-user-select: none;
            user-select: none;
        `;

    // Create left joystick area
    const leftJoystick = createJoystick("left", "move");
    leftJoystick.style.cssText = `
            position: absolute;
            left: 30px;
            bottom: 30px;
            width: ${config.joystickSize};
            height: ${config.joystickSize};
            pointer-events: auto;
        `;

    // Create right joystick area
    const rightJoystick = createJoystick("right", "look");
    rightJoystick.style.cssText = `
            position: absolute;
            right: 30px;
            bottom: 30px;
            width: ${config.joystickSize};
            height: ${config.joystickSize};
            pointer-events: auto;
        `;

    // Create button cluster
    const buttonCluster = createButtonCluster();

    // Position button cluster based on configuration
    if (config.buttonClusterPosition === "top-right") {
      buttonCluster.style.cssText = `
                position: absolute;
                right: 30px;
                top: 30px;
                width: 200px;
                height: 200px;
                pointer-events: auto;
            `;
    } else if (config.buttonClusterPosition === "center-right") {
      buttonCluster.style.cssText = `
                position: absolute;
                right: 30px;
                top: 50%;
                transform: translateY(-50%);
                width: 200px;
                height: 200px;
                pointer-events: auto;
            `;
    } else {
      // bottom-right (default)
      buttonCluster.style.cssText = `
                position: absolute;
                right: 30px;
                bottom: calc(${config.joystickSize} + 60px);
                width: 200px;
                height: 200px;
                pointer-events: auto;
            `;
    }

    // Create system buttons
    const systemButtons = createSystemButtons();
    systemButtons.style.cssText = `
            position: absolute;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 20px;
            pointer-events: auto;
        `;

    // Create D-pad
    const dpad = createDpadTouch();

    // ================ ADD SHOULDER BUTTONS HERE ================
    // Create left shoulder buttons (L1/L2)
    const leftShoulderButtons = createLeftShoulderButtons();

    // Create right shoulder buttons (R1/R2)
    const rightShoulderButtons = createRightShoulderButtons();
    // ==========================================================

    // append on screen buttons
    overlay.appendChild(leftJoystick);
    overlay.appendChild(rightJoystick);
    overlay.appendChild(buttonCluster);
    overlay.appendChild(dpad);
    overlay.appendChild(systemButtons);

    // Add shoulder buttons to overlay
    overlay.appendChild(leftShoulderButtons);
    overlay.appendChild(rightShoulderButtons);

    document.body.appendChild(overlay);

    document.body.appendChild(overlay);

    // Create mobile keyboard input if needed
    if (config.enableMobileKeyboardSupport) {
      createMobileTextInput();
    }

    logDebug("Touch controls created", {
      joystickSize: config.joystickSize,
      buttonClusterPosition: config.buttonClusterPosition,
      mobileKeyboardSupport: config.enableMobileKeyboardSupport,
    });

    // Auto-enable on touch devices
    if (config.autoEnableOnTouch && "ontouchstart" in window) {
      setTimeout(() => {
        if (!isEnabled) {
          toggleVirtualGamepad();
        }
      }, 1000);
    }
  }

  // ================ REVISED JOYSTICK IMPLEMENTATION ================
  function createJoystick(side, type) {
    const joystick = document.createElement("div");
    joystick.className = `joystick joystick-${side}`;
    joystick.dataset.type = type;
    joystick.dataset.side = side;

    // Use SVG like original project
    joystick.innerHTML = `
        <style>
            .joystick-container {
                width: 100%;
                height: 100%;
                position: relative;
                touch-action: none;
                user-select: none;
            }
            .joystick-svg {
                width: 100%;
                height: 100%;
                pointer-events: none;
            }
            .joystick-area {
                position: absolute;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: rgba(0, 0, 0, ${config.buttonOpacity});
                border: ${
                  config.showJoystickOutline
                    ? "2px solid " + config.joystickOutlineColor
                    : "none"
                };
                cursor: move;
                touch-action: none;
                box-shadow: ${
                  config.showJoystickOutline
                    ? "0 0 10px rgba(0,0,0,0.5)"
                    : "none"
                };
                transition: background-color 0.2s;
            }
            .joystick-nub {
                position: absolute;
                width: 40%;
                height: 40%;
                background: ${config.joystickNubColor};
                border-radius: 50%;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                transition: transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                pointer-events: none;
            }
            .joystick-label {
                position: absolute;
                top: -25px;
                left: 0;
                right: 0;
                color: white;
                font-size: 12px;
                text-shadow: 1px 1px 2px black;
                white-space: nowrap;
                text-align: center;
                font-weight: bold;
                background: rgba(0,0,0,0.5);
                padding: 2px 8px;
                border-radius: 10px;
                pointer-events: none;
            }
            .joystick-arrows {
                position: absolute;
                width: 100%;
                height: 100%;
                pointer-events: none;
                opacity: 0.3;
            }
            .joystick-arrow {
                position: absolute;
                width: 12%;
                height: 12%;
                background: currentColor;
                clip-path: polygon(100% 50%, 0 0, 0 100%);
            }
            .joystick-arrow:nth-child(1) { top: 5%; left: 50%; transform: translateX(-50%) rotate(90deg); } /* Up */
            .joystick-arrow:nth-child(2) { bottom: 5%; left: 50%; transform: translateX(-50%) rotate(-90deg); } /* Down */
            .joystick-arrow:nth-child(3) { left: 5%; top: 50%; transform: translateY(-50%) rotate(180deg); } /* Left */
            .joystick-arrow:nth-child(4) { right: 5%; top: 50%; transform: translateY(-50%) rotate(0deg); } /* Right */
            .joystick-arrow:nth-child(5) { top: 15%; left: 15%; transform: rotate(135deg); } /* Up-left */
            .joystick-arrow:nth-child(6) { top: 15%; right: 15%; transform: rotate(45deg); } /* Up-right */
            .joystick-arrow:nth-child(7) { bottom: 15%; left: 15%; transform: rotate(-135deg); } /* Down-left */
            .joystick-arrow:nth-child(8) { bottom: 15%; right: 15%; transform: rotate(-45deg); } /* Down-right */
        </style>
        <div class="joystick-container">
            <div class="joystick-area"></div>
            <div class="joystick-arrows">
                <div class="joystick-arrow"></div>
                <div class="joystick-arrow"></div>
                <div class="joystick-arrow"></div>
                <div class="joystick-arrow"></div>
                <div class="joystick-arrow"></div>
                <div class="joystick-arrow"></div>
                <div class="joystick-arrow"></div>
                <div class="joystick-arrow"></div>
            </div>
            <div class="joystick-nub"></div>
            <div class="joystick-label">${
              type === "move" ? "MOVEMENT" : "LOOK"
            }</div>
        </div>
    `;

    const joystickArea = joystick.querySelector(".joystick-area");
    const nub = joystick.querySelector(".joystick-nub");

    // State for this specific joystick instance
    let activeTouchId = null; // Track by touch identifier, not just active/not
    let lastTapTime = 0;
    const maxDistance = parseFloat(config.joystickSize) * 0.35; // 35% of joystick size

    // Track which keys are currently pressed (for left joystick)
    const activeKeys = {
      up: false,
      down: false,
      left: false,
      right: false,
    };

    // For right joystick: mouse movement tracking
    let mouseInterval = null;
    let currentMouseVector = { x: 0, y: 0 };
    let lastMouseUpdate = 0;

    // Get normalized joystick position (-1 to 1)
    function getJoystickPosition(touch) {
      const rect = joystickArea.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const touchX = touch.clientX - centerX;
      const touchY = touch.clientY - centerY;

      // Normalize to -1 to 1 range
      let normX = touchX / maxDistance;
      let normY = touchY / maxDistance;

      // Clamp to circle
      const distance = Math.sqrt(normX * normX + normY * normY);
      if (distance > 1) {
        normX /= distance;
        normY /= distance;
      }

      // Apply deadzone with smooth scaling
      const deadzone = config.joystickDeadZone;
      if (Math.abs(normX) < deadzone) normX = 0;
      else {
        // Scale from deadzone to 1 smoothly
        normX =
          Math.sign(normX) * ((Math.abs(normX) - deadzone) / (1 - deadzone));
      }

      if (Math.abs(normY) < deadzone) normY = 0;
      else {
        normY =
          Math.sign(normY) * ((Math.abs(normY) - deadzone) / (1 - deadzone));
      }

      return { x: normX, y: normY, distance: Math.min(distance, 1) };
    }

    // Update joystick nub position
    function updateNubPosition(x, y) {
      nub.style.transform = `translate(-50%, -50%) translate(${
        x * maxDistance
      }px, ${y * maxDistance}px)`;
    }

    // Handle left stick (WASD movement keys)
    function handleLeftStick(x, y) {
      const threshold = 0.1; // Activation threshold

      // Determine which directions are active
      const upActive = y < -threshold;
      const downActive = y > threshold;
      const leftActive = x < -threshold;
      const rightActive = x > threshold;

      // Get key mappings
      const upKey = currentProfile.mappings.JOYSTICK_LEFT_UP || "w";
      const downKey = currentProfile.mappings.JOYSTICK_LEFT_DOWN || "s";
      const leftKey = currentProfile.mappings.JOYSTICK_LEFT_LEFT || "a";
      const rightKey = currentProfile.mappings.JOYSTICK_LEFT_RIGHT || "d";

      // Update keys based on current state - only send events when state changes
      if (upActive !== activeKeys.up) {
        if (upActive) {
          sendKeyEvent(upKey, "down");
          logDebug(`LEFT JOYSTICK: UP PRESSED (${upKey})`, {
            x: x.toFixed(3),
            y: y.toFixed(3),
          });
        } else {
          sendKeyEvent(upKey, "up");
          logDebug(`LEFT JOYSTICK: UP RELEASED (${upKey})`, {
            x: x.toFixed(3),
            y: y.toFixed(3),
          });
        }
        activeKeys.up = upActive;
      }

      if (downActive !== activeKeys.down) {
        if (downActive) {
          sendKeyEvent(downKey, "down");
          logDebug(`LEFT JOYSTICK: DOWN PRESSED (${downKey})`, {
            x: x.toFixed(3),
            y: y.toFixed(3),
          });
        } else {
          sendKeyEvent(downKey, "up");
          logDebug(`LEFT JOYSTICK: DOWN RELEASED (${downKey})`, {
            x: x.toFixed(3),
            y: y.toFixed(3),
          });
        }
        activeKeys.down = downActive;
      }

      if (leftActive !== activeKeys.left) {
        if (leftActive) {
          sendKeyEvent(leftKey, "down");
          logDebug(`LEFT JOYSTICK: LEFT PRESSED (${leftKey})`, {
            x: x.toFixed(3),
            y: y.toFixed(3),
          });
        } else {
          sendKeyEvent(leftKey, "up");
          logDebug(`LEFT JOYSTICK: LEFT RELEASED (${leftKey})`, {
            x: x.toFixed(3),
            y: y.toFixed(3),
          });
        }
        activeKeys.left = leftActive;
      }

      if (rightActive !== activeKeys.right) {
        if (rightActive) {
          sendKeyEvent(rightKey, "down");
          logDebug(`LEFT JOYSTICK: RIGHT PRESSED (${rightKey})`, {
            x: x.toFixed(3),
            y: y.toFixed(3),
          });
        } else {
          sendKeyEvent(rightKey, "up");
          logDebug(`LEFT JOYSTICK: RIGHT RELEASED (${rightKey})`, {
            x: x.toFixed(3),
            y: y.toFixed(3),
          });
        }
        activeKeys.right = rightActive;
      }

      // Log diagonals
      if (activeKeys.up && activeKeys.left) {
        logDebug(`LEFT JOYSTICK: DIAGONAL UP-LEFT`, {
          x: x.toFixed(3),
          y: y.toFixed(3),
        });
      }
      if (activeKeys.up && activeKeys.right) {
        logDebug(`LEFT JOYSTICK: DIAGONAL UP-RIGHT`, {
          x: x.toFixed(3),
          y: y.toFixed(3),
        });
      }
      if (activeKeys.down && activeKeys.left) {
        logDebug(`LEFT JOYSTICK: DIAGONAL DOWN-LEFT`, {
          x: x.toFixed(3),
          y: y.toFixed(3),
        });
      }
      if (activeKeys.down && activeKeys.right) {
        logDebug(`LEFT JOYSTICK: DIAGONAL DOWN-RIGHT`, {
          x: x.toFixed(3),
          y: y.toFixed(3),
        });
      }
    }

    // Handle right stick (mouse movement)
    function handleRightStick(x, y) {
      currentMouseVector.x = x;
      currentMouseVector.y = y;

      // Start mouse movement if not already running and we have movement
      if (!mouseInterval && (Math.abs(x) > 0.01 || Math.abs(y) > 0.01)) {
        startMouseMovement();
      }

      logDebug(`RIGHT JOYSTICK: Mouse delta`, {
        x: x.toFixed(3),
        y: y.toFixed(3),
        magnitude: Math.sqrt(x * x + y * y).toFixed(3),
      });
    }

    function startMouseMovement() {
      if (mouseInterval) clearInterval(mouseInterval);

      mouseInterval = setInterval(() => {
        const now = Date.now();
        if (now - lastMouseUpdate >= 16) {
          // ~60fps
          if (
            Math.abs(currentMouseVector.x) > 0.001 ||
            Math.abs(currentMouseVector.y) > 0.001
          ) {
            const sensitivity = config.mouseLookSensitivity * 8;
            const deltaX = currentMouseVector.x * sensitivity;
            const deltaY = currentMouseVector.y * sensitivity;

            simulateMouseMove(deltaX, deltaY);
            lastMouseUpdate = now;
          }
        }
      }, 16);
    }

    function stopMouseMovement() {
      if (mouseInterval) {
        clearInterval(mouseInterval);
        mouseInterval = null;
      }
      currentMouseVector = { x: 0, y: 0 };
      logDebug("RIGHT JOYSTICK: Mouse movement stopped");
    }

    // Reset joystick to center
    function resetJoystick() {
      // Smooth nub return
      nub.style.transition = "transform 0.2s ease-out";
      nub.style.transform = "translate(-50%, -50%)";

      setTimeout(() => {
        nub.style.transition = "";
      }, 200);

      // Release all movement keys if left stick
      if (side === "left") {
        if (activeKeys.up) {
          sendKeyEvent(currentProfile.mappings.JOYSTICK_LEFT_UP || "w", "up");
          activeKeys.up = false;
          logDebug(`LEFT JOYSTICK: UP RELEASED (reset)`);
        }
        if (activeKeys.down) {
          sendKeyEvent(currentProfile.mappings.JOYSTICK_LEFT_DOWN || "s", "up");
          activeKeys.down = false;
          logDebug(`LEFT JOYSTICK: DOWN RELEASED (reset)`);
        }
        if (activeKeys.left) {
          sendKeyEvent(currentProfile.mappings.JOYSTICK_LEFT_LEFT || "a", "up");
          activeKeys.left = false;
          logDebug(`LEFT JOYSTICK: LEFT RELEASED (reset)`);
        }
        if (activeKeys.right) {
          sendKeyEvent(
            currentProfile.mappings.JOYSTICK_LEFT_RIGHT || "d",
            "up"
          );
          activeKeys.right = false;
          logDebug(`LEFT JOYSTICK: RIGHT RELEASED (reset)`);
        }
      } else {
        // Stop mouse movement if right stick
        stopMouseMovement();
      }

      activeTouchId = null;
      logDebug(`${side.toUpperCase()} JOYSTICK: Reset`);
    }

    // Handle touch start with proper multi-touch tracking
    function handleTouchStart(e) {
      e.preventDefault();
      e.stopPropagation();

      // Get all touches on this specific joystick area
      const rect = joystickArea.getBoundingClientRect();
      const touches = Array.from(e.touches);

      // Find the first touch that's within this joystick's bounds and not already assigned
      for (const touch of touches) {
        const touchX = touch.clientX;
        const touchY = touch.clientY;

        // Check if touch is within this joystick's bounds
        if (
          touchX >= rect.left &&
          touchX <= rect.right &&
          touchY >= rect.top &&
          touchY <= rect.bottom
        ) {
          // Check if this touch is already being tracked by another joystick
          // (we'll track this globally later, but for now just check if we're already tracking)
          if (!activeTouchId) {
            activeTouchId = touch.identifier;

            // Check for double-tap for L3/R3
            const now = Date.now();
            if (
              config.clickableThumbsticks &&
              now - lastTapTime < config.doubleTapThreshold
            ) {
              // Double-tap detected - trigger L3/R3
              const button = side === "left" ? "BUTTON_L3" : "BUTTON_R3";
              const mapping = currentProfile.mappings[button];

              if (mapping) {
                // Visual feedback
                joystickArea.style.backgroundColor = "rgba(255, 200, 0, 0.7)";
                setTimeout(() => {
                  joystickArea.style.backgroundColor = `rgba(0, 0, 0, ${config.buttonOpacity})`;
                }, 200);

                // Send click event
                sendKeyEvent(mapping, "down");
                setTimeout(() => sendKeyEvent(mapping, "up"), 100);

                logDebug(
                  `${side.toUpperCase()} JOYSTICK: Double-tap ${button}`,
                  {
                    mapping,
                  }
                );
              }

              // Don't track this as joystick movement
              activeTouchId = null;
              return;
            }

            lastTapTime = now;

            // Update joystick immediately
            const pos = getJoystickPosition(touch);
            updateNubPosition(pos.x, pos.y);

            if (side === "left") {
              handleLeftStick(pos.x, pos.y);
            } else {
              handleRightStick(pos.x, pos.y);
            }

            logDebug(`${side.toUpperCase()} JOYSTICK: Touch started`, {
              touchId: activeTouchId,
              position: { x: pos.x.toFixed(3), y: pos.y.toFixed(3) },
            });

            break; // Found our touch, stop looking
          }
        }
      }
    }

    // Handle touch move with proper touch tracking
    function handleTouchMove(e) {
      e.preventDefault();
      e.stopPropagation();

      if (!activeTouchId) return;

      // Find our active touch among all touches
      for (const touch of e.touches) {
        if (touch.identifier === activeTouchId) {
          const pos = getJoystickPosition(touch);
          updateNubPosition(pos.x, pos.y);

          if (side === "left") {
            handleLeftStick(pos.x, pos.y);
          } else {
            handleRightStick(pos.x, pos.y);
          }
          break;
        }
      }
    }

    // Handle touch end with proper touch tracking
    function handleTouchEnd(e) {
      e.preventDefault();
      e.stopPropagation();

      if (!activeTouchId) return;

      // Check if our active touch ended
      for (const touch of e.changedTouches) {
        if (touch.identifier === activeTouchId) {
          logDebug(`${side.toUpperCase()} JOYSTICK: Touch ended`, {
            touchId: activeTouchId,
          });
          resetJoystick();
          break;
        }
      }
    }

    // Handle touch cancel with proper touch tracking
    function handleTouchCancel(e) {
      e.preventDefault();
      e.stopPropagation();

      if (!activeTouchId) return;

      // Check if our active touch was cancelled
      for (const touch of e.changedTouches) {
        if (touch.identifier === activeTouchId) {
          logDebug(`${side.toUpperCase()} JOYSTICK: Touch cancelled`, {
            touchId: activeTouchId,
          });
          resetJoystick();
          break;
        }
      }
    }

    // Event listeners - use capturing phase to ensure we get events
    joystickArea.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    joystickArea.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    joystickArea.addEventListener("touchend", handleTouchEnd, {
      passive: false,
    });
    joystickArea.addEventListener("touchcancel", handleTouchCancel, {
      passive: false,
    });

    // Mouse support for desktop testing
    joystickArea.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (activeTouchId) return; // Already tracking

      activeTouchId = "mouse";

      // Check for double-tap
      const now = Date.now();
      if (
        config.clickableThumbsticks &&
        now - lastTapTime < config.doubleTapThreshold
      ) {
        const button = side === "left" ? "BUTTON_L3" : "BUTTON_R3";
        const mapping = currentProfile.mappings[button];

        if (mapping) {
          joystickArea.style.backgroundColor = "rgba(255, 200, 0, 0.7)";
          setTimeout(() => {
            joystickArea.style.backgroundColor = `rgba(0, 0, 0, ${config.buttonOpacity})`;
          }, 200);

          sendKeyEvent(mapping, "down");
          setTimeout(() => sendKeyEvent(mapping, "up"), 100);

          logDebug(
            `${side.toUpperCase()} JOYSTICK: Mouse double-tap ${button}`,
            {
              mapping,
            }
          );
        }

        activeTouchId = null;
        return;
      }

      lastTapTime = now;

      // Update immediately
      const touch = { clientX: e.clientX, clientY: e.clientY };
      const pos = getJoystickPosition(touch);
      updateNubPosition(pos.x, pos.y);

      if (side === "left") {
        handleLeftStick(pos.x, pos.y);
      } else {
        handleRightStick(pos.x, pos.y);
      }

      // Mouse move tracking
      const mouseMoveHandler = (e) => {
        const touch = { clientX: e.clientX, clientY: e.clientY };
        const pos = getJoystickPosition(touch);
        updateNubPosition(pos.x, pos.y);

        if (side === "left") {
          handleLeftStick(pos.x, pos.y);
        } else {
          handleRightStick(pos.x, pos.y);
        }
      };

      const mouseUpHandler = () => {
        document.removeEventListener("mousemove", mouseMoveHandler);
        document.removeEventListener("mouseup", mouseUpHandler);
        resetJoystick();
      };

      document.addEventListener("mousemove", mouseMoveHandler);
      document.addEventListener("mouseup", mouseUpHandler);
    });

    // Clean up function
    joystick.cleanup = function () {
      resetJoystick();
      if (mouseInterval) {
        clearInterval(mouseInterval);
      }
    };

    return joystick;
  }

  function createFaceButtons() {
    const container = document.createElement("div");
    container.className = "face-buttons";

    container.style.cssText = `
        position: absolute;
        right: 30px;
        bottom: calc(${config.joystickSize} + 60px);
        width: 150px;
        height: 150px;
        pointer-events: auto;
        z-index: ${config.zIndex - 1};
        touch-action: none;
    `;

    // Create wrapper for SVG
    const svgWrapper = document.createElement("div");
    svgWrapper.style.cssText = `
        width: 100%;
        height: 100%;
        position: relative;
        touch-action: none;
    `;

    // Create SVG element
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 10 10");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.style.cssText = `
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        touch-action: none;
    `;

    // Create filter for invert effect
    const filter = document.createElementNS(svgNS, "filter");
    filter.id = "invert";
    const feColorMatrix = document.createElementNS(svgNS, "feColorMatrix");
    feColorMatrix.setAttribute("in", "SourceGraphic");
    feColorMatrix.setAttribute("type", "matrix");
    feColorMatrix.setAttribute(
      "values",
      "-1 0 0 0 1 0 -1 0 0 1 0 0 -1 0 1 0 0 0 1 0"
    );
    filter.appendChild(feColorMatrix);
    svg.appendChild(filter);

    // Create masks
    ["A", "B", "X", "Y"].forEach((label) => {
      const mask = document.createElementNS(svgNS, "mask");
      mask.id = label;

      const rect = document.createElementNS(svgNS, "rect");
      rect.setAttribute("width", "10");
      rect.setAttribute("height", "10");
      rect.setAttribute("fill", "white");

      const text = document.createElementNS(svgNS, "text");
      text.setAttribute("x", "5");
      text.setAttribute("y", "5");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "middle");
      text.setAttribute("font-family", "sans-serif");
      text.setAttribute("font-weight", "bold");
      text.setAttribute("font-size", "6");
      text.setAttribute("fill", "black");
      text.textContent = label;

      mask.appendChild(rect);
      mask.appendChild(text);
      svg.appendChild(mask);
    });

    // Create style element
    const style = document.createElementNS(svgNS, "style");
    style.textContent = `
        #cluster { opacity: 0.5; }
        #buttons { opacity: 0.75; }
        #buttons > * {
            transform-origin: 5px 5px;
            transform-box: fill-box;
        }
        #buttons > :nth-child(1) { transform: rotate(90deg) translate(2.7px) rotate(-90deg) scale(0.33); }
        #buttons > :nth-child(2) { transform: rotate(0deg) translate(2.7px) rotate(0deg) scale(0.33); }
        #buttons > :nth-child(3) { transform: rotate(180deg) translate(2.7px) rotate(-180deg) scale(0.33); }
        #buttons > :nth-child(4) { transform: rotate(270deg) translate(2.7px) rotate(-270deg) scale(0.33); }
        .pressed { filter: url(#invert); }
        circle { 
            pointer-events: visible; 
            cursor: pointer; 
            touch-action: none;
        }
    `;
    svg.appendChild(style);

    // Create main group
    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("style", "opacity: 0.5; fill: currentColor;");

    // Cluster circle
    const clusterCircle = document.createElementNS(svgNS, "circle");
    clusterCircle.id = "cluster";
    clusterCircle.setAttribute("cx", "5");
    clusterCircle.setAttribute("cy", "5");
    clusterCircle.setAttribute("r", "5");
    clusterCircle.setAttribute("fill", "currentColor");

    // Buttons group
    const buttonsGroup = document.createElementNS(svgNS, "g");
    buttonsGroup.id = "buttons";

    // Create buttons
    ["A", "B", "X", "Y"].forEach((maskId, index) => {
      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", "5");
      circle.setAttribute("cy", "5");
      circle.setAttribute("r", "5");
      circle.setAttribute("mask", `url(#${maskId})`);
      circle.setAttribute("fill", "currentColor");
      circle.dataset.index = index;
      circle.dataset.key = `BUTTON_${maskId}`;
      circle.dataset.button = maskId;
      buttonsGroup.appendChild(circle);
    });

    g.appendChild(clusterCircle);
    g.appendChild(buttonsGroup);
    svg.appendChild(g);
    svgWrapper.appendChild(svg);
    container.appendChild(svgWrapper);

    // Set color for the entire SVG
    svg.style.color = "#ffffff";

    // State tracking
    const buttonStates = {
      0: { pressed: false, value: 0, element: null },
      1: { pressed: false, value: 0, element: null },
      2: { pressed: false, value: 0, element: null },
      3: { pressed: false, value: 0, element: null },
    };

    // Get all button elements
    const buttons = svg.querySelectorAll("#buttons > circle");
    buttons.forEach((button, index) => {
      buttonStates[index].element = button;
    });

    // Button mappings
    const buttonMappings = [
      currentProfile.mappings.BUTTON_A,
      currentProfile.mappings.BUTTON_B,
      currentProfile.mappings.BUTTON_X,
      currentProfile.mappings.BUTTON_Y,
    ];

    // Button names for logging
    const buttonNames = ["A", "B", "X", "Y"];

    // Function to update button state
    function updateButton(index, value) {
      const state = buttonStates[index];
      if (state.value === value) return;

      state.value = value;
      state.pressed = value > 0;

      // Update visual state
      if (state.pressed) {
        state.element.classList.add("pressed");
      } else {
        state.element.classList.remove("pressed");
      }

      // Trigger key events
      const mapping = buttonMappings[index];
      if (mapping) {
        if (state.pressed) {
          sendKeyEvent(mapping, "down");
          logButtonEvent(buttonNames[index], "pressed", mapping);
          logDebug(`Button ${buttonNames[index]} PRESSED`, {
            button: buttonNames[index],
            mapping: mapping,
          });
        } else {
          sendKeyEvent(mapping, "up");
          logButtonEvent(buttonNames[index], "released", mapping);
          logDebug(`Button ${buttonNames[index]} RELEASED`, {
            button: buttonNames[index],
            mapping: mapping,
          });
        }
      }
    }

    // Track active touches
    let activeTouches = new Map();

    // Get the actual transformed positions from the DOM
    function getTransformedButtonPositions() {
      const positions = [];
      const buttons = svg.querySelectorAll("#buttons > circle");

      buttons.forEach((button, index) => {
        // Get the actual screen position of the transformed circle
        const rect = button.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const radius = rect.width / 2;

        positions.push({
          centerX,
          centerY,
          radius,
          button: button,
          index: index,
        });

        logDebug(`Button ${buttonNames[index]} ACTUAL position:`, {
          name: buttonNames[index],
          centerX: centerX.toFixed(1),
          centerY: centerY.toFixed(1),
          radius: radius.toFixed(1),
          bounds: {
            left: rect.left.toFixed(1),
            top: rect.top.toFixed(1),
            right: rect.right.toFixed(1),
            bottom: rect.bottom.toFixed(1),
          },
        });
      });

      return positions;
    }

    // Simple hit test using actual DOM positions
    function getButtonAtScreenPosition(screenX, screenY) {
      const positions = getTransformedButtonPositions();

      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        const distance = Math.sqrt(
          Math.pow(screenX - pos.centerX, 2) +
            Math.pow(screenY - pos.centerY, 2)
        );

        if (distance <= pos.radius) {
          return i;
        }
      }

      return -1;
    }

    // Handle pointer events
    function handlePointerStart(screenX, screenY, identifier = null) {
      const buttonIndex = getButtonAtScreenPosition(screenX, screenY);

      if (buttonIndex !== -1) {
        if (identifier !== null) {
          activeTouches.set(identifier, buttonIndex);
        }
        updateButton(buttonIndex, 1);

        logDebug(`Pointer START on button ${buttonNames[buttonIndex]}`, {
          button: buttonNames[buttonIndex],
          screenX: screenX.toFixed(1),
          screenY: screenY.toFixed(1),
          method: identifier !== null ? "touch" : "mouse",
        });
      }
    }

    function handlePointerEnd(identifier = null) {
      if (identifier !== null) {
        // For touch
        if (activeTouches.has(identifier)) {
          const buttonIndex = activeTouches.get(identifier);
          updateButton(buttonIndex, 0);
          activeTouches.delete(identifier);
        }
      } else {
        // For mouse - release all pressed buttons
        for (let i = 0; i < 4; i++) {
          if (buttonStates[i].pressed) {
            updateButton(i, 0);
          }
        }
      }
    }

    // Touch events
    svg.addEventListener("touchstart", (e) => {
      e.preventDefault();
      e.stopPropagation();

      Array.from(e.changedTouches).forEach((touch) => {
        handlePointerStart(touch.clientX, touch.clientY, touch.identifier);
      });
    });

    svg.addEventListener("touchmove", (e) => {
      e.preventDefault();
      e.stopPropagation();

      Array.from(e.changedTouches).forEach((touch) => {
        const touchId = touch.identifier;
        if (!activeTouches.has(touchId)) return;

        const buttonIndex = activeTouches.get(touchId);
        // Check if still over the same button
        const currentButtonIndex = getButtonAtScreenPosition(
          touch.clientX,
          touch.clientY
        );
        if (currentButtonIndex !== buttonIndex) {
          // Moved out of button
          updateButton(buttonIndex, 0);
          activeTouches.delete(touchId);
        }
      });
    });

    svg.addEventListener("touchend", (e) => {
      e.preventDefault();
      e.stopPropagation();

      Array.from(e.changedTouches).forEach((touch) => {
        handlePointerEnd(touch.identifier);
      });
    });

    svg.addEventListener("touchcancel", (e) => {
      e.preventDefault();
      e.stopPropagation();

      Array.from(e.changedTouches).forEach((touch) => {
        handlePointerEnd(touch.identifier);
      });
    });

    // Mouse events
    svg.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handlePointerStart(e.clientX, e.clientY);
    });

    svg.addEventListener("mouseup", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handlePointerEnd();
    });

    svg.addEventListener("mouseleave", (e) => {
      handlePointerEnd();
    });

    // Clean up debug overlay when container is removed
    container.cleanup = function () {
      if (debugOverlay && debugOverlay.parentNode) {
        debugOverlay.parentNode.removeChild(debugOverlay);
      }
    };

    logDebug("Face buttons created with DEBUG overlay", {
      note: "Red/Green/Blue/Yellow circles show ACTUAL touch areas",
      buttonNames: buttonNames,
    });

    return container;
  }
  function createButtonCluster() {
    // Just return face buttons positioned above right thumbstick
    return createFaceButtons();
  }

  function createSystemButtons() {
    const container = document.createElement("div");
    container.className = "system-buttons";

    const buttons = [
      { id: "SELECT", label: "Select", key: "BUTTON_SELECT", color: "#666" },
      { id: "START", label: "Start", key: "BUTTON_START", color: "#666" },
    ];

    // State tracking for buttons
    const buttonStates = {
      BUTTON_SELECT: { pressed: false, element: null },
      BUTTON_START: { pressed: false, element: null },
    };

    buttons.forEach((btn) => {
      const button = document.createElement("div");
      button.className = "system-button";
      button.dataset.key = btn.key;
      button.dataset.id = btn.id;

      button.style.cssText = `
            width: 80px;
            height: 40px;
            background: rgba(0, 0, 0, ${config.buttonOpacity});
            border: 2px solid ${btn.color};
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            cursor: pointer;
            touch-action: none;
            user-select: none;
            -webkit-user-select: none;
            transition: all 0.1s;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            position: relative;
            z-index: 99999;
        `;

      button.textContent = btn.label;
      buttonStates[btn.key].element = button;

      // Store button reference for cleanup
      let currentButton = button;

      // Handle button press
      const pressButton = () => {
        if (!buttonStates[btn.key].pressed) {
          buttonStates[btn.key].pressed = true;

          // Visual feedback
          currentButton.style.background = "rgba(255, 255, 255, 0.9)";
          currentButton.style.color = "black";
          currentButton.style.boxShadow = "0 0 10px rgba(255,255,255,0.5)";
          currentButton.style.transform = "scale(0.95)";

          // Trigger key press
          const mapping = currentProfile.mappings[btn.key];
          if (mapping) {
            sendKeyEvent(mapping, "down");
            logButtonEvent(btn.label, "pressed", mapping);
            logDebug(`System button ${btn.label} PRESSED`, {
              button: btn.label,
              key: btn.key,
              mapping: mapping,
            });
          }
        }
      };

      // Handle button release
      const releaseButton = () => {
        if (buttonStates[btn.key].pressed) {
          buttonStates[btn.key].pressed = false;

          // Visual feedback
          currentButton.style.background = `rgba(0, 0, 0, ${config.buttonOpacity})`;
          currentButton.style.color = "white";
          currentButton.style.boxShadow = "0 2px 5px rgba(0,0,0,0.3)";
          currentButton.style.transform = "scale(1)";

          // Trigger key release
          const mapping = currentProfile.mappings[btn.key];
          if (mapping) {
            sendKeyEvent(mapping, "up");
            logButtonEvent(btn.label, "released", mapping);
            logDebug(`System button ${btn.label} RELEASED`, {
              button: btn.label,
              key: btn.key,
              mapping: mapping,
            });
          }
        }
      };

      // Touch event handlers
      const touchStartHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        pressButton();
      };

      const touchEndHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        releaseButton();
      };

      const touchCancelHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        releaseButton();
      };

      // Mouse event handlers
      const mouseDownHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        pressButton();
      };

      const mouseUpHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        releaseButton();
      };

      const mouseLeaveHandler = (e) => {
        if (buttonStates[btn.key].pressed) {
          releaseButton();
        }
      };

      // Add touch event listeners
      button.addEventListener("touchstart", touchStartHandler, {
        passive: false,
      });
      button.addEventListener("touchend", touchEndHandler, { passive: false });
      button.addEventListener("touchcancel", touchCancelHandler, {
        passive: false,
      });

      // Add mouse event listeners
      button.addEventListener("mousedown", mouseDownHandler);
      button.addEventListener("mouseup", mouseUpHandler);
      button.addEventListener("mouseleave", mouseLeaveHandler);

      // Prevent context menu on long press
      button.addEventListener("contextmenu", (e) => {
        e.preventDefault();
      });

      // Store handlers for cleanup if needed
      button._handlers = {
        touchStart: touchStartHandler,
        touchEnd: touchEndHandler,
        touchCancel: touchCancelHandler,
        mouseDown: mouseDownHandler,
        mouseUp: mouseUpHandler,
        mouseLeave: mouseLeaveHandler,
      };

      container.appendChild(button);
    });

    // Clean up function (optional, for when controls are disabled)
    container.cleanup = function () {
      buttons.forEach((btn) => {
        const button = buttonStates[btn.key].element;
        if (button && button._handlers) {
          button.removeEventListener("touchstart", button._handlers.touchStart);
          button.removeEventListener("touchend", button._handlers.touchEnd);
          button.removeEventListener(
            "touchcancel",
            button._handlers.touchCancel
          );
          button.removeEventListener("mousedown", button._handlers.mouseDown);
          button.removeEventListener("mouseup", button._handlers.mouseUp);
          button.removeEventListener("mouseleave", button._handlers.mouseLeave);
        }
      });
    };

    logDebug("System buttons created", {
      buttons: buttons.map((b) => ({
        label: b.label,
        key: b.key,
        mapping: currentProfile.mappings[b.key],
      })),
    });

    return container;
  }

  // ================ D-PAD TOUCH IMPLEMENTATION (Circle Style) ================

  function createDpadTouch() {
    const container = document.createElement("div");
    container.className = "dpad-container";

    container.style.cssText = `
        position: absolute;
        left: 30px;
        top: 30px;
        width: ${config.dpadSize || "120px"};
        height: ${config.dpadSize || "120px"};
        pointer-events: auto;
        z-index: ${config.zIndex - 1};
        touch-action: none;
    `;

    // Create wrapper for SVG
    const svgWrapper = document.createElement("div");
    svgWrapper.style.cssText = `
        width: 100%;
        height: 100%;
        position: relative;
        touch-action: none;
    `;

    // Create SVG element
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 10 10");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.style.cssText = `
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        touch-action: none;
    `;

    // Create filter for invert effect (for active state)
    const filter = document.createElementNS(svgNS, "filter");
    filter.id = "dpad-invert";
    const feColorMatrix = document.createElementNS(svgNS, "feColorMatrix");
    feColorMatrix.setAttribute("in", "SourceGraphic");
    feColorMatrix.setAttribute("type", "matrix");
    feColorMatrix.setAttribute(
      "values",
      "-1 0 0 0 1 0 -1 0 0 1 0 0 -1 0 1 0 0 0 1 0"
    );
    filter.appendChild(feColorMatrix);
    svg.appendChild(filter);

    // Create masks for each direction (like A/B/X/Y buttons)
    ["UP", "DOWN", "LEFT", "RIGHT"].forEach((label) => {
      const mask = document.createElementNS(svgNS, "mask");
      mask.id = `dpad-${label}`;

      const rect = document.createElementNS(svgNS, "rect");
      rect.setAttribute("width", "10");
      rect.setAttribute("height", "10");
      rect.setAttribute("fill", "white");

      // Create arrow shape for each direction
      const arrow = document.createElementNS(svgNS, "path");
      arrow.setAttribute("fill", "black");
      arrow.setAttribute("stroke", "none");

      // Different arrow paths for each direction
      switch (label) {
        case "UP":
          arrow.setAttribute("d", "M5,1 L8,7 H7 L7,9 H3 L3,7 H2 Z");
          break;
        case "DOWN":
          arrow.setAttribute("d", "M5,9 L8,3 H7 L7,1 H3 L3,3 H2 Z");
          break;
        case "LEFT":
          arrow.setAttribute("d", "M1,5 L7,8 V7 L9,7 V3 L7,3 V2 Z");
          break;
        case "RIGHT":
          arrow.setAttribute("d", "M9,5 L3,8 V7 L1,7 V3 L3,3 V2 Z");
          break;
      }

      mask.appendChild(rect);
      mask.appendChild(arrow);
      svg.appendChild(mask);
    });

    // Create style element
    const style = document.createElementNS(svgNS, "style");
    style.textContent = `
        #dpad-cluster { 
            opacity: 1;
            fill: #333333;
        }
        #dpad-buttons { 
            opacity: 1;
            fill: lightGray;
        }
        #dpad-buttons > * {
            transform-origin: 5px 5px;
            transform-box: fill-box;
        }
        #dpad-buttons > :nth-child(1) { transform: rotate(270deg) translate(2.7px) rotate(-270deg) scale(0.33); } /* DOWN */
        #dpad-buttons > :nth-child(2) { transform: rotate(90deg) translate(2.7px) rotate(-90deg) scale(0.33); } /* UP */
        #dpad-buttons > :nth-child(3) { transform: rotate(180deg) translate(2.7px) rotate(-180deg) scale(0.33); } /* LEFT */
        #dpad-buttons > :nth-child(4) { transform: rotate(0deg) translate(2.7px) rotate(0deg) scale(0.33); } /* RIGHT */
        .dpad-pressed { 
            filter: url(#dpad-invert);
        }
        circle { 
            pointer-events: visible; 
            cursor: pointer; 
            touch-action: none;
        }
    `;
    svg.appendChild(style);

    // Create main group
    const g = document.createElementNS(svgNS, "g");

    // Cluster circle
    const clusterCircle = document.createElementNS(svgNS, "circle");
    clusterCircle.id = "dpad-cluster";
    clusterCircle.setAttribute("cx", "5");
    clusterCircle.setAttribute("cy", "5");
    clusterCircle.setAttribute("r", "5");
    clusterCircle.setAttribute("fill", "white");

    // Buttons group
    const buttonsGroup = document.createElementNS(svgNS, "g");
    buttonsGroup.id = "dpad-buttons";

    // Create D-Pad buttons (4 circles with arrow masks)
    ["UP", "DOWN", "LEFT", "RIGHT"].forEach((maskId, index) => {
      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", "5");
      circle.setAttribute("cy", "5");
      circle.setAttribute("r", "5");
      circle.setAttribute("mask", `url(#dpad-${maskId})`);
      circle.setAttribute("fill", "#666666");
      circle.dataset.index = index;
      circle.dataset.key = `BUTTON_DPAD_${maskId}`;
      circle.dataset.direction = maskId.toLowerCase();
      buttonsGroup.appendChild(circle);
    });

    g.appendChild(clusterCircle);
    g.appendChild(buttonsGroup);
    svg.appendChild(g);
    svgWrapper.appendChild(svg);
    container.appendChild(svgWrapper);

    // State tracking
    const buttonStates = {
      0: { pressed: false, value: 0, element: null }, // UP
      1: { pressed: false, value: 0, element: null }, // DOWN
      2: { pressed: false, value: 0, element: null }, // LEFT
      3: { pressed: false, value: 0, element: null }, // RIGHT
    };

    // Get all button elements
    const buttons = svg.querySelectorAll("#dpad-buttons > circle");
    buttons.forEach((button, index) => {
      buttonStates[index].element = button;
    });

    // Button mappings
    const buttonMappings = [
      currentProfile.mappings.BUTTON_DPAD_UP,
      currentProfile.mappings.BUTTON_DPAD_DOWN,
      currentProfile.mappings.BUTTON_DPAD_LEFT,
      currentProfile.mappings.BUTTON_DPAD_RIGHT,
    ];

    // Button names for logging
    const buttonNames = ["DPAD_UP", "DPAD_DOWN", "DPAD_LEFT", "DPAD_RIGHT"];
    const directionNames = ["Up", "Down", "Left", "Right"];

    // Function to update button state
    function updateButton(index, value) {
      const state = buttonStates[index];
      if (state.value === value) return;

      state.value = value;
      state.pressed = value > 0;

      // Update visual state
      if (state.pressed) {
        state.element.classList.add("dpad-pressed");
      } else {
        state.element.classList.remove("dpad-pressed");
      }

      // Trigger key events
      const mapping = buttonMappings[index];
      if (mapping) {
        if (state.pressed) {
          sendKeyEvent(mapping, "down");
          logButtonEvent(buttonNames[index], "pressed", mapping);
          logDebug(`D-Pad ${directionNames[index]} PRESSED`, {
            direction: directionNames[index],
            mapping: mapping,
          });
        } else {
          sendKeyEvent(mapping, "up");
          logButtonEvent(buttonNames[index], "released", mapping);
          logDebug(`D-Pad ${directionNames[index]} RELEASED`, {
            direction: directionNames[index],
            mapping: mapping,
          });
        }
      }
    }

    // Track active touches
    let activeTouches = new Map();

    // Get the actual transformed positions from the DOM
    function getTransformedButtonPositions() {
      const positions = [];
      const buttons = svg.querySelectorAll("#dpad-buttons > circle");

      buttons.forEach((button, index) => {
        // Get the actual screen position of the transformed circle
        const rect = button.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const radius = rect.width / 2;

        positions.push({
          centerX,
          centerY,
          radius,
          button: button,
          index: index,
          direction: directionNames[index],
        });

        logDebug(`D-Pad ${directionNames[index]} ACTUAL position:`, {
          direction: directionNames[index],
          centerX: centerX.toFixed(1),
          centerY: centerY.toFixed(1),
          radius: radius.toFixed(1),
          bounds: {
            left: rect.left.toFixed(1),
            top: rect.top.toFixed(1),
            right: rect.right.toFixed(1),
            bottom: rect.bottom.toFixed(1),
          },
        });
      });

      return positions;
    }

    // Simple hit test using actual DOM positions
    function getButtonAtScreenPosition(screenX, screenY) {
      const positions = getTransformedButtonPositions();

      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        const distance = Math.sqrt(
          Math.pow(screenX - pos.centerX, 2) +
            Math.pow(screenY - pos.centerY, 2)
        );

        if (distance <= pos.radius) {
          return i;
        }
      }

      return -1;
    }

    // Handle pointer events
    function handlePointerStart(screenX, screenY, identifier = null) {
      const buttonIndex = getButtonAtScreenPosition(screenX, screenY);

      if (buttonIndex !== -1) {
        if (identifier !== null) {
          activeTouches.set(identifier, buttonIndex);
        }
        updateButton(buttonIndex, 1);

        logDebug(`D-Pad START on ${directionNames[buttonIndex]}`, {
          direction: directionNames[buttonIndex],
          screenX: screenX.toFixed(1),
          screenY: screenY.toFixed(1),
          method: identifier !== null ? "touch" : "mouse",
        });
      }
    }

    function handlePointerEnd(identifier = null) {
      if (identifier !== null) {
        // For touch
        if (activeTouches.has(identifier)) {
          const buttonIndex = activeTouches.get(identifier);
          updateButton(buttonIndex, 0);
          activeTouches.delete(identifier);
        }
      } else {
        // For mouse - release all pressed buttons
        for (let i = 0; i < 4; i++) {
          if (buttonStates[i].pressed) {
            updateButton(i, 0);
          }
        }
      }
    }

    // Touch events
    svg.addEventListener("touchstart", (e) => {
      e.preventDefault();
      e.stopPropagation();

      Array.from(e.changedTouches).forEach((touch) => {
        handlePointerStart(touch.clientX, touch.clientY, touch.identifier);
      });
    });

    svg.addEventListener("touchmove", (e) => {
      e.preventDefault();
      e.stopPropagation();

      Array.from(e.changedTouches).forEach((touch) => {
        const touchId = touch.identifier;
        if (!activeTouches.has(touchId)) return;

        const buttonIndex = activeTouches.get(touchId);
        // Check if still over the same button
        const currentButtonIndex = getButtonAtScreenPosition(
          touch.clientX,
          touch.clientY
        );
        if (currentButtonIndex !== buttonIndex) {
          // Moved out of button
          updateButton(buttonIndex, 0);
          activeTouches.delete(touchId);
        }
      });
    });

    svg.addEventListener("touchend", (e) => {
      e.preventDefault();
      e.stopPropagation();

      Array.from(e.changedTouches).forEach((touch) => {
        handlePointerEnd(touch.identifier);
      });
    });

    svg.addEventListener("touchcancel", (e) => {
      e.preventDefault();
      e.stopPropagation();

      Array.from(e.changedTouches).forEach((touch) => {
        handlePointerEnd(touch.identifier);
      });
    });

    // Mouse events
    svg.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handlePointerStart(e.clientX, e.clientY);
    });

    svg.addEventListener("mouseup", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handlePointerEnd();
    });

    svg.addEventListener("mouseleave", (e) => {
      handlePointerEnd();
    });

    logDebug("D-Pad touch controls created (circle style)", {
      size: config.dpadSize || "120px",
      position: "top-left",
      style: "circle-masked",
      mappings: {
        up: currentProfile.mappings.BUTTON_DPAD_UP,
        down: currentProfile.mappings.BUTTON_DPAD_DOWN,
        left: currentProfile.mappings.BUTTON_DPAD_LEFT,
        right: currentProfile.mappings.BUTTON_DPAD_RIGHT,
      },
    });

    return container;
  }

  function enableTouchTrackpad() {
    if (window.touchTrackpad) {
      window.touchTrackpad.enable();
      logDebug("Touch trackpad enabled from toggle");
      return true;
    }
    logDebug("Touch trackpad not available");
    return false;
  }

  function disableTouchTrackpad() {
    if (window.touchTrackpad) {
      window.touchTrackpad.disable();
      logDebug("Touch trackpad disabled");
      return true;
    }
    return false;
  }

  function toggleVirtualGamepad() {
    isEnabled = !isEnabled;

    if (isEnabled) {
      enableTouchTrackpad();
      createTouchControls();
      enableButton.innerHTML = "🎮";
      enableButton.title = "Disable Virtual Gamepad";
      enableButton.style.background = "rgba(0, 170, 0, 0.8)";
      enableButton.style.borderColor = "#00ff00";

      logDebug("Virtual Gamepad ENABLED", {
        profile: config.defaultProfile,
        joysticks: 2,
        buttons: 10,
        mobileKeyboard: config.enableMobileKeyboardSupport,
      });

      showQuickHelp();
    } else {
      if (overlay) {
        overlay.remove();
        overlay = null;
      }
      enableButton.innerHTML = config.enableButtonText;
      enableButton.title = "Enable Virtual Gamepad";
      enableButton.style.background = "rgba(0, 0, 0, 0.8)";
      enableButton.style.borderColor = "#00aaff";

      // Release all pressed keys
      pressedKeys.forEach((key) => {
        sendKeyEvent(key, "up");
      });
      pressedKeys.clear();

      mouseButtons.clear();

      logDebug("Virtual Gamepad DISABLED", {
        releasedKeys: pressedKeys.size,
        timestamp: Date.now(),
      });
    }
  }

  function showQuickHelp() {
    const help = document.createElement("div");
    help.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            border: 2px solid #00aaff;
            z-index: ${config.zIndex + 500};
            font-family: Arial, sans-serif;
            max-width: 80%;
            text-align: center;
            animation: fadeOut 3s forwards;
        `;

    help.innerHTML = `
            <h3 style="margin-top: 0">🎮 Virtual Gamepad Enabled!</h3>
            <p>• Left Stick: Movement (WASD)</p>
            <p>• Right Stick: Mouse Look</p>
            <p>• Buttons: ABXY, Bumpers, Triggers</p>
            <p>• Double-tap sticks: L3/R3 clicks</p>
            <p style="font-size: 12px; color: #aaa; margin-top: 15px">
                Click ⚙️ button to calibrate key mappings<br>
                Check console for detailed input logging
            </p>
        `;

    document.body.appendChild(help);
    setTimeout(() => help.remove(), 3000);
    logDebug("Quick help displayed");
  }

  // ================ TOUCH-TO-MOUSE TRACKPAD IMPLEMENTATION ================

  function createTouchToMouseTrackpad() {
    const trackpad = document.createElement("div");
    trackpad.id = "touch-to-mouse-trackpad";

    trackpad.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        pointer-events: auto;
        touch-action: none;
        z-index: ${config.zIndex - 2};
        display: none;
        opacity: 1;
    `;

    document.body.appendChild(trackpad);

    // Configuration for touch-to-mouse behavior
    const trackpadConfig = {
      longPressDelay: 650, // ms - time for right-click activation
      longPressMoveThreshold: 0.01, // % of screen - max movement for right-click
      doubleTapDeadZoneTime: 250, // ms - time between taps for double-tap
      doubleTapMoveThreshold: 0.025, // % of screen - max movement for double-tap
      moveConfirmationThreshold: 5, // pixels - movement needed to confirm drag
      scrollSensitivity: 10,
      referenceWidth: 1280,
      referenceHeight: 720,
      enableTwoFingerScroll: true,
      showTouchFeedback: true,
    };

    // State tracking
    let activeTouches = new Map();
    let lastTouchDown = { timestamp: 0, x: 0, y: 0 };
    let lastTouchUp = { timestamp: 0, x: 0, y: 0 };
    let touchMoved = false;
    let isDragging = false;
    let longPressTimer = null;
    let dragStartTimer = null;
    let peakTouchCount = 0;
    let originalTouchLocation = { x: 0, y: 0 };
    let lastAveragePosition = { x: 0, y: 0 };

    // Create touch feedback element (visual indicator of touch position)
    let touchFeedback = null;
    if (trackpadConfig.showTouchFeedback) {
      touchFeedback = document.createElement("div");
      touchFeedback.id = "touch-feedback";
      touchFeedback.style.cssText = `
            position: fixed;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            border: 2px solid rgba(255, 255, 255, 0.6);
            pointer-events: none;
            z-index: ${config.zIndex - 1};
            display: none;
            transform: translate(-50%, -50%);
            transition: width 0.1s, height 0.1s, opacity 0.2s;
            box-shadow: 0 0 15px rgba(0, 150, 255, 0.5);
        `;
      document.body.appendChild(touchFeedback);
    }

    // Calculate relative position (0-1)
    function getRelativePosition(screenX, screenY) {
      const rect = trackpad.getBoundingClientRect();
      return {
        x: (screenX - rect.left) / rect.width,
        y: (screenY - rect.top) / rect.height,
      };
    }

    // Calculate distance between two relative positions
    function getRelativeDistance(pos1, pos2) {
      return Math.sqrt(
        Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
      );
    }

    // Show touch feedback at position
    function showTouchFeedback(x, y, isMultiTouch = false) {
      if (!touchFeedback || !trackpadConfig.showTouchFeedback) return;

      touchFeedback.style.left = x + "px";
      touchFeedback.style.top = y + "px";
      touchFeedback.style.display = "block";
      touchFeedback.style.width = isMultiTouch ? "60px" : "40px";
      touchFeedback.style.height = isMultiTouch ? "60px" : "40px";
      touchFeedback.style.background = isMultiTouch
        ? "rgba(255, 100, 100, 0.3)"
        : "rgba(255, 255, 255, 0.3)";
      touchFeedback.style.borderColor = isMultiTouch
        ? "rgba(255, 100, 100, 0.6)"
        : "rgba(255, 255, 255, 0.6)";
    }

    // Hide touch feedback
    function hideTouchFeedback() {
      if (!touchFeedback) return;
      touchFeedback.style.display = "none";
    }

    // Send mouse button event
    function sendMouseButton(button, action) {
      const eventType = action === "press" ? "mousedown" : "mouseup";
      const buttonMap = {
        left: 0,
        middle: 1,
        right: 2,
      };

      const event = new MouseEvent(eventType, {
        button: buttonMap[button],
        buttons: action === "press" ? 1 : 0,
        bubbles: true,
        cancelable: true,
        clientX: lastTouchDown.x,
        clientY: lastTouchDown.y,
      });

      logDebug(`Trackpad: ${button.toUpperCase()} mouse ${action}`, {
        position: { x: lastTouchDown.x, y: lastTouchDown.y },
        button: button,
        action: action,
      });

      document.dispatchEvent(event);
    }

    // Send mouse move event
    function sendMouseMove(deltaX, deltaY) {
      const event = new MouseEvent("mousemove", {
        movementX: deltaX,
        movementY: deltaY,
        bubbles: true,
        cancelable: true,
      });

      logDebug(`Trackpad: Mouse move`, {
        deltaX: deltaX,
        deltaY: deltaY,
      });

      document.dispatchEvent(event);
    }

    // Send scroll event
    function sendScroll(deltaY) {
      const event = new WheelEvent("wheel", {
        deltaY: deltaY,
        deltaMode: 0, // pixels
        bubbles: true,
        cancelable: true,
      });

      logDebug(`Trackpad: Scroll`, {
        deltaY: deltaY,
      });

      document.dispatchEvent(event);
    }

    // Start long press timer for right-click
    function startLongPressTimer() {
      if (longPressTimer) clearTimeout(longPressTimer);

      longPressTimer = setTimeout(() => {
        logDebug("Trackpad: Long press detected - right click");
        // Release left click and press right click
        sendMouseButton("left", "release");
        sendMouseButton("right", "press");
      }, trackpadConfig.longPressDelay);
    }

    // Cancel long press timer
    function cancelLongPressTimer() {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }

    // Start drag timer
    function startDragTimer() {
      if (dragStartTimer) clearTimeout(dragStartTimer);

      dragStartTimer = setTimeout(() => {
        if (!touchMoved && !isDragging) {
          logDebug("Trackpad: Drag start detected");
          isDragging = true;
          sendMouseButton("left", "press");
        }
      }, 650); // Same as iOS implementation
    }

    // Cancel drag timer
    function cancelDragTimer() {
      if (dragStartTimer) {
        clearTimeout(dragStartTimer);
        dragStartTimer = null;
      }
    }

    // Check if movement is confirmed (not just tremor)
    function isConfirmedMove(currentX, currentY, originalX, originalY) {
      const distance = Math.sqrt(
        Math.pow(currentX - originalX, 2) + Math.pow(currentY - originalY, 2)
      );
      return distance >= trackpadConfig.moveConfirmationThreshold;
    }

    // Calculate average position of all touches
    function getAverageTouchPosition() {
      if (activeTouches.size === 0) return null;

      let sumX = 0;
      let sumY = 0;
      let count = 0;

      for (const touch of activeTouches.values()) {
        sumX += touch.clientX;
        sumY += touch.clientY;
        count++;
      }

      return {
        x: sumX / count,
        y: sumY / count,
      };
    }

    // Event handlers
    function handleTouchStart(e) {
      e.preventDefault();
      e.stopPropagation();

      const touches = Array.from(e.changedTouches);
      const totalTouches = e.touches.length;

      // Update peak touch count
      peakTouchCount = Math.max(peakTouchCount, totalTouches);

      // Store all active touches
      touches.forEach((touch) => {
        activeTouches.set(touch.identifier, {
          clientX: touch.clientX,
          clientY: touch.clientY,
          startX: touch.clientX,
          startY: touch.clientY,
        });
      });

      // Handle different touch counts
      if (totalTouches === 1) {
        const touch = touches[0];
        const relPos = getRelativePosition(touch.clientX, touch.clientY);

        // Check double-tap deadzone
        const now = Date.now();
        const timeSinceLastUp = now - lastTouchUp.timestamp;
        const distanceFromLastUp = getRelativeDistance(
          relPos,
          getRelativePosition(lastTouchUp.x, lastTouchUp.y)
        );

        if (
          timeSinceLastUp > trackpadConfig.doubleTapDeadZoneTime ||
          distanceFromLastUp > trackpadConfig.doubleTapMoveThreshold
        ) {
          // Move cursor to touch position
          lastTouchDown = {
            timestamp: now,
            x: touch.clientX,
            y: touch.clientY,
          };
          originalTouchLocation = { x: touch.clientX, y: touch.clientY };

          // Show touch feedback
          showTouchFeedback(touch.clientX, touch.clientY);
        }

        // Press left mouse button
        sendMouseButton("left", "press");

        // Start long press timer for right-click
        startLongPressTimer();

        // Start drag timer
        startDragTimer();

        touchMoved = false;
      } else if (totalTouches === 2 && trackpadConfig.enableTwoFingerScroll) {
        // Two-finger touch for scrolling
        const avgPos = getAverageTouchPosition();
        if (avgPos) {
          lastAveragePosition = avgPos;
          originalTouchLocation = { x: avgPos.x, y: avgPos.y };
          showTouchFeedback(avgPos.x, avgPos.y, true);
        }

        // Cancel long press since this is multi-touch
        cancelLongPressTimer();
        cancelDragTimer();
      }

      logDebug(`Trackpad: Touch start`, {
        touchCount: totalTouches,
        activeTouches: activeTouches.size,
        peakTouchCount: peakTouchCount,
      });
    }

    function handleTouchMove(e) {
      e.preventDefault();
      e.stopPropagation();

      const totalTouches = e.touches.length;

      // Update active touches
      Array.from(e.touches).forEach((touch) => {
        const existing = activeTouches.get(touch.identifier);
        if (existing) {
          existing.clientX = touch.clientX;
          existing.clientY = touch.clientY;
        }
      });

      if (totalTouches === 1) {
        const touch = Array.from(e.touches)[0];
        const storedTouch = activeTouches.get(touch.identifier);

        if (storedTouch) {
          // Check if moved too far for long press
          const relPos = getRelativePosition(touch.clientX, touch.clientY);
          const startRelPos = getRelativePosition(
            storedTouch.startX,
            storedTouch.startY
          );
          const distance = getRelativeDistance(relPos, startRelPos);

          if (distance > trackpadConfig.longPressMoveThreshold) {
            cancelLongPressTimer();
          }

          // Calculate movement delta
          const deltaX =
            (touch.clientX - lastTouchDown.x) *
            (trackpadConfig.referenceWidth / window.innerWidth);
          const deltaY =
            (touch.clientY - lastTouchDown.y) *
            (trackpadConfig.referenceHeight / window.innerHeight);

          if (deltaX !== 0 || deltaY !== 0) {
            // Send mouse movement
            sendMouseMove(deltaX, deltaY);

            // Update last position
            lastTouchDown.x = touch.clientX;
            lastTouchDown.y = touch.clientY;

            // Check if movement is confirmed
            if (
              isConfirmedMove(
                touch.clientX,
                touch.clientY,
                originalTouchLocation.x,
                originalTouchLocation.y
              )
            ) {
              touchMoved = true;
            }
          }

          // Update touch feedback
          showTouchFeedback(touch.clientX, touch.clientY);
        }
      } else if (totalTouches === 2 && trackpadConfig.enableTwoFingerScroll) {
        const avgPos = getAverageTouchPosition();
        if (avgPos && lastAveragePosition) {
          // Calculate scroll delta
          const scrollDelta =
            (avgPos.y - lastAveragePosition.y) *
            trackpadConfig.scrollSensitivity;

          if (scrollDelta !== 0) {
            sendScroll(scrollDelta);
          }

          // Check if movement is confirmed
          if (
            isConfirmedMove(
              avgPos.x,
              avgPos.y,
              originalTouchLocation.x,
              originalTouchLocation.y
            )
          ) {
            touchMoved = true;
          }

          // Update touch feedback
          showTouchFeedback(avgPos.x, avgPos.y, true);
          lastAveragePosition = avgPos;
        }
      }
    }

    function handleTouchEnd(e) {
      e.preventDefault();
      e.stopPropagation();

      const totalTouches = e.touches.length;
      const endedTouches = Array.from(e.changedTouches);

      // Remove ended touches
      endedTouches.forEach((touch) => {
        activeTouches.delete(touch.identifier);
      });

      // Cancel timers
      cancelLongPressTimer();
      cancelDragTimer();

      if (totalTouches === 0) {
        // All touches ended

        if (isDragging) {
          isDragging = false;
          sendMouseButton("left", "release");
        } else if (!touchMoved) {
          // Single tap behavior
          if (peakTouchCount === 2) {
            // Two-finger tap = right click
            logDebug("Trackpad: Two-finger tap - right click");
            sendMouseButton("right", "press");
            setTimeout(() => sendMouseButton("right", "release"), 100);
          } else if (peakTouchCount === 1) {
            // Single tap = left click
            logDebug("Trackpad: Single tap - left click");
            if (!isDragging) {
              sendMouseButton("left", "press");
              setTimeout(() => sendMouseButton("left", "release"), 100);
            }
            isDragging = false;
            sendMouseButton("left", "release");
          }
        }

        // Always release buttons
        sendMouseButton("left", "release");
        sendMouseButton("right", "release");

        // Store last touch up for double-tap detection
        if (endedTouches.length > 0) {
          const touch = endedTouches[0];
          lastTouchUp = {
            timestamp: Date.now(),
            x: touch.clientX,
            y: touch.clientY,
          };
        }

        // Hide touch feedback
        hideTouchFeedback();

        // Reset state
        peakTouchCount = 0;
        touchMoved = false;

        logDebug("Trackpad: All touches ended", {
          wasDragging: isDragging,
          touchMoved: touchMoved,
          peakTouchCount: peakTouchCount,
        });
      } else if (totalTouches === 1) {
        // Moving from 2+ touches to 1
        const remainingTouch = Array.from(e.touches)[0];
        const storedTouch = activeTouches.get(remainingTouch.identifier);

        if (storedTouch) {
          lastTouchDown.x = storedTouch.clientX;
          lastTouchDown.y = storedTouch.clientY;

          // Mark as moved to prevent accidental click
          touchMoved = true;

          // Update touch feedback
          showTouchFeedback(storedTouch.clientX, storedTouch.clientY);
        }
      }
    }

    function handleTouchCancel(e) {
      // Treat same as touch end
      handleTouchEnd(e);
    }

    // Add event listeners
    trackpad.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    trackpad.addEventListener("touchmove", handleTouchMove, { passive: false });
    trackpad.addEventListener("touchend", handleTouchEnd, { passive: false });
    trackpad.addEventListener("touchcancel", handleTouchCancel, {
      passive: false,
    });

    // Public methods
    trackpad.enable = function () {
      trackpad.style.display = "block";
      logDebug("Touch-to-mouse trackpad ENABLED");
    };

    trackpad.disable = function () {
      trackpad.style.display = "none";

      // Clean up any active state
      cancelLongPressTimer();
      cancelDragTimer();
      activeTouches.clear();
      hideTouchFeedback();

      // Release any held buttons
      if (isDragging) {
        sendMouseButton("left", "release");
        isDragging = false;
      }
      sendMouseButton("right", "release");

      logDebug("Touch-to-mouse trackpad DISABLED");
    };

    trackpad.isEnabled = function () {
      return trackpad.style.display === "block";
    };

    trackpad.getConfig = function () {
      return { ...trackpadConfig };
    };

    trackpad.setConfig = function (newConfig) {
      Object.assign(trackpadConfig, newConfig);
      logDebug("Trackpad config updated", newConfig);
    };

    // Clean up function
    trackpad.cleanup = function () {
      trackpad.removeEventListener("touchstart", handleTouchStart);
      trackpad.removeEventListener("touchmove", handleTouchMove);
      trackpad.removeEventListener("touchend", handleTouchEnd);
      trackpad.removeEventListener("touchcancel", handleTouchCancel);

      cancelLongPressTimer();
      cancelDragTimer();

      if (touchFeedback && touchFeedback.parentNode) {
        touchFeedback.parentNode.removeChild(touchFeedback);
      }

      if (trackpad.parentNode) {
        trackpad.parentNode.removeChild(trackpad);
      }
    };

    logDebug("Touch-to-mouse trackpad created", {
      config: trackpadConfig,
      features: [
        "Single finger drag = mouse movement",
        "Single tap = left click",
        "Long press = right click",
        "Two finger drag = scroll",
        "Two finger tap = right click",
        "Visual touch feedback",
      ],
    });

    return trackpad;
  }

  // ================ INITIALIZATION ================

  function init() {
    logDebug("Initializing Virtual Gamepad...", {
      version: "1.0.0",
      debugMode: config.debugMode,
      timestamp: new Date().toISOString(),
    });

    // Load saved configuration
    if (config.saveToLocalStorage) {
      const savedConfig = localStorage.getItem("virtualgamepad_config");
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig);
          config = { ...config, ...parsed };
          logDebug("Loaded saved configuration", parsed);
        } catch (e) {
          console.warn("Failed to load saved config:", e);
        }
      }
    }

    // Load current profile
    switchProfile(config.defaultProfile);

    // Create touch-to-mouse trackpad (but don't enable it yet)
    window.touchTrackpad = createTouchToMouseTrackpad();

    // Create enable button
    // Create top buttons wrapper
    const topButtonsWrapper = createTopButtonsWrapper();

    // Create all top buttons inside the wrapper
    createEnableButton(topButtonsWrapper);
    if (config.showCalibrationButton) {
      createCalibrationButton(topButtonsWrapper);
    }
    createQrButton(topButtonsWrapper);
    // Auto-enable on mobile
    if (config.autoEnableOnTouch && "ontouchstart" in window) {
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      if (isMobile) {
        setTimeout(() => {
          if (!isEnabled) {
            logDebug("Auto-enabling on mobile device");
            toggleVirtualGamepad();
          }
        }, 2000);
      }
    }

    // AUTO-ENABLE CONTROLS ON INITIALIZATION
    setTimeout(() => {
      if (!isEnabled) {
        logDebug("Auto-enabling controls on initialization");
        toggleVirtualGamepad();
      }
    }, 100); // Small delay to ensure DOM is ready

    // Save config on page unload
    window.addEventListener("beforeunload", () => {
      if (config.saveToLocalStorage) {
        localStorage.setItem("virtualgamepad_config", JSON.stringify(config));
        logDebug("Configuration saved to localStorage");
      }
    });

    // Add global event listener for focus on canvas touch
    document.addEventListener("DOMContentLoaded", () => {
      const canvas = document.querySelector("canvas");
      if (canvas && config.enableMobileKeyboardSupport) {
        canvas.addEventListener("touchstart", () => {
          focusMobileTextInput();
        });
        logDebug("Mobile keyboard focus handler attached to canvas");
      }
    });

    logDebug("Virtual Gamepad initialized successfully!", {
      currentProfile: config.defaultProfile,
      buttonCount: Object.keys(currentProfile.mappings).length,
      ready: true,
    });

    console.log(
      "🎮 Virtual Gamepad loaded! Click the controller button to enable."
    );
    console.log(
      "📝 Debug logging is ENABLED - check console for input events."
    );
  }

  // Export public API
  window.VirtualGamepad = {
    enable: () => {
      if (!isEnabled) toggleVirtualGamepad();
    },
    disable: () => {
      if (isEnabled) toggleVirtualGamepad();
    },
    toggleVirtualGamepad: () => {
      toggleVirtualGamepad();
    },
    calibrate: showCalibrationDialog,
    setProfile: switchProfile,
    getConfig: () => ({ ...config }),
    setConfig: (newConfig) => {
      config = { ...config, ...newConfig };
      logDebug("Configuration updated", newConfig);
    },
    getProfiles: () => ({ ...GAME_PROFILES }),
    isEnabled: () => isEnabled,
    getCurrentMappings: () => ({ ...currentProfile.mappings }),
    enableDebug: () => {
      config.debugMode = true;
      logDebug("Debug mode enabled");
    },
    disableDebug: () => {
      config.debugMode = false;
      console.log("🎮 Debug mode disabled");
    },
    enableTouchTrackpad: () => {
      if (window.touchTrackpad) {
        window.touchTrackpad.enable();
        return true;
      }
      return false;
    },
    disableTouchTrackpad: () => {
      if (window.touchTrackpad) {
        window.touchTrackpad.disable();
        return true;
      }
      return false;
    },
    showStatus: () => {
      console.log("=== VIRTUAL GAMEPAD STATUS ===");
      console.log("Enabled:", isEnabled);
      console.log("Profile:", config.defaultProfile);
      console.log("Active Keys:", Array.from(pressedKeys));
      console.log("Mouse Buttons:", Array.from(mouseButtons));
      console.log("Configuration:", config);
      console.log("Current Mappings:", currentProfile.mappings);
      console.log("==============================");
    },
  };

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
