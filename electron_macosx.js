// Generate script for single game - COMPLETE WITH AUTO-INSTALL + DOCK
function generateScript(game) {
  const code = game.codes && game.codes[0] ? game.codes[0] : "UNKNOWN";
  const coverURL = getCoverURL(game);
  const gameName = game.name || game.title.replace(/\.zip$/i, "");
  const safeAppName = sanitize(gameName);
  const safeCacheName = game.name
    ? game.name.replace(/[^a-zA-Z0-9]/g, "_")
    : safeAppName;

  // Cover URL generation with better error handling
  function getCoverURL(game) {
    if (!game.codes || !game.codes[0]) {
      return "https://cdn.sdappnet.cloud/rtx/images/electron-sony-computer-entertainment.png";
    }

    const code = game.codes[0];
    const baseURL =
      "https://raw.githubusercontent.com/xlenore/psx-covers/main/covers/";

    if (use3DCovers) {
      return `${baseURL}3d/${code}.png`;
    } else {
      return `${baseURL}default/${code}.jpg`;
    }
  }

  // Missing sanitize function - ADDED THIS
  function sanitize(str) {
    return (str || "")
      .replace(/[^a-z0-9]/gi, "_")
      .replace(/_{2,}/g, "_")
      .replace(/^_|_$/g, "");
  }

  return `#!/bin/bash

# ===============================================
# electron Game Wrapper for macOS - Electron App
# ===============================================

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
CYAN='\\033[0;36m'
NC='\\033[0m'

echo -e "\${CYAN}"
echo "┌─────────────────────────────────────────────────────────────────┐"
echo "│                   🎮 Electron Game Wrapper 🎮                    │"
echo "│                      for macOS (Electron)                       │"
echo "├─────────────────────────────────────────────────────────────────┤"
printf "│  📀 %-15s: %-40s │\\n" "Game" "${gameName}"
printf "│  🏷️  %-15s: %-40s │\\n" "Code" "${code}"
printf "│  ⚡ %-15s: %-40s │\\n" "Engine" "WebAssembly electron"
echo "└─────────────────────────────────────────────────────────────────┘"
echo -e "\${NC}"


# ===============================================
# CHECK FOR EXISTING INSTALLATIONS FIRST
# ===============================================
echo -e "\${CYAN}🔍 Checking for existing installations...\${NC}"

# Check if Node.js is already installed
if command -v node &> /dev/null; then
    NODE_VERSION=\$(node -v)
    echo -e "\${GREEN}✅ Node.js found: \$NODE_VERSION\${NC}"
fi

# Check if npm is already installed
if command -v npm &> /dev/null; then
    NPM_VERSION=\$(npm -v)
    echo -e "\${GREEN}✅ npm found: \$NPM_VERSION\${NC}"
fi


# Check if Python3 is already installed
if command -v python3 &> /dev/null; then
    echo -e "\${GREEN}✅ Python3 found\${NC}"
fi

# Check if unzip is already installed
if command -v unzip &> /dev/null; then
    echo -e "\${GREEN}✅ unzip found\${NC}"
fi

echo ""

# ===============================================
# DEPENDENCY CHECK AND INSTALLATION - SIMPLIFIED
# ===============================================
echo -e "\${CYAN}🔧 Checking for required tools...\${NC}"

# Function to check if a command exists
check_command() {
    local cmd=\$1
    local name=\$2
    if command -v \$cmd &> /dev/null; then
        echo -e "\${GREEN}✅ \$name found\${NC}"
        return 0
    else
        echo -e "\${YELLOW}⚠ \$name not found\${NC}"
        return 1
    fi
}

# Check if on macOS
if [[ "\$(uname)" != "Darwin" ]]; then
    echo -e "\${RED}❌ This script only works on macOS\${NC}"
    exit 1
fi

# Array of required commands
required_commands=(
    "node:Node.js"
    "npm:npm"
    "python3:Python 3"
    "git:Git"
    "unzip:unzip"
    "curl:curl"
)

# Check all required commands
missing_commands=()
for cmd_pair in "\${required_commands[@]}"; do
    cmd="\${cmd_pair%%:*}"
    name="\${cmd_pair##*:}"
    if ! check_command "\$cmd" "\$name"; then
        missing_commands+=("\$cmd")
    fi
done


echo ""

# ===============================================
# INSTALL MISSING DEPENDENCIES
# ===============================================
if [ \${#missing_commands[@]} -gt 0 ]; then
    echo -e "\${CYAN}📦 Installing missing dependencies...\${NC}"
    
    # Check for Homebrew
    if ! command -v brew &> /dev/null; then
        echo -e "\${YELLOW}⚠ Homebrew not found. Installing Homebrew...\${NC}"
        /bin/bash -c "\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # Add Homebrew to PATH for this session
        if [[ -x /opt/homebrew/bin/brew ]]; then
            # Apple Silicon
            eval "\$(/opt/homebrew/bin/brew shellenv)"
        elif [[ -x /usr/local/bin/brew ]]; then
            # Intel
            eval "\$(/usr/local/bin/brew shellenv)"
        fi
        echo -e "\${GREEN}✅ Homebrew installed\${NC}"
    else
        echo -e "\${GREEN}✅ Homebrew found\${NC}"
    fi
    
    # Install missing packages one by one
    for cmd in "\${missing_commands[@]}"; do
        case \$cmd in
            "node")
                echo -e "\${CYAN}Installing Node.js...\${NC}"
                # First check if it might already be installed via nvm
                if [ -f "\$HOME/.nvm/nvm.sh" ]; then
                    source "\$HOME/.nvm/nvm.sh"
                    if command -v node &> /dev/null; then
                        echo -e "\${GREEN}✅ Node.js found via nvm\${NC}"
                        continue
                    fi
                fi
                
                # Try to install via Homebrew
                if brew install node; then
                    echo -e "\${GREEN}✅ Node.js installed\${NC}"
                else
                    echo -e "\${YELLOW}⚠ Homebrew install failed, trying alternative...\${NC}"
                    # Try downloading directly from Node.js website
                    NODE_VERSION="18.17.0"  # Stable LTS version
                    ARCH=\$(uname -m)
                    if [[ "\$ARCH" == "arm64" ]]; then
                        NODE_PKG="node-v\${NODE_VERSION}-darwin-arm64.tar.gz"
                    else
                        NODE_PKG="node-v\${NODE_VERSION}-darwin-x64.tar.gz"
                    fi
                    
                    cd /tmp
                    curl -O "https://nodejs.org/dist/v\${NODE_VERSION}/\${NODE_PKG}"
                    tar -xzf "\$NODE_PKG"
                    sudo mv "node-v\${NODE_VERSION}-darwin-\$ARCH" /usr/local/nodejs
                    sudo ln -sf /usr/local/nodejs/bin/node /usr/local/bin/node
                    sudo ln -sf /usr/local/nodejs/bin/npm /usr/local/bin/npm
                    sudo ln -sf /usr/local/nodejs/bin/npx /usr/local/bin/npx
                    echo -e "\${GREEN}✅ Node.js installed from official package\${NC}"
                fi
                ;;
                
            "npm")
                # npm comes with Node.js, so if we installed Node.js, npm should be there
                if command -v npm &> /dev/null; then
                    echo -e "\${GREEN}✅ npm found\${NC}"
                else
                    echo -e "\${YELLOW}⚠ npm not found, installing...\${NC}"
                    if curl -L https://www.npmjs.com/install.sh | sh; then
                        echo -e "\${GREEN}✅ npm installed\${NC}"
                    else
                        echo -e "\${RED}❌ Failed to install npm\${NC}"
                    fi
                fi
                ;;
                
            "python3")
                echo -e "\${CYAN}Installing Python 3...\${NC}"
                if brew install python@3.9; then
                    echo -e "\${GREEN}✅ Python 3 installed\${NC}"
                else
                    # Try older Python version for macOS 11 compatibility
                    echo -e "\${YELLOW}⚠ Trying Python 3.8 for macOS 11 compatibility...\${NC}"
                    brew install python@3.8
                fi
                ;;
                
            "git")
                echo -e "\${CYAN}Installing Git...\${NC}"
                brew install git
                echo -e "\${GREEN}✅ Git installed\${NC}"
                ;;
                
            "unzip")
                echo -e "\${CYAN}Installing unzip...\${NC}"
                brew install unzip
                echo -e "\${GREEN}✅ unzip installed\${NC}"
                ;;
                
            "curl")
                # curl should be installed on macOS, but just in case
                echo -e "\${CYAN}Installing curl...\${NC}"
                brew install curl
                echo -e "\${GREEN}✅ curl installed\${NC}"
                ;;
        esac
    done
    
else
    echo -e "\${GREEN}✅ All required dependencies are already installed!\${NC}"
fi

echo ""

# ===============================================
# CHECK NODE VERSION AND INSTALL GLOBAL PACKAGES
# ===============================================
echo -e "\${CYAN}📦 Checking Node.js setup...\${NC}"

# Verify Node.js is accessible
if ! command -v node &> /dev/null; then
    echo -e "\${RED}❌ Node.js command not found after installation\${NC}"
    echo -e "\${YELLOW}⚠ Trying to fix PATH...\${NC}"
    
    # Try common Node.js locations
    NODE_PATHS=(
        "/usr/local/bin/node"
        "/opt/homebrew/bin/node"
        "/usr/local/nodejs/bin/node"
        "\$HOME/.nvm/versions/node/*/bin/node"
        "\$HOME/.local/bin/node"
    )
    
    for path in "\${NODE_PATHS[@]}"; do
        if [ -f "\$path" ]; then
            export PATH="\$(dirname "\$path"):\$PATH"
            echo -e "\${GREEN}✅ Found Node.js at: \$path\${NC}"
            break
        fi
    done
fi

# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=\$(node -v)
    echo -e "\${GREEN}✅ Node.js version: \$NODE_VERSION\${NC}"
    
    # Install global npm packages if npm is available
    if command -v npm &> /dev/null; then
        echo -e "\${CYAN}Installing global npm packages...\${NC}"
        
        # Check for Electron
        if ! npm list -g electron 2>/dev/null | grep -q electron; then
            echo -e "\${YELLOW}⚠ Installing Electron globally...\${NC}"
            npm install -g electron || echo -e "\${YELLOW}⚠ Electron install failed, will use local install\${NC}"
        else
            echo -e "\${GREEN}✅ Electron found globally\${NC}"
        fi
        
        # Check for electron-builder
        if ! npm list -g electron-builder 2>/dev/null | grep -q electron-builder; then
            echo -e "\${YELLOW}⚠ Installing electron-builder globally...\${NC}"
            npm install -g electron-builder || echo -e "\${YELLOW}⚠ electron-builder install failed, will use local install\${NC}"
        else
            echo -e "\${GREEN}✅ electron-builder found globally\${NC}"
        fi
    else
        echo -e "\${YELLOW}⚠ npm not available for global package installation\${NC}"
    fi
else
    echo -e "\${RED}❌ Node.js not found. Cannot continue.\${NC}"
    echo -e "\${YELLOW}⚠ Please install Node.js manually and try again.\${NC}"
    exit 1
fi

echo -e "\${GREEN}✅ Environment setup complete!\${NC}"
echo ""

# ===============================================
# MAIN SCRIPT CONTINUES
# ===============================================

# Ask for app name
read -p "Enter your electron game app name (default: ${safeAppName}): " APPNAME
APPNAME=\${APPNAME:-${safeAppName}}

# Set game name
GAMENAME="${gameName}"

# ===============================================
# GAME DOWNLOAD WITH CACHE SUPPORT
# ===============================================
echo -e "\${CYAN}📥 Checking for cached game...\${NC}"

# Set up cache directory
CACHE_DIR="\$HOME/.cache/electron"
GAME_FILE="${game.name}.zip"
CACHE_PATH="\$CACHE_DIR/\$GAME_FILE"

# Create cache directory if it doesn't exist
mkdir -p "\$CACHE_DIR"

# Check if game is already cached
if [ -f "\$CACHE_PATH" ]; then
    echo -e "\${GREEN}✅ Game found in cache, copying...\${NC}"
    cp "\$CACHE_PATH" "\$GAME_FILE"
    echo -e "\${CYAN}📊 Cache info:\${NC}"
    ls -lh "\$CACHE_PATH"
else
    echo -e "\${YELLOW}⚠ Game not in cache, downloading...\${NC}"
    # Download with browser headers to avoid cdn throttling
    curl -L \\
      -H "Referer: https://myrient.erista.me/files/Redump/Sony%20-%20PlayStation/" \\
      -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \\
      -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8" \\
      -H "Accept-Language: en-US,en;q=0.9" \\
      -H "Accept-Encoding: gzip, deflate, br" \\
      -H "Connection: keep-alive" \\
      -H "Upgrade-Insecure-Requests: 1" \\
      -H "Sec-Fetch-Dest: document" \\
      -H "Sec-Fetch-Mode: navigate" \\
      -H "Sec-Fetch-Site: same-origin" \\
      -H "Sec-Fetch-User: ?1" \\
      "${game.link}" \\
      -o "\$GAME_FILE"
    
    # Verify download was successful
    if [ \$? -eq 0 ] && [ -s "\$GAME_FILE" ]; then
        echo -e "\${GREEN}✅ Download successful\${NC}"
        
        # Cache the downloaded game for future use
        echo -e "\${CYAN}💾 Caching game for future use...\${NC}"
        cp "\$GAME_FILE" "\$CACHE_PATH"
        echo -e "\${GREEN}✅ Game cached to ~/.cache/electron/\$GAME_FILE\${NC}"
    else
        echo -e "\${RED}❌ Download failed\${NC}"
        exit 1
    fi
fi

# ===============================================
# COVER IMAGE DOWNLOAD
# ===============================================
# Download cover image with fallback
echo -e "\${CYAN}🖼️  Downloading cover image...\${NC}"

# Also cache cover images
COVER_CACHE_DIR="\$CACHE_DIR/covers"
mkdir -p "\$COVER_CACHE_DIR"
COVER_CACHE_PATH="\$COVER_CACHE_DIR/${code}.png"

if [ -f "\$COVER_CACHE_PATH" ]; then
    echo -e "\${GREEN}✅ Cover found in cache, copying...\${NC}"
    cp "\$COVER_CACHE_PATH" "icon.png"
else
    if curl -L "${coverURL}" -o "icon.png" 2>/dev/null && [ -s "icon.png" ]; then
        echo -e "\${GREEN}✅ Cover image downloaded successfully\${NC}"
        # Cache the cover
        cp "icon.png" "\$COVER_CACHE_PATH"
    else
        echo -e "\${YELLOW}⚠ Original cover not found, downloading default...\${NC}"
        DEFAULT_COVER_CACHE="\$COVER_CACHE_DIR/default.png"
        if [ -f "\$DEFAULT_COVER_CACHE" ]; then
            cp "\$DEFAULT_COVER_CACHE" "icon.png"
            echo -e "\${GREEN}✅ Default cover from cache\${NC}"
        else
            curl -L "https://cdn.sdappnet.cloud/rtx/images/electron-sony-computer-entertainment.png" -o "icon.png"
            cp "icon.png" "\$DEFAULT_COVER_CACHE"
            echo -e "\${GREEN}✅ Default Cover image downloaded successfully\${NC}"
        fi
    fi
fi

# ===============================================
# GAME EXTRACTION
# ===============================================
echo -e "\${CYAN}📦 Extracting game...\${NC}"
# Create game directory
mkdir -p game/

# Check if game is already extracted in cache
GAME_EXTRACT_CACHE="\$CACHE_DIR/extracted/${safeCacheName}"
if [ -d "\$GAME_EXTRACT_CACHE" ] && [ "\$(ls -A \$GAME_EXTRACT_CACHE)" ]; then
    echo -e "\${GREEN}✅ Found extracted game in cache, copying...\${NC}"
    cp -r "\$GAME_EXTRACT_CACHE"/* game/
else
    unzip -o "\$GAME_FILE" -d game/
    
    # Cache the extracted game
    echo -e "\${CYAN}💾 Caching extracted game...\${NC}"
    mkdir -p "\$GAME_EXTRACT_CACHE"
    cp -r game/* "\$GAME_EXTRACT_CACHE/" 2>/dev/null || true
    echo -e "\${GREEN}✅ Extracted game cached\${NC}"
fi

# Download WebAssembly emulator files
echo -e "\${CYAN}⬇️  Downloading WebAssembly emulator files...\${NC}"

# Download PlayStation.html and PlayStation.js
echo -e "\${CYAN}📥 Downloading PlayStation.html...\${NC}"
curl -L "https://cdn.sdappnet.cloud/rtx/PlayStation.html" -o "PlayStation.html"

echo -e "\${CYAN}📥 Downloading PlayStation.js...\${NC}"
curl -L "https://cdn.sdappnet.cloud/rtx/PlayStation.js" -o "PlayStation.js"

# Download PlayStation boot video
echo -e "\${CYAN}🎬 Downloading PlayStation boot video...\${NC}"
mkdir -p public/videos
curl -L "https://cdn.sdappnet.cloud/rtx/images/PlayStationIntro1080p_ELECTRON.mp4" -o "public/videos/PlayStationIntro1080p_ELECTRON.mp4"

echo -e "\${GREEN}✅ All files downloaded\${NC}"

# Modify PlayStation.html for Electron
echo -e "\${CYAN}🔧 Modifying PlayStation.html for Electron...\${NC}"

# 1. Unmute the video
sed -i '' 's/video.muted = true;/video.muted = false;/g' PlayStation.html

# 2. Change PlayStation.js reference to local file
sed -i '' 's|https://cdn.sdappnet.cloud/rtx/PlayStation.js|./PlayStation.js|g' PlayStation.html

# 3. Add auto-load functionality at the end of the file
# We'll replace the video ended event handler
# First, find and replace the video ended event listener
cat > modify_video_ended.py << 'PYTHON_EOF'
import re

with open('PlayStation.html', 'r') as file:
    content = file.read()

# Find the video ended event listener
pattern = r'video\\.addEventListener\\("ended", \\s*\\(\\)\\s*=>\\s*\\{[^}]*\\}\\);'

# New video ended event handler with auto-load
new_handler = '''video.addEventListener("ended", () => {
    video.pause();
    video.remove();
    
    // Auto-load game after boot video
    if (window.startGameAfterBoot) {
        setTimeout(() => {
            window.startGameAfterBoot();
        }, 500);
    }
});'''

# Replace the event handler
modified_content = re.sub(pattern, new_handler, content, flags=re.DOTALL)

with open('PlayStation.html', 'w') as file:
    file.write(modified_content)
PYTHON_EOF

python3 modify_video_ended.py
rm modify_video_ended.py

# 4. Insert auto-load JavaScript before the closing </body> tag
# First, let's create a Python script to properly insert the JavaScript
cat > insert_script.py << 'PYTHON_EOF'
import re

with open('PlayStation.html', 'r') as file:
    content = file.read()

# Remove any existing auto-load script (in case we're re-running)
content = re.sub(r'<!-- Auto-load functionality for Electron -->.*?</script>', '', content, flags=re.DOTALL)

# The auto-load JavaScript to insert
auto_load_script = '''<!-- Auto-load functionality for Electron -->
<script>
    const path = require('path');
    const { ipcRenderer } = require('electron');
    
    // Global function to start game after boot
    window.startGameAfterBoot = function() {
        console.log('Boot video finished, loading game...');
        
        // Request game path from main process
        const gameURL = ipcRenderer.sendSync('request-game-path');
        console.log('Game URL received from main process:', gameURL);
        console.log('Type of gameURL:', typeof gameURL);
        
        if (gameURL) {
            console.log('Auto-loading game from URL:', gameURL);
            loadGameFromURL(gameURL);
        } else {
            console.log('No game file found, showing file dialog');
            // Show file dialog if no game found
            ipcRenderer.send('show-file-dialog');
        }
    };
    
    // Function to load a game from a file URL
    function loadGameFromURL(fileURL) {
        console.log('Loading game from URL:', fileURL);
        
        try {
            // Extract filename from URL (decode it first to get the actual filename)
            const decodedURL = decodeURI(fileURL);
            const urlParts = decodedURL.split('/');
            const filename = urlParts[urlParts.length - 1];
            console.log('Filename:', filename);
            
            // Ensure the URL is properly encoded for fetch
            // file:// URLs need spaces to be %20
            const encodedURL = encodeURI(fileURL);
            console.log('Encoded URL for fetch:', encodedURL);
                
            // Fetch the file directly using the file:// URL
            fetch(fileURL)
                .then(response => {
                    if (!response.ok) {
                        const error = 'HTTP error! status:' + response.status;
                        throw new Error(error);
                    }
                    return response.arrayBuffer();
                })
                .then(arrayBuffer => {
                    console.log('✅ Game file loaded successfully!');
                    console.log('📊 ArrayBuffer size:', arrayBuffer.byteLength, 'bytes');
                    
                    if (arrayBuffer.byteLength === 0) {
                        throw new Error('File is empty (0 bytes)');
                    }
                    
                    // Create a File object from the ArrayBuffer
                    const file = new File([arrayBuffer], filename, { 
                        type: 'application/octet-stream',
                        lastModified: Date.now()
                    });
                    
                    console.log('✅ File object created:', file.name, file.size, 'bytes');
                    
                    // Simulate file input change event
                    const fileInput = document.getElementById('gui_controls_file');
                    if (fileInput) {
                        console.log('✅ Found file input:', fileInput.id);
                        
                        // Create a DataTransfer to hold the file
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);
                        fileInput.files = dataTransfer.files;
                        
                        console.log('✅ Files assigned to input. File count:', fileInput.files.length);
                        console.log('✅ First file:', fileInput.files[0].name, fileInput.files[0].size, 'bytes');
                        
                        // Trigger the change event
                        console.log('🚀 Dispatching change event...');
                        const changeEvent = new Event('change', { bubbles: true });
                        fileInput.dispatchEvent(changeEvent);
                        
                        console.log('🎮 Game loading initiated!');
                    } else {
                        console.error('❌ File input element not found');
                        // Try alternative approach
                        console.log('🔍 Looking for any file input...');
                        const allInputs = document.querySelectorAll('input');
                        console.log('📊 Total inputs found:', allInputs.length);
                        for (let i = 0; i < allInputs.length; i++) {
                            console.log('Input ' + i + ':', allInputs[i].id, allInputs[i].type, allInputs[i].name);
                        }
                    }
                })
                .catch(error => {
                    console.error('❌ Error loading game from URL:', error);
                    alert('Failed to load game: ' + error.message);
                });
        } catch (error) {
            console.error('❌ Error processing game URL:', error);
            alert('Failed to load game: ' + error.message);
        }
    }
    
    // Listen for load-game events from main process
    ipcRenderer.on('load-game', (event, gameInfo) => {
        console.log('Received load-game event:', gameInfo);
        
        // If boot video is still playing, wait for it to finish
        const bootVideo = document.getElementById('startuplogo');
        if (bootVideo && !bootVideo.ended) {
            console.log('Boot video still playing, queuing game load');
            // Store game info to load after boot
            window.queuedGameInfo = gameInfo;
            
            // Modify the video ended handler to load this game
            bootVideo.addEventListener('ended', function onVideoEnd() {
                setTimeout(() => {
                    if (gameInfo.url) {
                        loadGameFromURL(gameInfo.url);
                    }
                }, 500);
            }, { once: true });
        } else {
            // Boot video already finished or doesn't exist, load immediately
            setTimeout(() => {
                if (gameInfo.url) {
                    loadGameFromURL(gameInfo.url);
                }
            }, 1000);
        }
    });
    
    // Listen for file dialog request
    ipcRenderer.on('show-file-dialog', () => {
        // Simulate click on file input
        const fileInput = document.getElementById('gui_controls_file');
        if (fileInput) {
            fileInput.click();
        }
    });
    
    // Notify main process that emulator is ready
    window.addEventListener('load', () => {
        setTimeout(() => {
            ipcRenderer.send('emulator-ready');
            
            // Check if boot video exists
            const bootVideo = document.getElementById('startuplogo');
            if (!bootVideo) {
                // No boot video, start game immediately
                window.startGameAfterBoot();
            }
            // If boot video exists, it will call startGameAfterBoot when finished
        }, 1000);
    });
    
    // Add keyboard shortcuts for fullscreen
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F11') {
            e.preventDefault();
            ipcRenderer.send('toggle-fullscreen');
        }
        
        if (e.key === 'Escape') {
            if (confirm('Exit game?')) {
                window.close();
            }
        }
        
        // Skip boot video with any key
        const bootVideo = document.getElementById('startuplogo');
        if (bootVideo && !bootVideo.ended) {
            if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
                bootVideo.currentTime = bootVideo.duration;
                bootVideo.dispatchEvent(new Event('ended'));
            }
        }
    });
</script>'''

# Generate meta tags
meta_tags = f'''    <!-- Game-specific Meta Tags -->
    <title>${gameName}</title>
    <meta name="description" content="">
    <meta name="keywords" content="${gameName}, PlayStation 1, electron, Retro Game, Electron, Emulator">
    
    <!-- Favicon and App Icons -->
    <link rel="icon" href="${coverURL}" type="image/png">
    <link rel="apple-touch-icon" href="${coverURL}" sizes="180x180">
    <link rel="icon" type="image/png" href="${coverURL}" sizes="192x192">
    <link rel="icon" type="image/png" href="${coverURL}" sizes="512x512">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:title" content="${gameName}">
    <meta property="og:description" content="">
    <meta property="og:image" content="https://cdn.sdappnet.cloud/rtx/images/electron.png">
    <meta property="og:url" content="">
    <meta property="og:type" content="game">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${gameName}">
    <meta name="twitter:description" content="">
    <meta name="twitter:image" content="https://cdn.sdappnet.cloud/rtx/images/electron.png">
    
    <!-- App-specific -->
    <meta name="application-name" content="${gameName}">
    <meta name="apple-mobile-web-app-title" content="${gameName}">
    <meta name="theme-color" content="#000000">'''

# Now update the <head> section to add our meta tags
# First, check if there's a <head> section
if '<head>' in content:
    # Find the <head> tag and insert our meta tags right after it
    head_pattern = r'(<head[^>]*>)'
    
    # Replace <head> with <head> + our meta tags
    def add_meta_tags_to_head(match):
        head_tag = match.group(1)
        return f'{head_tag}\\n{meta_tags}'
    
    content = re.sub(head_pattern, add_meta_tags_to_head, content, flags=re.IGNORECASE)
else:
    # If no <head> tag, create one at the beginning
    # Find <html> tag and add <head> after it
    html_pattern = r'(<html[^>]*>)'
    if re.search(html_pattern, content):
        def add_head_to_html(match):
            html_tag = match.group(1)
            return f'{html_tag}\\n<head>{meta_tags}\\n</head>'
        content = re.sub(html_pattern, add_head_to_html, content, flags=re.IGNORECASE)
    else:
        # No html either, just prepend everything
        content = f'<!DOCTYPE html>\\n<html>\\n<head>{meta_tags}\\n</head>\\n<body>\\n{content}\\n</body>\\n</html>'

# Also update any existing <title> tag if it exists
title_pattern = r'<title>[^<]*</title>'
if re.search(title_pattern, content):
    content = re.sub(title_pattern, f'<title>${gameName}</title>', content)

# Update any existing meta description
description_pattern = r'<meta[^>]*name=["\\\\\\'][^"\\']*description["\\\\\\'][^>]*>'
if re.search(description_pattern, content):
    content = re.sub(description_pattern, f'<meta name="description" content="${gameName}">', content)
else:
    # Add description meta if not present (already added in head but ensure it's there)
    head_end_pattern = r'(</head>)'
    if re.search(head_end_pattern, content):
        def add_description_before_head_end(match):
            return f'<meta name="description" content="${gameName}">\\n{match.group(1)}'
        content = re.sub(head_end_pattern, add_description_before_head_end, content)

print("✅ Updated HTML header with game title and favicon")

# Find the closing </body> tag and insert the script before it
if '</body>' in content:
    # Insert the script before </body>
    content = content.replace('</body>', f'{auto_load_script}\\n</body>')
else:
    # If no </body> tag, append to the end before </html>
    if '</html>' in content:
        content = content.replace('</html>', f'{auto_load_script}\\n</html>')
    else:
        # Just append to the end
        content += f'\\n{auto_load_script}'

with open('PlayStation.html', 'w') as file:
    file.write(content)
PYTHON_EOF

python3 insert_script.py
rm insert_script.py

# Create PROPER ICNS conversion script using EXACT working code
cat > convert_to_icns.sh << 'ICNS_EOF'
#!/bin/bash

# EXACT ICNS CREATION FROM WORKING SCRIPT
# This is the PROVEN working version from appgenesys_pc_macosx_create_toolbar_app_tutorial_screenshot.sh

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m'

echo -e "\${GREEN}Creating .icns file using proven method...\${NC}"

create_icns() {
    local source_image="\$1"
    local output_icns="\$2"
    
    if [ ! -f "\$source_image" ] || ! command -v sips &> /dev/null; then
        echo "⚠ Cannot create .icns: sips not available or no source image"
        return 1
    fi
    
    # Create iconset directory
    local iconset_dir="\${output_icns%.icns}.iconset"
    rm -rf "\$iconset_dir" 2>/dev/null
    mkdir -p "\$iconset_dir"
    
    # Required sizes for ICNS (standard macOS icon sizes)
    echo "Creating icon sizes..."
    
    # Standard sizes
    sips -z 16 16 "\$source_image" --out "\${iconset_dir}/icon_16x16.png" 2>/dev/null
    sips -z 32 32 "\$source_image" --out "\${iconset_dir}/icon_16x16@2x.png" 2>/dev/null
    sips -z 32 32 "\$source_image" --out "\${iconset_dir}/icon_32x32.png" 2>/dev/null
    sips -z 64 64 "\$source_image" --out "\${iconset_dir}/icon_32x32@2x.png" 2>/dev/null
    sips -z 128 128 "\$source_image" --out "\${iconset_dir}/icon_128x128.png" 2>/dev/null
    sips -z 256 256 "\$source_image" --out "\${iconset_dir}/icon_128x128@2x.png" 2>/dev/null
    sips -z 256 256 "\$source_image" --out "\${iconset_dir}/icon_256x256.png" 2>/dev/null
    sips -z 512 512 "\$source_image" --out "\${iconset_dir}/icon_256x256@2x.png" 2>/dev/null
    sips -z 512 512 "\$source_image" --out "\${iconset_dir}/icon_512x512.png" 2>/dev/null
    sips -z 1024 1024 "\$source_image" --out "\${iconset_dir}/icon_512x512@2x.png" 2>/dev/null
    
    # Additional required sizes
    sips -z 64 64 "\$source_image" --out "\${iconset_dir}/icon_64x64.png" 2>/dev/null
    sips -z 1024 1024 "\$source_image" --out "\${iconset_dir}/icon_1024x1024.png" 2>/dev/null
    
    # Convert to .icns
    if command -v iconutil &> /dev/null; then
        iconutil -c icns "\$iconset_dir" -o "\$output_icns" 2>/dev/null
        if [ -f "\$output_icns" ]; then
            echo "✅ Created professional .icns file: \$(basename "\$output_icns")"
            rm -rf "\$iconset_dir"
            return 0
        fi
    fi
    
    # Fallback: create simple .icns
    echo "⚠ Using fallback .icns creation"
    cp "\$source_image" "\$output_icns" 2>/dev/null || true
    rm -rf "\$iconset_dir" 2>/dev/null
    return 0
}

# Check for input file
input_file="\$1"
output_file="\$2"

if [ -z "\$input_file" ]; then
    echo "Usage: \$0 <input.png> [output.icns]"
    exit 1
fi

if [ ! -f "\$input_file" ]; then
    echo -e "\${RED}❌ Input file not found: \$input_file\${NC}"
    exit 1
fi

if [ -z "\$output_file" ]; then
    output_file="icon.icns"
fi

# Create the ICNS file
create_icns "\$input_file" "\$output_file"

if [ -f "\$output_file" ]; then
    echo -e "\${GREEN}✅ ICNS file created successfully: \$output_file\${NC}"
else
    echo -e "\${RED}❌ Failed to create ICNS file\${NC}"
fi
ICNS_EOF

chmod +x convert_to_icns.sh

echo -e "\${GREEN}✅ PlayStation.html modified for Electron\${NC}"

# Check if folder exists
if [ -d "\$APPNAME" ]; then
  read -p "Folder '\$APPNAME' already exists. Remove it? (y/N): " REMOVE
  REMOVE=\${REMOVE:-N}
  if [[ "\$REMOVE" == "y" || "\$REMOVE" == "Y" ]]; then
    echo "Removing existing folder '\$APPNAME'..."
    rm -rf "\$APPNAME"
  else
    echo "Exiting to avoid overwriting."
    exit 1
  fi
fi

# Create folder structure
mkdir -p "\$APPNAME/src" "\$APPNAME/game" "\$APPNAME/public" "\$APPNAME/public/videos" "\$APPNAME/build"
cd "\$APPNAME" || exit

# Move downloaded files
mv ../icon.png public/icon.png
mv -f ../game/* game/ 2>/dev/null || true
mv ../PlayStation.html src/index.html
mv ../PlayStation.js src/PlayStation.js
mv ../public/videos/PlayStationIntro1080p_ELECTRON.mp4 public/videos/PlayStationIntro1080p_ELECTRON.mp4
mv ../convert_to_icns.sh ./

# Convert PNG to ICNS
echo -e "\${CYAN}🎨 Converting icon to ICNS format...\${NC}"
# FIRST: Ensure the file is actually a PNG
echo -e "\${CYAN}🔍 Checking/Converting image format...\${NC}"
if command -v sips &> /dev/null; then
    # Convert whatever format to proper PNG
    sips -s format png "public/icon.png" --out "public/icon_proper.png" 2>/dev/null
    if [ -f "public/icon_proper.png" ] && [ -s "public/icon_proper.png" ]; then
        echo -e "\${GREEN}✅ Image converted to proper PNG format\${NC}"
        mv "public/icon_proper.png" "public/icon.png"
    else
        echo -e "\${YELLOW}⚠ Could not convert image, using as-is\${NC}"
    fi
fi
./convert_to_icns.sh "public/icon.png" "public/icon.icns"

# ===============================================
# 1. Create package.json
# ===============================================
cat << EOL > package.json
{
  "name": "\$APPNAME",
  "version": "1.0.0",
  "description": "\$GAMENAME - electron Game Wrapper",
  "main": "src/main.js",
  "scripts": {
    "start": "electron .",
    "dev": "electron . --dev",
    "build": "electron-builder",
    "build-mac": "electron-builder --mac",
    "build-win": "electron-builder --win",
    "pack-mac": "electron-builder --mac --dir",
    "pack-win": "electron-builder --win --dir",
    "install-mac": "./install.sh",
    "make-icon": "./convert_to_icns.sh public/icon.png public/icon.icns",
    "debug": "electron . --enable-logging --v=1"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.0.0"
  },
  "build": {
    "appId": "com.electrongame.\${code}",
    "productName": "\$GAMENAME",
    "directories": {
      "output": "dist"
    },
    "files": [
      "src/**/*",
      "public/**/*",
      "game/**/*",
      "!game/*.iso",
      "!game/*.bin",
      "!game/*.cue"
    ],
    "mac": {
      "target": "dmg",
      "category": "public.app-category.games",
      "icon": "public/icon.icns",
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "entitlements": "entitlements.mac.plist",
      "entitlementsInherit": "entitlements.mac.plist",
      "extendInfo": {
        "NSHighResolutionCapable": true,
        "NSCameraUsageDescription": "This app does not use camera",
        "NSMicrophoneUsageDescription": "This app does not use microphone"
      }
    },
    "win": {
      "target": "portable",
      "icon": "public/icon.ico"
    },
    "linux": {
      "target": "AppImage",
      "category": "Game"
    },
    "extraResources": [
      {
        "from": "game",
        "to": "game",
        "filter": ["**/*"]
      },
      {
        "from": "public/videos",
        "to": "videos",
        "filter": ["**/*"]
      } 
    ]
  }
}
EOL
 

# ===============================================
# 2. Create Electron Main Process
# ===============================================
cat << EOL > src/main.js
const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let gamePath = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    fullscreen: true,
    frame: true,
    titleBarStyle: 'hiddenInset', // macOS style with traffic lights
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
      webgl: true,
      experimentalFeatures: true
    },
    icon: path.join(__dirname, '../public/icon.icns'),
    show: false
  });

  // Load the modified PlayStation.html (now index.html)
  mainWindow.loadFile('src/index.html');

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Auto-start game after a short delay to let emulator initialize
    // The boot video will handle the actual game loading
    setTimeout(() => {
      autoStartGame();
    }, 1000);
  });

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Create minimal menu
  const template = [
    {
      label: 'Game',
      submenu: [
        {
          label: 'Load Game',
          accelerator: 'CmdOrCtrl+O',
          click: () => loadGame()
        },
        {
          label: 'Reset Game',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow.webContents.send('reset-game')
        },
        { type: 'separator' },
        {
          label: 'Save State',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow.webContents.send('save-state')
        },
        {
          label: 'Load State',
          accelerator: 'CmdOrCtrl+L',
          click: () => mainWindow.webContents.send('load-state')
        },
        { type: 'separator' },
        {
          label: 'Skip Boot Video',
          accelerator: 'CmdOrCtrl+B',
          click: () => skipBootVideo()
        },
        { type: 'separator' },
        {
          label: 'Fullscreen',
          accelerator: 'F11',
          click: () => toggleFullscreen()
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Emulator',
      submenu: [
        {
          label: 'Toggle Fast Forward',
          accelerator: 'Tab',
          click: () => mainWindow.webContents.send('toggle-fast-forward')
        },
        {
          label: 'Pause/Resume',
          accelerator: 'Space',
          click: () => mainWindow.webContents.send('toggle-pause')
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => showAbout()
        }
      ]
    },
    {
      label: 'View',
      submenu: [
          {
            label: 'Toggle DevTools',
            accelerator: process.platform === 'darwin' ? 'Cmd+Alt+I' : 'Ctrl+Shift+I',
            click: () => mainWindow.webContents.toggleDevTools()
          },
          {
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
            click: () => mainWindow.reload()
          }
        ]
    }
  ];

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('🎬 Attempting to auto-load startup video...');

    const resourcesPath = process.resourcesPath;
    console.log('📁 Resources path:', resourcesPath);

    const videosDir = path.join(resourcesPath, 'videos');
    console.log('🎞 Videos directory:', videosDir);

    try {
      if (!fs.existsSync(videosDir)) {
        console.error('❌ Videos directory does not exist:', videosDir);
        return;
      }

      const videoFile = 'PlayStationIntro1080p_ELECTRON.mp4';
      const videoPath = path.join(videosDir, videoFile);

      if (!fs.existsSync(videoPath)) {
        console.error('❌ Video file not found:', videoPath);
        return;
      }

      console.log('✅ Found startup video:', videoPath);

      // Generator-safe normalization
      const videoURL = 'file://' + videoPath.replace(/\\\\\\\/g, '/');

      mainWindow.webContents.executeJavaScript(\\\`(function () {
        const video = document.getElementById("startuplogo");
        if (!video) {
          console.error("❌ Video element not found");
          return;
        }

        video.src = "\\\${videoURL}";
        video.load();
        console.log("✅ Startup video source set:", video.src);
      })();
      \\\`);

    } catch (err) {
      console.error('❌ Failed to load startup video:', err);
    }
  });


  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function autoStartGame() {
  console.log('🔍 Starting game auto-load...');

  // In development, use local game directory
  // In production, use extraResources path
  let gameDir;
  
  if (app.isPackaged) {
    // In packaged app, extraResources are placed outside app.asar
    gameDir = path.join(process.resourcesPath, './game');
    
    // Alternative location for newer electron-builder
    if (!fs.existsSync(gameDir)) {
      gameDir = path.join(process.resourcesPath, '../Resources/game');
    }
    
    // Another alternative location
    if (!fs.existsSync(gameDir)) {
      gameDir = path.join(process.resourcesPath, '../app.asar.unpacked/game');
    }
  } else {
    // In development, use local game directory
    gameDir = path.join(__dirname, '../game');
  }
  
  console.log('🎮 Game directory:', gameDir);

  try {
    if (!fs.existsSync(gameDir)) {
      console.log('❌ Game directory does not exist:', gameDir);
      
      // Try to find game directory by searching common locations
      const searchPaths = [
        path.join(process.resourcesPath, './game'),
        path.join(process.resourcesPath, '../game'),
        path.join(process.resourcesPath, '../Resources/game'),
        path.join(process.resourcesPath, '../app.asar.unpacked/game'),
        path.join(app.getAppPath(), 'game'),
        path.join(process.cwd(), 'game'),
        path.join(__dirname, '../game'),
        path.join(__dirname, '../../game')
      ];
      
      console.log('🔍 Searching for game in possible locations...');
      for (const searchPath of searchPaths) {
        console.log('   Checking:', searchPath);
        if (fs.existsSync(searchPath)) {
          gameDir = searchPath;
          console.log('✅ Found game at:', gameDir);
          break;
        }
      }
    } else {
      console.log('✅ Game directory exists');
    }

    if (fs.existsSync(gameDir)) {
      const files = fs.readdirSync(gameDir);
      console.log('📄 Game files:', files);

      const gameFile = files.find(f =>
        f.toLowerCase().endsWith('.cue') ||
        f.toLowerCase().endsWith('.bin') ||
        f.toLowerCase().endsWith('.iso') ||
        f.toLowerCase().endsWith('.pbp') ||
        f.toLowerCase().endsWith('.img')
      );

      if (gameFile) {
        let gamePath = path.join(gameDir, gameFile);
        console.log('✅ Found game file:', gamePath);
        console.log('✅ File exists:', fs.existsSync(gamePath));

        // Create a file:// URL that the renderer can use
        const fileURL = 'file://' + gamePath;
        console.log('🔗 File URL:', fileURL);

        // Send the file URL to the renderer
        mainWindow.webContents.send('load-game', {
          url: fileURL,
          filename: gameFile
        });
        return;
      } else {
        console.log('❌ No game file found in:', gameDir);
      }
    }

  } catch (error) {
    console.error('❌ Error in autoStartGame:', error);
  }

  console.log('⚠ Could not auto-start game, user will need to load manually');
}


function loadGame() {
  dialog.showOpenDialog(mainWindow, {
    title: 'Select electron Game File',
    filters: [
      { name: 'electron Games', extensions: ['cue', 'bin', 'iso', 'pbp', 'img'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      gamePath = result.filePaths[0];
      const filename = path.basename(gamePath);
      mainWindow.webContents.send('load-game', {
        path: gamePath,
        filename: filename
      });
    }
  }).catch(err => {
    console.error('Error loading game:', err);
  });
}

function skipBootVideo() {
  mainWindow.webContents.executeJavaScript(\\\`
    const bootVideo = document.getElementById('startuplogo');
    if (bootVideo && !bootVideo.ended) {
      bootVideo.currentTime = bootVideo.duration;
      bootVideo.dispatchEvent(new Event('ended'));
    }
  \\\`);
}

function toggleFullscreen() {
  mainWindow.setFullScreen(!mainWindow.isFullScreen());
}

function showAbout() {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'About',
    message: '\$GAMENAME',
    detail: 'electron Game Wrapper for macOS\\\\n\\\\nBuilt with Electron and WebAssembly electron Emulator\\\\n\\\\nIncludes authentic PlayStation boot video\\\\n\\\\nEnjoy the game!'
  });
}

// Add this new IPC handler to read game file content
// Add this new IPC handler to read game file content
ipcMain.on('read-game-file', (event, data) => {
  console.log('📖 Reading game file request received');
  console.log('Full data:', data);
  
  try {
    let filePath = data.path;
    const filename = data.filename;
    
    console.log('📁 File path received:', filePath);
    
    // Decode URI-encoded path
    if (filePath) {
      filePath = decodeURI(filePath);
      console.log('📁 Decoded file path:', filePath);
    }
    
    // Handle file:// URLs if present
    if (filePath && filePath.startsWith('file://')) {
      console.log('⚠ Converting file:// URL to real path');
      filePath = decodeURI(filePath.replace('file://', ''));
      console.log('📁 After file:// removal:', filePath);
    }
    
    console.log('🔍 Final file path to check:', filePath);
    
    if (!filePath) {
      throw new Error('No file path provided');
    }
    
    // Check if file exists
    console.log('🔍 Checking if file exists...');
    const fileExists = fs.existsSync(filePath);
    console.log('✅ File exists?', fileExists);
    
    if (!fileExists) {
      // Try alternative: maybe the path needs to be normalized
      const normalizedPath = path.normalize(filePath);
      console.log('🔄 Trying normalized path:', normalizedPath);
      
      if (!fs.existsSync(normalizedPath)) {
        throw new Error('File does not exist: ' + filePath);
      }
      filePath = normalizedPath;
    }
    
    console.log('✅ File exists! Reading...');
    
    // Get file stats
    const stats = fs.statSync(filePath);
    console.log('📊 File size from stats:', stats.size, 'bytes');
    
    if (stats.size === 0) {
      throw new Error('File is empty (0 bytes): ' + filePath);
    }
    
    // Read the file as a buffer
    const fileBuffer = fs.readFileSync(filePath);
    console.log('📊 Buffer size after reading:', fileBuffer.length, 'bytes');
    
    if (fileBuffer.length === 0) {
      throw new Error('Buffer is empty after reading: ' + filePath);
    }
    
    // FIXED: Use Base64 encoding for large files instead of converting to array
    // This avoids "Invalid array length" errors for large game files
    console.log('🔄 Converting buffer to Base64...');
    const base64Data = fileBuffer.toString('base64');
    console.log('📊 Base64 length:', base64Data.length);
    
    // Send the file content back to renderer
    event.sender.send('game-file-content', {
      success: true,
      filename: filename,
      base64Data: base64Data,  // Send as Base64 instead of array
      size: fileBuffer.length
    });
    
    console.log('✅ Game file content sent to renderer!');
    
  } catch (error) {
    console.error('❌ Failed to read game file:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Send error back to renderer
    event.sender.send('game-file-content', {
      success: false,
      error: error.message,
      filename: data ? data.filename : 'unknown'
    });
  }
});


// IPC handler for requesting game path - UPDATED
ipcMain.on('request-game-path', (event) => {
  console.log('🔍 Renderer requested game path');

  let gameDir;
  
  if (app.isPackaged) {
    gameDir = path.join(process.resourcesPath, './game');
    
    if (!fs.existsSync(gameDir)) {
      gameDir = path.join(process.resourcesPath, '../Resources/game');
    }
    
    if (!fs.existsSync(gameDir)) {
      gameDir = path.join(process.resourcesPath, '../app.asar.unpacked/game');
    }
  } else {
    gameDir = path.join(__dirname, '../game');
  }

  console.log('🎮 Game directory:', gameDir);

  let foundGameURL = null;

  try {
    if (fs.existsSync(gameDir)) {
      const files = fs.readdirSync(gameDir);
      const gameFile = files.find(f =>
        f.toLowerCase().endsWith('.cue') ||
        f.toLowerCase().endsWith('.bin') ||
        f.toLowerCase().endsWith('.iso') ||
        f.toLowerCase().endsWith('.pbp') ||
        f.toLowerCase().endsWith('.img')
      );

      if (gameFile) {
        const gamePath = path.join(gameDir, gameFile);
        foundGameURL = 'file://' + gamePath;
        console.log('✅ Auto-found game file (URL):', foundGameURL);
      }
    }
  } catch (err) {
    console.error('❌ Error finding game path:', err);
  }

  // Return the file URL
  event.returnValue = foundGameURL;
});

ipcMain.on('emulator-ready', (event) => {
  console.log('Emulator is ready');
});

ipcMain.on('toggle-fullscreen', (event) => {
  toggleFullscreen();
});

// App event listeners
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
EOL

# ===============================================
# 3. Create Install Script (AUTO-INSTALL TO APPLICATIONS + DOCK)
# ===============================================
cat << EOL > install.sh
#!/bin/bash

# ===============================================
# Auto-Install Script for \$GAMENAME
# Installs to /Applications and adds to Dock
# ===============================================

RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
CYAN='\\033[0;36m'
NC='\\033[0m'

echo -e "\\\${CYAN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         Auto-Installing \$GAMENAME to macOS                   ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "\\\${NC}"

# Check if we're on macOS
if [[ "\\\$(uname)" != "Darwin" ]]; then
  echo -e "\\\${RED}❌ This script only works on macOS\\\${NC}"
  exit 1
fi

# Check for sudo
if [ "\\\$EUID" -ne 0 ]; then 
  echo -e "\\\${YELLOW}⚠ This script needs sudo to install to /Applications\\\${NC}"
  echo -e "\\\${CYAN}Please enter your password when prompted\\\${NC}"
fi

# Build the app first
echo -e "\\\${CYAN}⚡ Building \$GAMENAME...\\\${NC}"
npm run build-mac

BUILD_RESULT=\\\$?
if [ \\\$BUILD_RESULT -ne 0 ]; then
  echo -e "\\\${YELLOW}⚠ Build had issues, checking if app was created anyway...\\\${NC}"
  
  # Check if app was partially created
  if [ -d "dist/mac" ]; then
    APP_PATH=\\\$(find "dist/mac" -name "*.app" -type d | head -1)
    if [ -n "\\\$APP_PATH" ] && [ -d "\\\$APP_PATH" ]; then
      echo -e "\\\${GREEN}✅ App was created despite warnings: \\\$(basename "\\\$APP_PATH")\\\${NC}"
      echo -e "\\\${YELLOW}⚠ Continuing with installation...\\\${NC}"
    else
      echo -e "\\\${RED}❌ Build failed. Cannot install.\\\${NC}"
      exit 1
    fi
  else
    echo -e "\\\${RED}❌ Build failed. Cannot install.\\\${NC}"
    exit 1
  fi
fi

# Find the built .app - SIMPLIFIED VERSION
echo -e "\\\${CYAN}🔍 Looking for built app...\\\${NC}"

APP_PATH=""

# Try dist/mac/ first (where electron-builder puts it)
if [ -d "dist/mac" ]; then
  # Use find to handle spaces properly
  APP_PATH=\\\$(find "dist/mac" -name "*.app" -type d | head -1)
  if [ -n "\\\$APP_PATH" ] && [ -d "\\\$APP_PATH" ]; then
    echo -e "\\\${GREEN}✅ Found app: \\\$(basename "\\\$APP_PATH")\\\${NC}"
  fi
fi

# If still not found, look in dist root
if [ -z "\\\$APP_PATH" ] && [ -d "dist" ]; then
  APP_PATH=\\\$(find "dist" -maxdepth 2 -name "*.app" -type d | head -1)
  if [ -n "\\\$APP_PATH" ] && [ -d "\\\$APP_PATH" ]; then
    echo -e "\\\${GREEN}✅ Found app: \\\$(basename "\\\$APP_PATH")\\\${NC}"
  fi
fi

# If still not found, try DMG approach
if [ -z "\\\$APP_PATH" ] || [ ! -d "\\\$APP_PATH" ]; then
  echo -e "\\\${CYAN}📦 Checking for DMG file...\\\${NC}"
  
  # Find DMG file safely
  DMG_FILE=\\\$(find "dist" -name "*.dmg" -type f -maxdepth 1 | head -1)
  
  if [ -n "\\\$DMG_FILE" ] && [ -f "\\\$DMG_FILE" ]; then
    echo -e "\\\${GREEN}✅ Found DMG: \\\$(basename "\\\$DMG_FILE")\\\${NC}"
    echo -e "\\\${YELLOW}⚠ Skipping DMG mount (spaces in filename cause issues)\\\${NC}"
    echo -e "\\\${YELLOW}⚠ Using app directly from dist/mac/ instead\\\${NC}"
    
    # Try one more time to find the app
    APP_PATH=\\\$(find "dist/mac" -name "*.app" -type d | head -1)
  fi
fi

if [ -z "\\\$APP_PATH" ] || [ ! -d "\\\$APP_PATH" ]; then
  echo -e "\\\${RED}❌ Could not find built .app file\\\${NC}"
  echo -e "\\\${CYAN}📁 Checking dist folder contents:\\\${NC}"
  ls -la dist/ 2>/dev/null || echo "dist/ directory not found"
  if [ -d "dist/mac" ]; then
    echo "dist/mac contents:"
    ls -la dist/mac/
    echo ""
    echo -e "\\\${CYAN}💡 Try running manually:\\\${NC}"
    echo "  sudo cp -R \\\"dist/mac/\$GAMENAME.app\\\" \\\"/Applications/\\\""
  fi
  exit 1
fi

echo -e "\\\${GREEN}✅ Found app: \\\$APP_PATH\\\${NC}"

# Install to /Applications
echo -e "\\\${CYAN}📁 Installing to /Applications...\\\${NC}"

# Remove old version if exists
if [ -d "/Applications/\$GAMENAME.app" ]; then
  echo -e "\\\${YELLOW}⚠ Removing existing version from /Applications\\\${NC}"
  sudo rm -rf "/Applications/\$GAMENAME.app"
fi

# Copy to Applications
sudo cp -R "\\\$APP_PATH" "/Applications/\$GAMENAME.app"

if [ \\\$? -eq 0 ]; then
  echo -e "\\\${GREEN}✅ Successfully installed to /Applications/\$GAMENAME.app\\\${NC}"
  
  # Fix permissions
  sudo chmod -R 755 "/Applications/\$GAMENAME.app"
  sudo chown -R root:wheel "/Applications/\$GAMENAME.app"
  
  echo -e "\\\${GREEN}✅ Permissions fixed\\\${NC}"
  
  # Remove quarantine flag
  xattr -dr com.apple.quarantine "/Applications/\$GAMENAME.app" 2>/dev/null || true
  echo -e "\\\${GREEN}✅ Quarantine flag removed\\\${NC}"
else
  echo -e "\\\${RED}❌ Failed to copy to /Applications\\\${NC}"
  exit 1
fi

# Ask to add to Dock
echo ""
read -p "Add \$GAMENAME to Dock? (y/N): " ADD_TO_DOCK
ADD_TO_DOCK=\\\${ADD_TO_DOCK:-N}

if [[ "\\\$ADD_TO_DOCK" == "y" || "\\\$ADD_TO_DOCK" == "Y" ]]; then
  echo -e "\\\${CYAN}📌 Adding to Dock...\\\${NC}"
  
  # Add to Dock using defaults command
  defaults write com.apple.dock persistent-apps -array-add "<dict><key>tile-data</key><dict><key>file-data</key><dict><key>_CFURLString</key><string>/Applications/\$GAMENAME.app</string><key>_CFURLStringType</key><integer>0</integer></dict></dict></dict>"
  
  # Restart Dock to apply changes
  killall Dock 2>/dev/null || true
  
  echo -e "\\\${GREEN}✅ Added \$GAMENAME to Dock!\\\${NC}"
  echo -e "\\\${YELLOW}⚠ Note: Dock must restart to show the icon\\\${NC}"
fi

# Create desktop shortcut (optional)
read -p "Create desktop shortcut? (y/N): " DESKTOP_SHORTCUT
DESKTOP_SHORTCUT=\\\${DESKTOP_SHORTCUT:-N}

if [[ "\\\$DESKTOP_SHORTCUT" == "y" || "\\\$DESKTOP_SHORTCUT" == "Y" ]]; then
  echo -e "\\\${CYAN}🖥️  Creating desktop shortcut...\\\${NC}"
  
  # Create AppleScript to make alias
  osascript <<OSA_EOF
tell application "Finder"
  make new alias file at desktop to POSIX file "/Applications/\$GAMENAME.app"
  set name of result to "\$GAMENAME"
end tell
OSA_EOF
  
  echo -e "\\\${GREEN}✅ Desktop shortcut created!\\\${NC}"
fi

# Create launch script
cat << LAUNCH_EOF > "\\\$(pwd)/launch.sh"
#!/bin/bash
open "/Applications/\$GAMENAME.app"
LAUNCH_EOF

chmod +x "\\\$(pwd)/launch.sh"

echo ""
echo -e "\\\${GREEN}═══════════════════════════════════════════════════════════════\\\${NC}"
echo -e "\\\${GREEN}🎉 INSTALLATION COMPLETE! 🎉\\\${NC}"
echo ""
echo -e "\\\${CYAN}📋 What was installed:\\\${NC}"
echo "   ✅ /Applications/\$GAMENAME.app"
echo "   ✅ Launch script: \\\$(pwd)/launch.sh"
if [[ "\\\$ADD_TO_DOCK" == "y" || "\\\$ADD_TO_DOCK" == "Y" ]]; then
  echo "   ✅ Added to Dock (requires restart)"
fi
if [[ "\\\$DESKTOP_SHORTCUT" == "y" || "\\\$DESKTOP_SHORTCUT" == "Y" ]]; then
  echo "   ✅ Desktop shortcut created"
fi
echo ""
echo -e "\\\${CYAN}🎮 Features included:\\\${NC}"
echo "   • Authentic PlayStation boot video"
echo "   • Auto-loads your game"
echo "   • Fullscreen immersive experience"
echo "   • Professional macOS icon (ICNS)"
echo ""
echo -e "\\\${CYAN}🚀 How to launch:\\\${NC}"
echo "   1. Open from /Applications folder"
echo "   2. Click Dock icon (if added)"
echo "   3. Run: ./launch.sh"
echo "   4. Or double-click desktop shortcut"
echo ""
echo -e "\\\${CYAN}🔧 First run note:\\\${NC}"
echo "   • Right-click the app and select 'Open' the first time"
echo "   • Click 'Open' when prompted about unidentified developer"
echo ""
echo -e "\\\${GREEN}🎮 Enjoy playing \$GAMENAME! 🎮\\\${NC}"
echo -e "\\\${GREEN}═══════════════════════════════════════════════════════════════\\\${NC}"
EOL

chmod +x install.sh

# ===============================================
# 4. Create Build Script
# ===============================================
cat << EOL > build.sh
#!/bin/bash

# Build script for \$GAMENAME electron Wrapper

RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
CYAN='\\033[0;36m'
NC='\\033[0m'

echo -e "\${CYAN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║ Building \$GAMENAME electron Wrapper                                ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "\${NC}"

# Check prerequisites
echo -e "\${CYAN}🔍 Checking prerequisites...\${NC}"

if ! command -v node &> /dev/null; then
  echo -e "\${RED}❌ Node.js not found. Please install Node.js 18+\${NC}"
  exit 1
fi

if ! command -v npm &> /dev/null; then
  echo -e "\${RED}❌ npm not found. Please install npm\${NC}"
  exit 1
fi

echo -e "\${GREEN}✅ Prerequisites satisfied\${NC}"

# Install dependencies
echo -e "\${CYAN}📦 Installing dependencies...\${NC}"
npm install

if [ \$? -ne 0 ]; then
  echo -e "\${RED}❌ Failed to install dependencies\${NC}"
  exit 1
fi

echo -e "\${GREEN}✅ Dependencies installed\${NC}"

# Update icon if needed
echo -e "\${CYAN}🎨 Updating icon files...\${NC}"
if [ -f "convert_to_icns.sh" ]; then
    ./convert_to_icns.sh "public/icon.png" "public/icon.icns"
else
    echo -e "\${YELLOW}⚠ Icon conversion script not found\${NC}"
fi

# Ask for build target
echo -e "\${CYAN}🎯 Select build target:\${NC}"
echo "1) macOS (.dmg)"
echo "2) Windows (.exe)"
echo "3) Both"
echo "4) Development build (no packaging)"

read -p "Choice [1-4]: " build_choice

case \$build_choice in
  1)
    echo -e "\${CYAN}⚡ Building for macOS...\${NC}"
    npm run build-mac
    ;;
  2)
    echo -e "\${CYAN}⚡ Building for Windows...\${NC}"
    npm run build-win
    ;;
  3)
    echo -e "\${CYAN}⚡ Building for both platforms...\${NC}"
    npm run build-mac
    npm run build-win
    ;;
  4)
    echo -e "\${CYAN}🚀 Starting development mode...\${NC}"
    npm run dev
    exit 0
    ;;
  *)
    echo -e "\${CYAN}⚡ Building for macOS (default)...\${NC}"
    npm run build-mac
    ;;
esac

if [ \$? -ne 0 ]; then
  echo -e "\${RED}❌ Build failed\${NC}"
  exit 1
fi

echo -e "\${GREEN}✅ Build completed successfully!\${NC}"
echo ""
echo -e "\${YELLOW}📦 Output location:\${NC}"
echo " dist/"
echo ""
echo -e "\${CYAN}📋 Features included:\${NC}"
echo " • WebAssembly PlayStation emulator"
echo " • Authentic PlayStation boot video"
echo " • Auto-load game functionality"
echo " • Professional macOS icon (ICNS)"
echo " • Fullscreen immersive experience"
echo ""
echo -e "\${CYAN}🚀 To run in development:\${NC}"
echo " npm run dev"
echo ""
echo -e "\${CYAN}⚡ To install to /Applications:\${NC}"
echo " ./install.sh"
echo ""
echo -e "\${GREEN}✅ Your \$GAMENAME electron wrapper is ready!\${NC}"
EOL

chmod +x build.sh

# ===============================================
# FINAL MESSAGE AND AUTO-BUILD
# ===============================================
echo -e "\${GREEN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║ electron GAME WRAPPER CREATED!                                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "\${NC}"

echo ""
echo -e "\${CYAN}🎉 \$GAMENAME electron WRAPPER CREATED!\${NC}"
echo ""
echo -e "\${YELLOW}📁 Project location:\${NC} \$APPNAME/"
echo -e "\${YELLOW}🎮 Emulator:\${NC} WebAssembly PlayStation Emulator"
echo -e "\${YELLOW}🎬 Boot video:\${NC} Downloaded and embedded"
echo -e "\${YELLOW}🔊 Audio:\${NC} Video unmuted for Electron"
echo -e "\${YELLOW}⚡ Auto-load:\${NC} Game loads after boot video"
echo -e "\${YELLOW}🎨 Icons:\${NC} Professional ICNS file created"
echo ""


# ===============================================
# AUTO-BUILD SECTION
# ===============================================
echo -e "\${CYAN}⚡ STARTING AUTO-BUILD PROCESS...\${NC}"
echo ""

# We are already inside the app directory, no need to cd again
echo -e "\${CYAN}📁 Current directory: \$(pwd)\${NC}"
echo -e "\${GREEN}✅ Already in app directory\${NC}"
echo ""

# Step 1: Install npm dependencies
echo -e "\${CYAN}📦 Step 1: Installing npm dependencies...\${NC}"
if npm install; then
    echo -e "\${GREEN}✅ npm dependencies installed\${NC}"
else
    echo -e "\${YELLOW}⚠ npm install had issues, trying with --force...\${NC}"
    npm install --force || echo -e "\${YELLOW}⚠ Continuing with build despite npm issues\${NC}"
fi
echo ""

# Step 2: Build for macOS
echo -e "\${CYAN}🔨 Step 2: Building macOS application...\${NC}"
echo -e "\${YELLOW}This may take 1-2 minutes...\${NC}"

# First try a packed build (directory)
echo -e "\${CYAN}Building app package...\${NC}"
if npm run pack-mac; then
    echo -e "\${GREEN}✅ App package built successfully\${NC}"
    
    # Now build the DMG
    echo -e "\${CYAN}Creating DMG installer...\${NC}"
    if npm run build-mac; then
        echo -e "\${GREEN}✅ DMG installer created\${NC}"
        
        # Check what was created
        if [ -d "dist/mac" ]; then
            APP_PATH="dist/mac/\$GAMENAME.app"
        elif [ -d "dist" ]; then
            # Look for .app or .dmg in dist
            if ls dist/*.app 1> /dev/null 2>&1; then
                APP_PATH="\$(ls -d dist/*.app | head -1)"
            elif ls dist/*.dmg 1> /dev/null 2>&1; then
                DMG_PATH="\$(ls -d dist/*.dmg | head -1)"
            fi
        fi
        
        # Report what was created
        echo ""
        echo -e "\${GREEN}📁 BUILD OUTPUT:\${NC}"
        echo "dist/ directory contents:"
        ls -la dist/ 2>/dev/null || echo "dist/ directory not found"
        
        if [ -d "dist/mac" ]; then
            echo ""
            echo "dist/mac contents:"
            ls -la dist/mac/
        fi
    else
        echo -e "\${YELLOW}⚠ DMG creation failed, but app package was created\${NC}"
    fi
else
    echo -e "\${YELLOW}⚠ Build failed, trying alternative build method...\${NC}"
    
    # Try direct electron-builder command
    if npx electron-builder --mac --dir; then
        echo -e "\${GREEN}✅ Alternative build successful\${NC}"
    else
        echo -e "\${YELLOW}⚠ Build encountered issues\${NC}"
        echo -e "\${CYAN}You can try building manually with:\${NC}"
        echo "  npm run build-mac"
        echo "  OR"
        echo "  ./build.sh"
    fi
fi
echo ""

# Step 3: Show installation options
echo -e "\${CYAN}📋 Step 3: Installation options\${NC}"
echo ""
echo -e "\${YELLOW}Your electron wrapper for '\$GAMENAME' is ready!\${NC}"
echo ""
echo -e "\${GREEN}📦 What was created:\${NC}"
echo "  • Complete Electron app structure"
echo "  • PlayStation emulator integrated"
echo "  • Boot video included"
echo "  • Game files in place"
echo "  • Professional macOS icon"
echo ""
echo -e "\${CYAN}🚀 AVAILABLE COMMANDS:\${NC}"
echo ""
echo -e "\${GREEN}1. TEST THE APP (Development Mode):\${NC}"
echo "   cd \$APPNAME && npm run dev"
echo ""
echo -e "\${GREEN}2. RE-BUILD (if needed):\${NC}"
echo "   cd \$APPNAME && ./build.sh"
echo "   OR"
echo "   cd \$APPNAME && npm run build-mac"
echo ""
echo -e "\${GREEN}3. INSTALL TO APPLICATIONS (Auto-install):\${NC}"
echo "   cd \$APPNAME && ./install.sh"
echo ""
echo -e "\${GREEN}4. RUN FROM CURRENT BUILD:\${NC}"
echo "   # If .app was created:"
if [ -n "\$APP_PATH" ] && [ -d "\$APP_PATH" ]; then
    echo "   open "\$APP_PATH""
elif [ -n "\$DMG_PATH" ] && [ -f "\$DMG_PATH" ]; then
    echo "   open "\$DMG_PATH""
else
    echo "   # Check dist/ folder for the built app"
    echo "   ls -la dist/"
fi
echo ""
echo -e "\${GREEN}5. UPDATE ICON (if needed):\${NC}"
echo "   cd \$APPNAME && ./convert_to_icns.sh public/icon.png public/icon.icns"
echo ""

# Step 4: Offer to run the installer
echo -e "\${CYAN}🤔 Would you like to install to /Applications now?\${NC}"
read -p "Run auto-installer? (y/N): " RUN_INSTALLER
RUN_INSTALLER=\${RUN_INSTALLER:-N}

if [[ "\$RUN_INSTALLER" == "y" || "\$RUN_INSTALLER" == "Y" ]]; then
    echo ""
    echo -e "\${CYAN}⚡ Running auto-installer...\${NC}"
    if [ -f "./install.sh" ]; then
        chmod +x ./install.sh
        ./install.sh
    else
        echo -e "\${RED}❌ install.sh not found\${NC}"
        echo -e "\${YELLOW}You can install manually by building first:\${NC}"
        echo "  npm run build-mac"
        echo "  Then check the dist/ folder"
    fi
else
    echo ""
    echo -e "\${YELLOW}⚠ Skipping auto-install. You can install later with:\${NC}"
    echo "  cd \$APPNAME && ./install.sh"
fi

echo ""
echo -e "\${GREEN}═══════════════════════════════════════════════════════════════\${NC}"
echo -e "\${GREEN}🎉 BUILD PROCESS COMPLETE! 🎉\${NC}"
echo -e "\${GREEN}═══════════════════════════════════════════════════════════════\${NC}"
echo ""
echo -e "\${CYAN}Quick start:\${NC}"
echo "  1. cd \$APPNAME"
echo "  2. npm run dev          # Test in development mode"
echo "  3. ./install.sh         # Install to Applications when ready"
echo ""
echo -e "\${YELLOW}🔥 TROUBLESHOOTING:\${NC}"
echo "  • If build fails, try: npm run pack-mac (creates .app without DMG)"
echo "  • For icon issues: ./convert_to_icns.sh public/icon.png public/icon.icns"
echo "  • Check logs: Look in dist/ folder for output"
echo ""
echo -e "\${GREEN}🎮 Enjoy playing \$GAMENAME! 🎮\${NC}"`;
}
