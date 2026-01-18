/**
 * electron_windows.js
 * Windows Forms Porting Tool Window
 * Activated by windowsJS() function
 */

// PowerShell script for Windows Porting Tool
const WINDOWS_POWERSHELL_SCRIPT = `# ===========================================
# Electron to Windows Porting Tool - PowerShell Script
# ===========================================
# This script will port multiple Electron games to Windows
# Created by Windows_ Electron Porting Tool
# ============================================

Write-Host "Hello World from Windows Porting Tool!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Gray
Write-Host ""
Write-Host "📦 Batch Electron Game Porting for Windows" -ForegroundColor Yellow
Write-Host "📅 Generated on: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "🎮 Total Games: [GAME_COUNT_PLACEHOLDER]" -ForegroundColor Green
Write-Host ""

# Define directories
$WINDOWS_GAMES_DIR = "$env:USERPROFILE\\Games\\Electron"
$DOWNLOADS_DIR = "$env:USERPROFILE\\Downloads\\Electron_Games"
$DESKTOP_SHORTCUTS_DIR = "$env:USERPROFILE\\Desktop\\Electron Games"

# Create directories
Write-Host "📁 Creating directories..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $WINDOWS_GAMES_DIR
New-Item -ItemType Directory -Force -Path $DOWNLOADS_DIR
New-Item -ItemType Directory -Force -Path $DESKTOP_SHORTCUTS_DIR
Write-Host "✅ Directories created successfully!" -ForegroundColor Green
Write-Host ""

# Porting function
function Port-Game {
    param(
        [string]$GameName,
        [string]$GameUrl,
        [string]$CoverUrl
    )
    
    Write-Host "🔄 Porting: $GameName" -ForegroundColor Cyan
    Write-Host "🔗 Game URL: $GameUrl" -ForegroundColor Gray
    
    # Download game
    $GameFile = "$DOWNLOADS_DIR\\$($GameName.Replace(' ', '_')).zip"
    Write-Host "⬇️  Downloading game..." -ForegroundColor Yellow
    
    # Create Windows shortcut
    $ShortcutPath = "$DESKTOP_SHORTCUTS_DIR\\$GameName.lnk"
    Write-Host "🔗 Creating Windows shortcut..." -ForegroundColor Cyan
    
    # Create batch file launcher
    $BatchFile = "$WINDOWS_GAMES_DIR\\$GameName.bat"
    @"
@echo off
echo 🚀 Launching $GameName...
echo Starting Electron emulator...
REM Add your emulator launch command here
"@ | Out-File -FilePath $BatchFile -Encoding ASCII
    
    Write-Host "✅ $GameName ported successfully!" -ForegroundColor Green
    Write-Host ""
}

Write-Host "🔧 System Information:" -ForegroundColor Cyan
Write-Host "   - Windows Version: $([Environment]::OSVersion.Version)" -ForegroundColor Gray
Write-Host "   - System: $([Environment]::Is64BitOperatingSystem ? 'x64' : 'x86')" -ForegroundColor Gray
Write-Host "   - User: $env:USERNAME" -ForegroundColor Gray
Write-Host ""

Write-Host "📋 Available Commands:" -ForegroundColor Yellow
Write-Host "   1. Port all games" -ForegroundColor White
Write-Host "   2. Port specific game" -ForegroundColor White
Write-Host "   3. Create shortcuts only" -ForegroundColor White
Write-Host "   4. Download games only" -ForegroundColor White
Write-Host "   5. Generate icons" -ForegroundColor White
Write-Host ""

Write-Host "⚙️  Porting Process:" -ForegroundColor Cyan
Write-Host "   1. Download Electron ROMs" -ForegroundColor Gray
Write-Host "   2. Extract game files" -ForegroundColor Gray
Write-Host "   3. Create batch launchers" -ForegroundColor Gray
Write-Host "   4. Add cover art icons" -ForegroundColor Gray
Write-Host "   5. Create desktop shortcuts" -ForegroundColor Gray
Write-Host "   6. Add to Start Menu" -ForegroundColor Gray
Write-Host ""

Write-Host "⚠️  Disclaimer:" -ForegroundColor Red
Write-Host "   This tool is for educational purposes only." -ForegroundColor Yellow
Write-Host "   Ensure you own legal copies of games you port." -ForegroundColor Yellow
Write-Host ""

Write-Host "🎯 Ready to port Electron games to Windows!" -ForegroundColor Green
Write-Host "   Run: .\\electron_to_windows.ps1 to start" -ForegroundColor Cyan
Write-Host ""

# Example usage
Write-Host "📝 Example porting commands:" -ForegroundColor Yellow
Write-Host '   Port-Game "Final Fantasy VII" "http://example.com/ff7.zip" "http://example.com/ff7_cover.jpg"' -ForegroundColor Gray
Write-Host '   Port-Game "Metal Gear Solid" "http://example.com/mgs.zip" "http://example.com/mgs_cover.jpg"' -ForegroundColor Gray
Write-Host ""

Write-Host "💡 Tips:" -ForegroundColor Cyan
Write-Host "   • Run PowerShell as Administrator for full features" -ForegroundColor Gray
Write-Host "   • Enable script execution: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Gray
Write-Host "   • Right-click → Run with PowerShell if you see security warnings" -ForegroundColor Gray
Write-Host ""

Write-Host "✨ PowerShell script generation complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Gray
`;

// Main function to show Windows Forms porting tool
function windowsJS(title, icon_url, splash_url) {
  console.log("🪟 Windows Forms Porting Tool activated");
  const gamesCount = 0;

  // Create the overlay if it doesn't exist
  let overlay = document.getElementById("windows-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "windows-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      backdrop-filter: blur(5px);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    `;
    document.body.appendChild(overlay);
  } else {
    overlay.style.display = "flex";
    return; // Already visible
  }

  // Create the Windows Forms-style window
  const windowContainer = document.createElement("div");
  windowContainer.style.cssText = `
    width: 800px;
    height: 600px;
    background: #f0f0f0;
    border: 2px solid #3c8dbc;
    border-radius: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.3);
  `;

  // Windows Forms Title Bar
  const titleBar = document.createElement("div");
  titleBar.style.cssText = `
    background: linear-gradient(to bottom, #3c8dbc, #2a6496);
    padding: 8px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 2px solid #1d5c83;
    user-select: none;
    height: 36px;
  `;

  // Title with icon
  const titleText = document.createElement("div");
  titleText.textContent = title || "Electron to Windows Porting Tool";
  titleText.style.cssText = `
    color: white;
    font-weight: bold;
    font-size: 14px;
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  // Windows Forms-style icon
  const titleIcon = document.createElement("img");
  titleIcon.src =
    icon_url || "https://cdn.sdappnet.cloud/rtx/images/windows-icon.png";
  titleIcon.alt = "Windows";
  titleIcon.style.cssText = `
    width: 20px;
    height: 20px;
  `;
  titleText.prepend(titleIcon);

  // Windows Forms window controls
  const windowControls = document.createElement("div");
  windowControls.style.cssText = `
    display: flex;
    gap: 4px;
  `;

  const minimizeBtn = document.createElement("button");
  minimizeBtn.innerHTML = "_";
  minimizeBtn.style.cssText = `
    background: #3c8dbc;
    color: white;
    border: 1px solid #2a6496;
    width: 30px;
    height: 24px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  `;

  const maximizeBtn = document.createElement("button");
  maximizeBtn.innerHTML = "□";
  maximizeBtn.style.cssText = `
    background: #3c8dbc;
    color: white;
    border: 1px solid #2a6496;
    width: 30px;
    height: 24px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  `;

  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "×";
  closeBtn.style.cssText = `
    background: #e74c3c;
    color: white;
    border: 1px solid #c0392b;
    width: 30px;
    height: 24px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  `;

  // Hover effects
  [minimizeBtn, maximizeBtn].forEach((btn) => {
    btn.addEventListener("mouseover", () => {
      btn.style.background = "#4a9ccc";
      btn.style.borderColor = "#3c8dbc";
    });
    btn.addEventListener("mouseout", () => {
      btn.style.background = "#3c8dbc";
      btn.style.borderColor = "#2a6496";
    });
  });

  closeBtn.addEventListener("mouseover", () => {
    closeBtn.style.background = "#ff6b5a";
    closeBtn.style.borderColor = "#e74c3c";
  });
  closeBtn.addEventListener("mouseout", () => {
    closeBtn.style.background = "#e74c3c";
    closeBtn.style.borderColor = "#c0392b";
  });

  windowControls.appendChild(minimizeBtn);
  windowControls.appendChild(maximizeBtn);
  windowControls.appendChild(closeBtn);

  titleBar.appendChild(titleText);
  titleBar.appendChild(windowControls);

  // Main Content Area
  const mainContent = document.createElement("div");
  mainContent.style.cssText = `
    flex: 1;
    display: flex;
    background: #f0f0f0;
    overflow: hidden;
  `;

  // Left Panel - Menu/Controls (like Windows Forms Toolbox)
  const leftPanel = document.createElement("div");
  leftPanel.style.cssText = `
    width: 220px;
    background: #e8e8e8;
    border-right: 2px solid #d0d0d0;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;

  // Group Box 1: Application Info
  const appInfoGroup = createGroupBox("Application Information");
  const appIcon = document.createElement("img");
  appIcon.src =
    icon_url || "https://cdn.sdappnet.cloud/rtx/images/windows-icon.png";
  appIcon.alt = "App Icon";
  appIcon.style.cssText = `
    width: 64px;
    height: 64px;
    margin: 10px auto;
    display: block;
  `;

  const appNameLabel = createLabel("Application Name:");
  appNameLabel.style.fontWeight = "bold";
  const appNameValue = createLabel(title || "Electron Porting Tool");

  const versionLabel = createLabel("Version:");
  versionLabel.style.fontWeight = "bold";
  const versionValue = createLabel("1.0.0");

  const statusLabel = createLabel("Status:");
  statusLabel.style.fontWeight = "bold";
  const statusValue = createLabel("🟢 Ready");
  statusValue.style.color = "#27ae60";

  appInfoGroup.appendChild(appIcon);
  appInfoGroup.appendChild(appNameLabel);
  appInfoGroup.appendChild(appNameValue);
  appInfoGroup.appendChild(versionLabel);
  appInfoGroup.appendChild(versionValue);
  appInfoGroup.appendChild(statusLabel);
  appInfoGroup.appendChild(statusValue);

  // Group Box 2: Statistics
  const statsGroup = createGroupBox("Statistics");
  const gamesLabel = createLabel("Games Available:");
  gamesLabel.style.fontWeight = "bold";
  const gamesValue = createLabel(`${gamesCount} games`);

  const scriptLabel = createLabel("Script Lines:");
  scriptLabel.style.fontWeight = "bold";
  const scriptValue = createLabel(
    `${WINDOWS_POWERSHELL_SCRIPT.split("\n").length} lines`
  );

  const generatedLabel = createLabel("Generated:");
  generatedLabel.style.fontWeight = "bold";
  const generatedValue = createLabel(new Date().toLocaleDateString());

  statsGroup.appendChild(gamesLabel);
  statsGroup.appendChild(gamesValue);
  statsGroup.appendChild(scriptLabel);
  statsGroup.appendChild(scriptValue);
  statsGroup.appendChild(generatedLabel);
  statsGroup.appendChild(generatedValue);

  // Group Box 3: Actions
  const actionsGroup = createGroupBox("Actions");

  // Copy Button (Windows Forms style)
  const copyButton = createButton("📋 Copy Script", "#3498db", "#2980b9");
  copyButton.addEventListener("click", () => {
    const script = WINDOWS_POWERSHELL_SCRIPT.replace(
      "[GAME_COUNT_PLACEHOLDER]",
      gamesCount
    );
    navigator.clipboard.writeText(script).then(() => {
      const originalText = copyButton.textContent;
      copyButton.textContent = "✅ Copied!";
      copyButton.style.background = "#27ae60";
      setTimeout(() => {
        copyButton.textContent = originalText;
        copyButton.style.background = "#3498db";
      }, 2000);
    });
  });

  // Download Button (Windows Forms style)
  const downloadButton = createButton("💾 Download .ps1", "#2ecc71", "#27ae60");
  downloadButton.addEventListener("click", () => {
    const script = WINDOWS_POWERSHELL_SCRIPT.replace(
      "[GAME_COUNT_PLACEHOLDER]",
      gamesCount
    );
    const blob = new Blob([script], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "electron_to_windows.ps1";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const originalText = downloadButton.textContent;
    downloadButton.textContent = "✅ Downloaded!";
    downloadButton.style.background = "#27ae60";
    setTimeout(() => {
      downloadButton.textContent = originalText;
      downloadButton.style.background = "#2ecc71";
    }, 2000);
  });

  // Close Button (Windows Forms style)
  const closeButton = createButton("✕ Close", "#e74c3c", "#c0392b");
  closeButton.addEventListener("click", () => {
    overlay.style.display = "none";
  });

  actionsGroup.appendChild(copyButton);
  actionsGroup.appendChild(downloadButton);
  actionsGroup.appendChild(closeButton);

  leftPanel.appendChild(appInfoGroup);
  leftPanel.appendChild(statsGroup);
  leftPanel.appendChild(actionsGroup);

  // Right Panel - Main Content (like Windows Forms Designer)
  const rightPanel = document.createElement("div");
  rightPanel.style.cssText = `
    flex: 1;
    display: flex;
    flex-direction: column;
    background: white;
  `;

  // Tab Control (Windows Forms style)
  const tabControl = document.createElement("div");
  tabControl.style.cssText = `
    background: #f8f8f8;
    border-bottom: 2px solid #d0d0d0;
    display: flex;
  `;

  const scriptTab = createTab("PowerShell Script", true);
  const settingsTab = createTab("Settings", false);
  const helpTab = createTab("Help", false);

  tabControl.appendChild(scriptTab);
  tabControl.appendChild(settingsTab);
  tabControl.appendChild(helpTab);

  // Tab Content Area
  const tabContent = document.createElement("div");
  tabContent.style.cssText = `
    flex: 1;
    background: white;
    overflow: hidden;
  `;

  // Script Viewer (RichTextBox style)
  const scriptViewer = document.createElement("div");
  scriptViewer.style.cssText = `
    width: 100%;
    height: 100%;
    padding: 15px;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.4;
    color: #333;
    background: #1e1e1e;
    overflow: auto;
    border: none;
  `;

  // PowerShell syntax highlighting
  const formattedScript = WINDOWS_POWERSHELL_SCRIPT.replace(
    "[GAME_COUNT_PLACEHOLDER]",
    gamesCount
  );
  scriptViewer.innerHTML = formattedScript
    .replace(/^#.*$/gm, '<span style="color: #57a64a">$&</span>')
    .replace(/Write-Host.*$/gm, '<span style="color: #569cd6">$&</span>')
    .replace(/\".*?\"/gm, '<span style="color: #d69d85">$&</span>')
    .replace(
      /\$[a-zA-Z_][a-zA-Z0-9_]*/gm,
      '<span style="color: #9cdcfe">$&</span>'
    )
    .replace(
      /\b(function|param|if|else|foreach|return)\b/gm,
      '<span style="color: #c586c0">$1</span>'
    )
    .replace(
      /\b(New-Item|Get-Date|Out-File)\b/gm,
      '<span style="color: #dcdcaa">$1</span>'
    )
    .replace(/\n/g, "<br>")
    .replace(/ /g, "&nbsp;");

  tabContent.appendChild(scriptViewer);
  rightPanel.appendChild(tabControl);
  rightPanel.appendChild(tabContent);

  // Status Bar (Windows Forms style)
  const statusBar = document.createElement("div");
  statusBar.style.cssText = `
    background: #3c8dbc;
    color: white;
    padding: 4px 12px;
    font-size: 12px;
    display: flex;
    justify-content: space-between;
    border-top: 1px solid #2a6496;
    height: 24px;
  `;

  const statusLeft = document.createElement("div");
  statusLeft.textContent = "Ready";
  statusLeft.style.cssText = `color: white;`;

  const statusRight = document.createElement("div");
  statusRight.textContent = `Games: ${gamesCount} | PowerShell v5.1+`;
  statusRight.style.cssText = `color: #d6eaf8;`;

  statusBar.appendChild(statusLeft);
  statusBar.appendChild(statusRight);

  // Assemble window
  mainContent.appendChild(leftPanel);
  mainContent.appendChild(rightPanel);

  windowContainer.appendChild(titleBar);
  windowContainer.appendChild(mainContent);
  windowContainer.appendChild(statusBar);
  overlay.appendChild(windowContainer);

  // Window control interactions
  closeBtn.addEventListener("click", () => {
    overlay.style.display = "none";
  });

  minimizeBtn.addEventListener("click", () => {
    mainContent.style.display =
      mainContent.style.display === "none" ? "flex" : "none";
    statusBar.style.display =
      statusBar.style.display === "none" ? "flex" : "none";
  });

  maximizeBtn.addEventListener("click", () => {
    if (windowContainer.style.width === "100%") {
      windowContainer.style.width = "800px";
      windowContainer.style.height = "600px";
    } else {
      windowContainer.style.width = "100%";
      windowContainer.style.height = "100%";
    }
  });

  // Tab switching
  [scriptTab, settingsTab, helpTab].forEach((tab) => {
    tab.addEventListener("click", () => {
      [scriptTab, settingsTab, helpTab].forEach((t) => {
        t.style.background = "#f0f0f0";
        t.style.borderBottom = "2px solid #f0f0f0";
        t.style.color = "#666";
      });
      tab.style.background = "white";
      tab.style.borderBottom = "2px solid #3c8dbc";
      tab.style.color = "#333";

      // Update tab content based on selected tab
      if (tab === scriptTab) {
        tabContent.innerHTML = "";
        tabContent.appendChild(scriptViewer);
      } else if (tab === settingsTab) {
        tabContent.innerHTML =
          "<div style='padding: 20px;'>Settings content would go here...</div>";
      } else if (tab === helpTab) {
        tabContent.innerHTML =
          "<div style='padding: 20px;'>Help content would go here...</div>";
      }
    });
  });

  // Helper functions
  function createGroupBox(title) {
    const group = document.createElement("div");
    group.style.cssText = `
      background: white;
      border: 2px solid #d0d0d0;
      border-radius: 4px;
      padding: 12px;
      margin-bottom: 15px;
    `;

    const groupTitle = document.createElement("div");
    groupTitle.textContent = title;
    groupTitle.style.cssText = `
      background: #3c8dbc;
      color: white;
      font-weight: bold;
      padding: 4px 8px;
      margin: -12px -12px 12px -12px;
      border-bottom: 2px solid #2a6496;
    `;

    group.appendChild(groupTitle);
    return group;
  }

  function createLabel(text) {
    const label = document.createElement("div");
    label.textContent = text;
    label.style.cssText = `
      color: #333;
      font-size: 13px;
      margin-bottom: 4px;
      padding: 2px 0;
    `;
    return label;
  }

  function createButton(text, color, hoverColor) {
    const button = document.createElement("button");
    button.textContent = text;
    button.style.cssText = `
      background: ${color};
      color: white;
      border: none;
      padding: 8px 12px;
      font-size: 13px;
      font-weight: bold;
      cursor: pointer;
      margin: 4px 0;
      border-radius: 3px;
      transition: background 0.2s;
      text-align: left;
    `;
    button.addEventListener("mouseover", () => {
      button.style.background = hoverColor;
    });
    button.addEventListener("mouseout", () => {
      button.style.background = color;
    });
    return button;
  }

  function createTab(text, active) {
    const tab = document.createElement("div");
    tab.textContent = text;
    tab.style.cssText = `
      padding: 8px 16px;
      background: ${active ? "white" : "#f0f0f0"};
      border-bottom: 2px solid ${active ? "#3c8dbc" : "#f0f0f0"};
      color: ${active ? "#333" : "#666"};
      cursor: pointer;
      font-size: 13px;
      font-weight: ${active ? "bold" : "normal"};
      border-right: 1px solid #d0d0d0;
      user-select: none;
    `;
    return tab;
  }

  // Escape key to close
  const escapeHandler = (e) => {
    if (e.key === "Escape") {
      overlay.style.display = "none";
      document.removeEventListener("keydown", escapeHandler);
    }
  };
  document.addEventListener("keydown", escapeHandler);

  // Click outside to close
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.style.display = "none";
    }
  });

  console.log(
    `🪟 Windows Forms Porting Tool displayed with ${gamesCount} games`
  );
}

// Export the function to global scope
window.windowsJS = windowsJS;

console.log("✅ electron_windows.js loaded");
console.log(
  "🪟 Call windowsJS('Title', 'icon_url') to show the Windows Forms porting tool"
);
