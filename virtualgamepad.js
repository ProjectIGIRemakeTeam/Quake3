// virtualgamepad.js - Complete Touch-to-Keyboard Mapper with Mobile Keyboard Support
// Features: Visual joystick circles, mobile keyboard compatibility, full calibration, detailed logging

(function () {
  ("use strict");

  // Default configuration
  const DEFAULT_CONFIG = {
    zIndex: 99999999,
    buttonSize: "60px",
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
            top: 10px;
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
            max-width: 150px;
            max-height: 200px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-width: 300px;
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
            max-height: 90%;
            overflow-y: auto;
            box-shadow: 0 0 50px rgba(0, 255, 0, 0.5);
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
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 10px;
                margin-bottom: 20px;
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
      "BUTTON_RB",
      "BUTTON_LT",
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
            LB: "Left Bumper",
            RB: "Right Bumper",
            LT: "Left Trigger",
            RT: "Right Trigger",
            L3: "Left Stick Click",
            R3: "Right Stick Click",
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

  // ================ TOUCH CONTROLS UI ================

  function createEnableButton() {
    if (enableButton) return;

    enableButton = document.createElement("button");
    enableButton.innerHTML = config.enableButtonText;
    enableButton.title = "Toggle Virtual Gamepad";
    enableButton.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            width: ${config.buttonSize};
            height: ${config.buttonSize};
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border: 2px solid #00aaff;
            border-radius: 50%;
            font-size: 24px;
            cursor: pointer;
            z-index: ${config.zIndex};
            opacity: 0.9;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        `;

    enableButton.addEventListener("click", toggleVirtualGamepad);
    enableButton.addEventListener("touchstart", (e) => {
      e.preventDefault();
      toggleVirtualGamepad();
    });

    document.body.appendChild(enableButton);

    if (config.showCalibrationButton) {
      createCalibrationButton();
    }

    logDebug("Enable button created");
  }

  function createCalibrationButton() {
    const calButton = document.createElement("button");
    calButton.innerHTML = "⚙️";
    calButton.title = "Calibrate Controls";
    calButton.style.cssText = `
            position: fixed;
            top: 20px;
            left: calc(${config.buttonSize} + 30px);
            width: 40px;
            height: 40px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border: 2px solid #ffaa00;
            border-radius: 50%;
            font-size: 18px;
            cursor: pointer;
            z-index: ${config.zIndex};
            opacity: 0.9;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        `;

    calButton.addEventListener("click", showCalibrationDialog);
    calButton.addEventListener("touchstart", (e) => {
      e.preventDefault();
      showCalibrationDialog();
    });

    document.body.appendChild(calButton);
    logDebug("Calibration button created");
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

    // In createTouchControls function, after creating leftJoystick:
    const dpad = createDpadTouch();
    //
    // append on screen buttons
    overlay.appendChild(leftJoystick);
    overlay.appendChild(rightJoystick);
    overlay.appendChild(buttonCluster);
    overlay.appendChild(dpad);
    overlay.appendChild(systemButtons);

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

    let activeTouch = null;
    let lastTapTime = 0;
    let tapCount = 0;
    let tapTimeout = null;
    let isDoubleTapGesture = false;
    const maxDistance = parseFloat(config.joystickSize) * 0.3; // 30% of joystick size

    // Track which keys are currently pressed (for left joystick)
    let activeKeys = {
      up: false,
      down: false,
      left: false,
      right: false,
    };

    // Track last processed position for smooth updates
    let lastPosition = { x: 0, y: 0 };

    // Mouse movement tracking (for right joystick)
    let mouseMovementInterval = null;
    let currentMouseDelta = { x: 0, y: 0 };
    let mouseMovementActive = false;
    let lastMouseValues = { x: 0, y: 0 };

    function updateJoystick(touch) {
      if (!activeTouch) return;

      // If we're in double-tap gesture mode, ignore movement
      if (isDoubleTapGesture) return;

      const rect = joystickArea.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const maxDist = rect.width / 2 - (rect.width * 0.4) / 2;

      const touchX = touch.clientX - centerX;
      const touchY = touch.clientY - centerY;

      // Calculate distance from center
      const distance = Math.sqrt(touchX * touchX + touchY * touchY);

      // Normalize position (-1 to 1)
      let normX = touchX / maxDist;
      let normY = touchY / maxDist;

      // Clamp to circle
      if (distance > maxDist) {
        normX = (touchX / distance) * 1;
        normY = (touchY / distance) * 1;
      }

      // Apply deadzone
      const threshold = config.joystickDeadZone;
      const applyDeadzone = (value) => {
        if (Math.abs(value) < threshold) return 0;
        // Scale from deadzone to 1
        return (
          Math.sign(value) * ((Math.abs(value) - threshold) / (1 - threshold))
        );
      };

      normX = applyDeadzone(normX);
      normY = applyDeadzone(normY);

      // Update nub position with smooth animation
      nub.style.transform = `translate(-50%, -50%) translate(${
        normX * maxDist
      }px, ${normY * maxDist}px)`;

      // Trigger actions (with position change check)
      if (
        Math.abs(normX - lastPosition.x) > 0.01 ||
        Math.abs(normY - lastPosition.y) > 0.01
      ) {
        triggerJoystickAction(side, normX, normY);
        lastPosition = { x: normX, y: normY };
      }

      logJoystickEvent(side, type, normX, normY, [
        `X: ${normX.toFixed(3)}`,
        `Y: ${normY.toFixed(3)}`,
        `Distance: ${distance.toFixed(1)}px`,
      ]);
    }

    function triggerJoystickAction(side, x, y) {
      const actions = [];

      if (side === "left") {
        // Movement joystick - continuous key holding with proper diagonal support

        // Calculate direction intensities
        const upIntensity = Math.max(0, -y); // Negative y = up
        const downIntensity = Math.max(0, y); // Positive y = down
        const leftIntensity = Math.max(0, -x); // Negative x = left
        const rightIntensity = Math.max(0, x); // Positive x = right

        // Define threshold for activation (lower than deadzone for smooth transitions)
        const activationThreshold = 0.1;

        // Update UP key
        const shouldPressUp = upIntensity > activationThreshold;
        if (shouldPressUp !== activeKeys.up) {
          if (shouldPressUp) {
            sendKeyEvent(
              currentProfile.mappings.JOYSTICK_LEFT_UP || "w",
              "down"
            );
            actions.push("UP: PRESSED");
          } else {
            sendKeyEvent(currentProfile.mappings.JOYSTICK_LEFT_UP || "w", "up");
            actions.push("UP: RELEASED");
          }
          activeKeys.up = shouldPressUp;
        }

        // Update DOWN key
        const shouldPressDown = downIntensity > activationThreshold;
        if (shouldPressDown !== activeKeys.down) {
          if (shouldPressDown) {
            sendKeyEvent(
              currentProfile.mappings.JOYSTICK_LEFT_DOWN || "s",
              "down"
            );
            actions.push("DOWN: PRESSED");
          } else {
            sendKeyEvent(
              currentProfile.mappings.JOYSTICK_LEFT_DOWN || "s",
              "up"
            );
            actions.push("DOWN: RELEASED");
          }
          activeKeys.down = shouldPressDown;
        }

        // Update LEFT key
        const shouldPressLeft = leftIntensity > activationThreshold;
        if (shouldPressLeft !== activeKeys.left) {
          if (shouldPressLeft) {
            sendKeyEvent(
              currentProfile.mappings.JOYSTICK_LEFT_LEFT || "a",
              "down"
            );
            actions.push("LEFT: PRESSED");
          } else {
            sendKeyEvent(
              currentProfile.mappings.JOYSTICK_LEFT_LEFT || "a",
              "up"
            );
            actions.push("LEFT: RELEASED");
          }
          activeKeys.left = shouldPressLeft;
        }

        // Update RIGHT key
        const shouldPressRight = rightIntensity > activationThreshold;
        if (shouldPressRight !== activeKeys.right) {
          if (shouldPressRight) {
            sendKeyEvent(
              currentProfile.mappings.JOYSTICK_LEFT_RIGHT || "d",
              "down"
            );
            actions.push("RIGHT: PRESSED");
          } else {
            sendKeyEvent(
              currentProfile.mappings.JOYSTICK_LEFT_RIGHT || "d",
              "up"
            );
            actions.push("RIGHT: RELEASED");
          }
          activeKeys.right = shouldPressRight;
        }

        // Log current state
        if (activeKeys.up && activeKeys.left) actions.push("DIAGONAL: UP-LEFT");
        if (activeKeys.up && activeKeys.right)
          actions.push("DIAGONAL: UP-RIGHT");
        if (activeKeys.down && activeKeys.left)
          actions.push("DIAGONAL: DOWN-LEFT");
        if (activeKeys.down && activeKeys.right)
          actions.push("DIAGONAL: DOWN-RIGHT");
      } else {
        // Right joystick - smooth mouse look
        currentMouseDelta.x = x;
        currentMouseDelta.y = y;

        // Check if we should start/stop mouse movement
        const shouldMove = Math.abs(x) > 0.01 || Math.abs(y) > 0.01;

        if (shouldMove && !mouseMovementActive) {
          startMouseMovement();
          mouseMovementActive = true;
          actions.push("MOUSE: STARTED");
        } else if (!shouldMove && mouseMovementActive) {
          stopMouseMovement();
          mouseMovementActive = false;
          actions.push("MOUSE: STOPPED");
        }

        if (mouseMovementActive) {
          actions.push(`MOUSE_DELTA: X=${x.toFixed(3)}, Y=${y.toFixed(3)}`);
        }
      }

      return actions;
    }

    function startMouseMovement() {
      // Clear any existing interval
      if (mouseMovementInterval) {
        clearInterval(mouseMovementInterval);
      }

      // Start sending mouse movement events
      mouseMovementInterval = setInterval(() => {
        // Only send if values have changed significantly
        if (
          Math.abs(currentMouseDelta.x - lastMouseValues.x) > 0.001 ||
          Math.abs(currentMouseDelta.y - lastMouseValues.y) > 0.001
        ) {
          const sensitivity = config.mouseLookSensitivity * 8;
          const deltaX = currentMouseDelta.x * sensitivity;
          const deltaY = currentMouseDelta.y * sensitivity;

          simulateMouseMove(deltaX, deltaY);
          lastMouseValues = { x: currentMouseDelta.x, y: currentMouseDelta.y };

          logDebug("Mouse movement emulated", {
            deltaX: deltaX.toFixed(2),
            deltaY: deltaY.toFixed(2),
            rawX: currentMouseDelta.x.toFixed(3),
            rawY: currentMouseDelta.y.toFixed(3),
          });
        }
      }, 16); // ~60fps
    }

    function stopMouseMovement() {
      if (mouseMovementInterval) {
        clearInterval(mouseMovementInterval);
        mouseMovementInterval = null;
      }
      // Don't reset currentMouseDelta - keep last position for smooth transitions
      logDebug("Mouse movement stopped");
    }

    function resetJoystick() {
      // Smooth return to center
      nub.style.transition =
        "transform 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)";
      nub.style.transform = "translate(-50%, -50%)";

      setTimeout(() => {
        nub.style.transition =
          "transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      }, 300);

      if (side === "left") {
        // Release all active keys for left stick
        if (activeKeys.up) {
          sendKeyEvent(currentProfile.mappings.JOYSTICK_LEFT_UP || "w", "up");
          activeKeys.up = false;
        }
        if (activeKeys.down) {
          sendKeyEvent(currentProfile.mappings.JOYSTICK_LEFT_DOWN || "s", "up");
          activeKeys.down = false;
        }
        if (activeKeys.left) {
          sendKeyEvent(currentProfile.mappings.JOYSTICK_LEFT_LEFT || "a", "up");
          activeKeys.left = false;
        }
        if (activeKeys.right) {
          sendKeyEvent(
            currentProfile.mappings.JOYSTICK_LEFT_RIGHT || "d",
            "up"
          );
          activeKeys.right = false;
        }
      } else {
        // Smoothly stop mouse movement for right stick
        stopMouseMovement();
        mouseMovementActive = false;
        lastMouseValues = { x: 0, y: 0 };
      }

      // Reset tracking
      lastPosition = { x: 0, y: 0 };
      isDoubleTapGesture = false;

      logJoystickEvent(side, type, 0, 0, ["RESET"]);
      activeTouch = null;
    }

    // Handle double-tap detection
    function handleTouchStart(e) {
      e.preventDefault();
      if (activeTouch) return;

      const touch = e.touches[0];
      const now = Date.now();

      // Check for double-tap
      if (
        config.clickableThumbsticks &&
        now - lastTapTime < config.doubleTapThreshold
      ) {
        // Second tap detected - this is a double-tap
        isDoubleTapGesture = true;

        // Clear any pending timeout
        if (tapTimeout) {
          clearTimeout(tapTimeout);
          tapTimeout = null;
        }

        // Trigger L3/R3 click
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
          setTimeout(() => sendKeyEvent(mapping, "up"), 50);

          logDebug("Thumbstick double-tap click", {
            side: side,
            button: button,
            mapping: mapping,
          });
        }

        // Reset tap tracking
        tapCount = 0;
        lastTapTime = 0;

        // Don't start joystick tracking for this touch
        return;
      }

      // First tap or normal touch
      activeTouch = touch;
      lastTapTime = now;
      tapCount = 1;

      // Set timeout to reset tap count
      if (tapTimeout) clearTimeout(tapTimeout);
      tapTimeout = setTimeout(() => {
        tapCount = 0;
      }, config.doubleTapThreshold * 2);

      // Start tracking this touch for joystick movement
      isDoubleTapGesture = false;
      updateJoystick(touch);

      logDebug("Joystick touch started", {
        side: side,
        type: type,
        touchId: touch.identifier,
        isDoubleTap: false,
      });
    }

    // Event listeners
    joystickArea.addEventListener("touchstart", handleTouchStart);

    joystickArea.addEventListener("touchmove", (e) => {
      e.preventDefault();
      if (!activeTouch || isDoubleTapGesture) return;

      for (let touch of e.touches) {
        if (touch.identifier === activeTouch.identifier) {
          updateJoystick(touch);
          break;
        }
      }
    });

    joystickArea.addEventListener("touchend", (e) => {
      e.preventDefault();

      if (isDoubleTapGesture) {
        // Double-tap gesture completed, just clean up
        isDoubleTapGesture = false;
        activeTouch = null;
        return;
      }

      logDebug("Joystick touch ended", {
        side: side,
        type: type,
        touchId: activeTouch ? activeTouch.identifier : "none",
      });
      resetJoystick();
    });

    joystickArea.addEventListener("touchcancel", (e) => {
      e.preventDefault();
      logDebug("Joystick touch cancelled", {
        side: side,
        type: type,
      });
      resetJoystick();
    });

    // Mouse support for desktop testing
    joystickArea.addEventListener("mousedown", (e) => {
      e.preventDefault();
      if (activeTouch) return;

      activeTouch = {
        clientX: e.clientX,
        clientY: e.clientY,
        identifier: "mouse",
      };

      const now = Date.now();

      // Double-tap check for mouse
      if (
        config.clickableThumbsticks &&
        now - lastTapTime < config.doubleTapThreshold
      ) {
        // Double-tap detected
        const button = side === "left" ? "BUTTON_L3" : "BUTTON_R3";
        const mapping = currentProfile.mappings[button];

        if (mapping) {
          joystickArea.style.backgroundColor = "rgba(255, 200, 0, 0.7)";
          setTimeout(() => {
            joystickArea.style.backgroundColor = `rgba(0, 0, 0, ${config.buttonOpacity})`;
          }, 200);

          sendKeyEvent(mapping, "down");
          setTimeout(() => sendKeyEvent(mapping, "up"), 50);

          logDebug("Mouse double-tap click", { side, button, mapping });
        }

        activeTouch = null;
        lastTapTime = 0;
        return;
      }

      lastTapTime = now;
      updateJoystick(activeTouch);

      // Mouse move tracking
      const mouseMoveHandler = (e) => {
        activeTouch.clientX = e.clientX;
        activeTouch.clientY = e.clientY;
        updateJoystick(activeTouch);
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
      if (mouseMovementInterval) {
        clearInterval(mouseMovementInterval);
      }
      if (tapTimeout) {
        clearTimeout(tapTimeout);
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

  // ================ D-PAD TOUCH IMPLEMENTATION ================

  // ================ D-PAD TOUCH IMPLEMENTATION (Circle Style) ================

  function createDpadTouch() {
    const container = document.createElement("div");
    container.className = "dpad-container";

    container.style.cssText = `
        position: absolute;
        left: 30px;
        top: 130px;
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
            opacity: 0.5;
            fill: currentColor;
        }
        #dpad-buttons { 
            opacity: 0.75;
            fill: currentColor;
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
    g.setAttribute("style", "opacity: 0.5; fill: currentColor;");

    // Cluster circle
    const clusterCircle = document.createElementNS(svgNS, "circle");
    clusterCircle.id = "dpad-cluster";
    clusterCircle.setAttribute("cx", "5");
    clusterCircle.setAttribute("cy", "5");
    clusterCircle.setAttribute("r", "5");
    clusterCircle.setAttribute("fill", "currentColor");

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
      circle.setAttribute("fill", "currentColor");
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

    // Set color for the entire SVG (matching your D-Pad colors)
    svg.style.color = "#2e2e2e";

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

    // Add label
    const label = document.createElement("div");
    label.className = "dpad-label";
    label.textContent = "D-PAD";
    label.style.cssText = `
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
    `;
    container.appendChild(label);

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

  function toggleVirtualGamepad() {
    isEnabled = !isEnabled;

    if (isEnabled) {
      createTouchControls();
      enableButton.innerHTML = "✅";
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

    // Create enable button
    createEnableButton();

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
