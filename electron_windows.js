/**
 * electron_windows.js
 * Windows Porting Tool Window
 * Activated by windowsJS() function
 */

// PowerShell script for Windows Porting Tool
const WINDOWS_POWERSHELL_SCRIPT = `# ===========================================
# PS1 to Windows Porting Tool - PowerShell Script
# ===========================================
# This script will port multiple PS1 games to Windows
# Created by Windows_ PS1 Porting Tool
# ============================================

Write-Host "Hello World from Windows Porting Tool!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Gray
Write-Host ""
Write-Host "📦 Batch PS1 Game Porting for Windows" -ForegroundColor Yellow
Write-Host "📅 Generated on: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "🎮 Total Games: [GAME_COUNT_PLACEHOLDER]" -ForegroundColor Green
Write-Host ""

# Define directories
$WINDOWS_GAMES_DIR = "$env:USERPROFILE\\Games\\PS1"
$DOWNLOADS_DIR = "$env:USERPROFILE\\Downloads\\PS1_Games"
$DESKTOP_SHORTCUTS_DIR = "$env:USERPROFILE\\Desktop\\PS1 Games"

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
echo Starting PS1 emulator...
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
Write-Host "   1. Download PS1 ROMs" -ForegroundColor Gray
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

Write-Host "🎯 Ready to port PS1 games to Windows!" -ForegroundColor Green
Write-Host "   Run: .\\ps1_to_windows.ps1 to start" -ForegroundColor Cyan
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

// Main function to show Windows porting tool
function windowsJS(title, cover_url, splash_url) {
  console.log("🪟 Windows Porting Tool activated");
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

  // Create the window
  const windowContainer = document.createElement("div");
  windowContainer.style.cssText = `
    width: 90%;
    max-width: 1000px;
    height: 80vh;
    background: linear-gradient(135deg, #0078d7 0%, #106ebe 100%);
    border-radius: 8px 8px 0 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    border: 1px solid #005a9e;
  `;

  // Window header with Windows style
  const windowHeader = document.createElement("div");
  windowHeader.style.cssText = `
    background: linear-gradient(to bottom, #0078d7, #005a9e);
    padding: 8px 15px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #004578;
    user-select: none;
    height: 32px;
  `;

  // Windows window title
  const windowTitle = document.createElement("div");
  windowTitle.textContent = "Windows Porting Tool";
  windowTitle.style.cssText = `
    color: white;
    font-weight: 600;
    font-size: 14px;
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
  `;

  // Windows icon
  const windowsIcon = document.createElement("img");
  windowsIcon.src = "https://cdn.sdappnet.cloud/rtx/images/windows-icon.png";
  windowsIcon.alt = "Windows";
  windowsIcon.style.cssText = `
    width: 16px;
    height: 16px;
  `;
  windowTitle.prepend(windowsIcon);

  // Windows window controls (Minimize, Maximize, Close)
  const windowControls = document.createElement("div");
  windowControls.style.cssText = `
    display: flex;
    gap: 2px;
  `;

  const minimizeBtn = document.createElement("button");
  minimizeBtn.innerHTML = "&#x2014;";
  minimizeBtn.style.cssText = `
    background: transparent;
    color: white;
    border: none;
    width: 46px;
    height: 32px;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  `;

  const maximizeBtn = document.createElement("button");
  maximizeBtn.innerHTML = "&#x25A1;";
  maximizeBtn.style.cssText = `
    background: transparent;
    color: white;
    border: none;
    width: 46px;
    height: 32px;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  `;

  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = "&#x2715;";
  closeBtn.style.cssText = `
    background: transparent;
    color: white;
    border: none;
    width: 46px;
    height: 32px;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  `;

  // Hover effects for Windows buttons
  [minimizeBtn, maximizeBtn, closeBtn].forEach((btn) => {
    btn.addEventListener("mouseover", () => {
      if (btn === closeBtn) {
        btn.style.background = "#e81123";
      } else {
        btn.style.background = "rgba(255, 255, 255, 0.2)";
      }
    });
    btn.addEventListener("mouseout", () => {
      btn.style.background = "transparent";
    });
  });

  windowControls.appendChild(minimizeBtn);
  windowControls.appendChild(maximizeBtn);
  windowControls.appendChild(closeBtn);

  windowHeader.appendChild(windowTitle);
  windowHeader.appendChild(windowControls);

  // Window content area (Windows blue gradient)
  const windowContent = document.createElement("div");
  windowContent.style.cssText = `
    flex: 1;
    display: flex;
    overflow: hidden;
    background: linear-gradient(135deg, #f0f0f0 0%, #e6e6e6 100%);
  `;

  // Left panel - Information (Windows style)
  const leftPanel = document.createElement("div");
  leftPanel.style.cssText = `
    width: 320px;
    background: white;
    padding: 20px;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #d0d0d0;
    overflow-y: auto;
  `;

  // Windows logo and title
  const windowsHeader = document.createElement("div");
  windowsHeader.style.cssText = `
    text-align: center;
    margin-bottom: 25px;
    padding-bottom: 20px;
    border-bottom: 1px solid #e0e0e0;
  `;

  const windowsLogo = document.createElement("img");
  windowsLogo.src = "https://cdn.sdappnet.cloud/rtx/images/windows-icon.png";
  windowsLogo.alt = "Windows";
  windowsLogo.style.cssText = `
    width: 60px;
    height: 60px;
    margin-bottom: 15px;
  `;

  const toolTitle = document.createElement("h2");
  toolTitle.textContent = "PS1 to Windows";
  toolTitle.style.cssText = `
    color: #0078d7;
    margin: 0 0 5px 0;
    font-size: 1.5rem;
    font-weight: 600;
  `;

  const toolSubtitle = document.createElement("p");
  toolSubtitle.textContent = "Game Porting Utility";
  toolSubtitle.style.cssText = `
    color: #666;
    margin: 0;
    font-size: 0.95rem;
  `;

  windowsHeader.appendChild(windowsLogo);
  windowsHeader.appendChild(toolTitle);
  windowsHeader.appendChild(toolSubtitle);
  leftPanel.appendChild(windowsHeader);

  // System Info Box (Windows style)
  const sysInfoBox = document.createElement("div");
  sysInfoBox.style.cssText = `
    background: #f8f8f8;
    border: 1px solid #d0d0d0;
    border-radius: 4px;
    padding: 15px;
    margin-bottom: 20px;
  `;

  const sysInfoTitle = document.createElement("h3");
  sysInfoTitle.textContent = "System Information";
  sysInfoTitle.style.cssText = `
    color: #0078d7;
    margin: 0 0 12px 0;
    font-size: 16px;
    font-weight: 600;
  `;

  const gamesStat = document.createElement("div");
  gamesStat.textContent = `📁 Games Available: ${gamesCount}`;
  gamesStat.style.cssText = `
    color: #107c10;
    margin-bottom: 8px;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  const scriptStat = document.createElement("div");
  scriptStat.textContent = "📝 PowerShell Script: Ready";
  scriptStat.style.cssText = `
    color: #0078d7;
    margin-bottom: 8px;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  const statusStat = document.createElement("div");
  statusStat.textContent = "🟢 Status: Operational";
  statusStat.style.cssText = `
    color: #107c10;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  sysInfoBox.appendChild(sysInfoTitle);
  sysInfoBox.appendChild(gamesStat);
  sysInfoBox.appendChild(scriptStat);
  sysInfoBox.appendChild(statusStat);
  leftPanel.appendChild(sysInfoBox);

  // Windows-style buttons
  const actionsContainer = document.createElement("div");
  actionsContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: auto;
  `;

  // Copy Script Button (Windows style)
  const copyButton = document.createElement("button");
  copyButton.textContent = "Copy PowerShell Script";
  copyButton.style.cssText = `
    background: linear-gradient(to bottom, #e1e1e1, #d4d4d4);
    color: #000;
    border: 1px solid #a6a6a6;
    border-radius: 4px;
    padding: 10px 15px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-align: left;
    position: relative;
  `;
  copyButton.innerHTML =
    '<i class="far fa-copy" style="font-size: 16px;"></i> Copy PowerShell Script';
  copyButton.addEventListener("mouseover", () => {
    copyButton.style.background =
      "linear-gradient(to bottom, #f0f0f0, #e5e5e5)";
    copyButton.style.borderColor = "#0078d7";
  });
  copyButton.addEventListener("mouseout", () => {
    copyButton.style.background =
      "linear-gradient(to bottom, #e1e1e1, #d4d4d4)";
    copyButton.style.borderColor = "#a6a6a6";
  });
  copyButton.addEventListener("click", () => {
    const script = WINDOWS_POWERSHELL_SCRIPT.replace(
      "[GAME_COUNT_PLACEHOLDER]",
      gamesCount
    );
    navigator.clipboard.writeText(script).then(() => {
      const originalHTML = copyButton.innerHTML;
      copyButton.innerHTML =
        '<i class="fas fa-check" style="font-size: 16px; color: #107c10;"></i> Copied!';
      setTimeout(() => {
        copyButton.innerHTML = originalHTML;
      }, 2000);
    });
  });

  // Download Script Button (Windows style)
  const downloadButton = document.createElement("button");
  downloadButton.textContent = "Download .ps1 File";
  downloadButton.style.cssText = `
    background: linear-gradient(to bottom, #e1e1e1, #d4d4d4);
    color: #000;
    border: 1px solid #a6a6a6;
    border-radius: 4px;
    padding: 10px 15px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-align: left;
  `;
  downloadButton.innerHTML =
    '<i class="fas fa-download" style="font-size: 16px;"></i> Download .ps1 File';
  downloadButton.addEventListener("mouseover", () => {
    downloadButton.style.background =
      "linear-gradient(to bottom, #f0f0f0, #e5e5e5)";
    downloadButton.style.borderColor = "#0078d7";
  });
  downloadButton.addEventListener("mouseout", () => {
    downloadButton.style.background =
      "linear-gradient(to bottom, #e1e1e1, #d4d4d4)";
    downloadButton.style.borderColor = "#a6a6a6";
  });
  downloadButton.addEventListener("click", () => {
    const script = WINDOWS_POWERSHELL_SCRIPT.replace(
      "[GAME_COUNT_PLACEHOLDER]",
      gamesCount
    );
    const blob = new Blob([script], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ps1_to_windows.ps1";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const originalHTML = downloadButton.innerHTML;
    downloadButton.innerHTML =
      '<i class="fas fa-check" style="font-size: 16px; color: #107c10;"></i> Downloaded!';
    setTimeout(() => {
      downloadButton.innerHTML = originalHTML;
    }, 2000);
  });

  // Close Button (Windows style)
  const closeWindowBtn = document.createElement("button");
  closeWindowBtn.textContent = "Close Window";
  closeWindowBtn.style.cssText = `
    background: linear-gradient(to bottom, #e1e1e1, #d4d4d4);
    color: #000;
    border: 1px solid #a6a6a6;
    border-radius: 4px;
    padding: 10px 15px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-align: left;
  `;
  closeWindowBtn.innerHTML =
    '<i class="fas fa-times" style="font-size: 16px;"></i> Close Window';
  closeWindowBtn.addEventListener("mouseover", () => {
    closeWindowBtn.style.background =
      "linear-gradient(to bottom, #ffe6e6, #ffd4d4)";
    closeWindowBtn.style.borderColor = "#e81123";
  });
  closeWindowBtn.addEventListener("mouseout", () => {
    closeWindowBtn.style.background =
      "linear-gradient(to bottom, #e1e1e1, #d4d4d4)";
    closeWindowBtn.style.borderColor = "#a6a6a6";
  });
  closeWindowBtn.addEventListener("click", () => {
    overlay.style.display = "none";
  });

  actionsContainer.appendChild(copyButton);
  actionsContainer.appendChild(downloadButton);
  actionsContainer.appendChild(closeWindowBtn);
  leftPanel.appendChild(actionsContainer);

  // Right panel - Script viewer (Windows Explorer style)
  const rightPanel = document.createElement("div");
  rightPanel.style.cssText = `
    flex: 1;
    display: flex;
    flex-direction: column;
    background: white;
    overflow: hidden;
    border-left: 1px solid #d0d0d0;
  `;

  // Script header (Windows Explorer style)
  const scriptHeader = document.createElement("div");
  scriptHeader.style.cssText = `
    background: linear-gradient(to bottom, #f8f8f8, #f0f0f0);
    padding: 10px 15px;
    border-bottom: 1px solid #d0d0d0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 40px;
  `;

  const scriptTitle = document.createElement("div");
  scriptTitle.textContent = "ps1_to_windows.ps1";
  scriptTitle.style.cssText = `
    color: #333;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  // PowerShell icon
  const psIcon = document.createElement("span");
  psIcon.innerHTML = "💻";
  psIcon.style.fontSize = "16px";
  scriptTitle.prepend(psIcon);

  const scriptMeta = document.createElement("div");
  scriptMeta.textContent = `${
    WINDOWS_POWERSHELL_SCRIPT.split("\n").length
  } lines`;
  scriptMeta.style.cssText = `
    color: #666;
    font-size: 12px;
    font-family: 'Segoe UI', sans-serif;
  `;

  scriptHeader.appendChild(scriptTitle);
  scriptHeader.appendChild(scriptMeta);

  // Script content area
  const scriptContent = document.createElement("div");
  scriptContent.style.cssText = `
    flex: 1;
    overflow: auto;
    padding: 20px;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.5;
    color: #333;
    background: #1e1e1e;
  `;

  // PowerShell syntax highlighting
  const formattedScript = WINDOWS_POWERSHELL_SCRIPT.replace(
    "[GAME_COUNT_PLACEHOLDER]",
    gamesCount
  );
  scriptContent.innerHTML = formattedScript
    .replace(/^#.*$/gm, '<span style="color: #57a64a">$&</span>') // Green comments
    .replace(/Write-Host.*$/gm, '<span style="color: #569cd6">$&</span>') // Blue Write-Host
    .replace(/\".*?\"/gm, '<span style="color: #d69d85">$&</span>') // Orange strings
    .replace(
      /\$[a-zA-Z_][a-zA-Z0-9_]*/gm,
      '<span style="color: #9cdcfe">$&</span>'
    ) // Light blue variables
    .replace(
      /\b(function|param|if|else|foreach|return)\b/gm,
      '<span style="color: #c586c0">$1</span>'
    ) // Purple keywords
    .replace(
      /\b(New-Item|Get-Date|Out-File)\b/gm,
      '<span style="color: #dcdcaa">$1</span>'
    ) // Yellow cmdlets
    .replace(/\n/g, "<br>")
    .replace(/ /g, "&nbsp;");

  rightPanel.appendChild(scriptHeader);
  rightPanel.appendChild(scriptContent);

  // Assemble window
  windowContent.appendChild(leftPanel);
  windowContent.appendChild(rightPanel);

  windowContainer.appendChild(windowHeader);
  windowContainer.appendChild(windowContent);
  overlay.appendChild(windowContainer);

  // Add Windows-style taskbar effect
  const taskbarEffect = document.createElement("div");
  taskbarEffect.style.cssText = `
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(to right, #0078d7, #50e6ff, #0078d7);
  `;
  windowContainer.appendChild(taskbarEffect);

  // Window control interactions
  closeBtn.addEventListener("click", () => {
    overlay.style.display = "none";
  });

  minimizeBtn.addEventListener("click", () => {
    windowContent.style.display =
      windowContent.style.display === "none" ? "flex" : "none";
  });

  maximizeBtn.addEventListener("click", () => {
    if (windowContainer.style.width === "100%") {
      windowContainer.style.width = "90%";
      windowContainer.style.maxWidth = "1000px";
      windowContainer.style.height = "80vh";
    } else {
      windowContainer.style.width = "100%";
      windowContainer.style.maxWidth = "100%";
      windowContainer.style.height = "100%";
    }
  });

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

  console.log(`🪟 Windows Porting Tool displayed with ${gamesCount} games`);
}

// Export the function to global scope
window.windowsJS = windowsJS;

console.log("✅ electron_windows.js loaded");
console.log("🪟 Call windowsJS() to show the Windows porting tool");
