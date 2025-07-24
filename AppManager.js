// App Manager Script for PlayCanvas - Controls switching between different scenes
var AppManager = pc.createScript('AppManager');

// Add script attributes for editor configuration
AppManager.attributes.add('currentMode', { 
    type: 'string', 
    default: 'none', 
    enum: [
        { 'None': 'none' },
        { 'Home': 'home' },
        { 'Marching Cubes': 'marchingCubes' },
        { 'Euler': 'euler' }
    ],
    title: 'Current Mode' 
});
AppManager.attributes.add('isViverse', { type: 'boolean', default: false, title: 'Is Viverse' });
AppManager.attributes.add('enableDebug', { type: 'boolean', default: true, title: 'Enable Debug Logs' });

// Initialize code called once per entity
AppManager.prototype.initialize = function() {
    console.log("🚀 App Manager initialized - Interspecifics Sonic Machines");
    
    // Load Roboto font from Google Fonts
    this.loadRobotoFont();
    
    // Detect if we're running in Viverse
    this.runningInViverse = this.isViverse || (window.viverse !== undefined);
    console.log("Running in Viverse:", this.runningInViverse);
    
    // Mode management state
    // IMPORTANT: Detect actual mode based on scene and entities, not just currentMode attribute
    this.activeMode = this.detectActualMode();
    this.isTransitioning = false;
    
    // Audio context management
    this.audioContextStarted = false;
    
    // Create mode switcher UI (always visible)
    this.createModeSwitcherUI();
    
    console.log("🔍 Checking current scene setup...");
    
    // Check if HomeScreen exists in current scene
    const homeScreenEntity = this.app.root.findByName('HomeScreen');
    if (homeScreenEntity && homeScreenEntity.script && homeScreenEntity.script.HomeScreen) {
        console.log("🏠 Found HomeScreen in current scene - activating home mode");
        this.activeMode = 'home';
        homeScreenEntity.script.HomeScreen.activate();
    } else {
        console.log("⚠️ HomeScreen not found in current scene");
        console.log("📋 Available entities:", this.app.root.children.map(child => child.name));
        
        // If no HomeScreen, we're probably in a specific scene mode
        if (this.activeMode === 'home') {
            // Override home mode if we don't have HomeScreen
            this.activeMode = this.detectModeFromScene();
            console.log(`🔧 Corrected mode to: ${this.activeMode}`);
        }
    }
    
    // Update UI for the detected mode
    this.updateModeSwitcherUI();
    this.updateModeSwitcherVisibility();
    
    // Start audio context if needed (only for non-home scenes usually)
    this.ensureAudioContext();
    
    // Enable debug shortcuts
    this.setupDebugShortcuts();
    
    console.log("✅ App Manager setup complete - Active mode:", this.activeMode);
};

// Detect actual mode based on currentMode attribute and scene context
AppManager.prototype.detectActualMode = function() {
    // First try the currentMode attribute
    let detectedMode = this.currentMode || 'home';
    
    // Safely get current scene name
    const currentScene = this.app.scenes && this.app.scenes.currentScene;
    const sceneName = currentScene ? currentScene.name : 'Unknown';
    
    // If currentMode is 'home' but we're not in Main scene, detect from scene
    if (detectedMode === 'home' && sceneName !== 'Main') {
        detectedMode = this.detectModeFromScene();
        console.log(`🔧 Mode corrected from 'home' to '${detectedMode}' based on scene`);
    }
    
    console.log(`🎯 Detected mode: ${detectedMode} (currentMode: ${this.currentMode}, scene: ${sceneName})`);
    return detectedMode;
};

// Detect mode from current scene name and entities
AppManager.prototype.detectModeFromScene = function() {
    // Safely get current scene name
    const currentScene = this.app.scenes && this.app.scenes.currentScene;
    const sceneName = currentScene ? currentScene.name : 'Unknown';
    
    // Map scene names to modes
    switch (sceneName) {
        case 'Main':
            return 'home';
        case 'Euler':
            return 'euler';
        case 'MarchingCubes':
            return 'marchingCubes';
        default:
            // Try to detect from entities
            if (this.app.root.findByName('MarchingCubes')) {
                return 'marchingCubes';
            } else if (this.app.root.findByName('EulerContainer')) {
                return 'euler';
            } else if (this.app.root.findByName('HomeScreen')) {
                return 'home';
            }
            
            console.log(`⚠️ Unknown scene: ${sceneName}, defaulting to 'euler'`);
            return 'euler'; // Default fallback
    }
};

// Load Roboto font from Google Fonts
AppManager.prototype.loadRobotoFont = function() {
    // Check if font is already loaded
    if (document.querySelector('link[href*="fonts.googleapis.com"][href*="Roboto"]')) {
        return;
    }
    
    // Create link element for Google Fonts
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
    
    console.log("📝 Roboto font loaded from Google Fonts");
};

// Create persistent mode switcher UI
AppManager.prototype.createModeSwitcherUI = function() {
    // Create floating mode switcher (small, minimalist) - moved to bottom center
    this.modeSwitcher = document.createElement('div');
    this.modeSwitcher.className = 'app-manager-mode-switcher'; // Unique class to protect from cleanup
    this.modeSwitcher.id = 'app-manager-mode-switcher'; // Unique ID to protect from cleanup
    this.modeSwitcher.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: transparent;
        border: none;
        border-radius: 0px;
        padding: 8px;
        font-family: 'Roboto', sans-serif;
        font-size: 12px;
        z-index: 10000;
        display: flex;
        gap: 8px;
    `;
    
    // Create mode buttons
    const modes = [
        { name: 'HOME', mode: 'home', color: '#4CAF50' },
        { name: 'PHYSICAL OSCILLATORS', mode: 'marchingCubes', color: '#2196F3' },
        { name: 'EULER TOPOLOGY', mode: 'euler', color: '#FF9800' }
    ];
    
    modes.forEach(modeInfo => {
        const button = document.createElement('button');
        button.className = 'app-manager-mode-button';
        button.textContent = modeInfo.name;
        button.style.cssText = `
            background: rgba(0, 0, 0, 0.7);
            color: ${modeInfo.color};
            border: 1px solid ${modeInfo.color};
            border-radius: 4px;
            padding: 6px 12px;
            font-family: 'Roboto', sans-serif;
            font-size: 10px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;
        
        // Hover effects
        button.addEventListener('mouseenter', () => {
            button.style.background = `${modeInfo.color}20`;
            button.style.transform = 'scale(1.05)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.background = 'rgba(0, 0, 0, 0.7)';
            button.style.transform = 'scale(1)';
        });
        
        // Click handler
        button.addEventListener('click', () => {
            if (!this.isTransitioning) {
                this.switchMode(modeInfo.mode);
            }
        });
        
        this.modeSwitcher.appendChild(button);
    });
    
    document.body.appendChild(this.modeSwitcher);
    console.log("🎮 Mode switcher UI created");
};

// Switch between different modes
AppManager.prototype.switchMode = function(newMode) {
    if (this.isTransitioning) {
        console.log("🚫 Mode switch already in progress, ignoring request");
        return;
    }

    console.log(`🔄 Switching from '${this.currentMode}' to '${newMode}'`);
    
    this.isTransitioning = true;
    
    // CRITICAL: Use the same Stop Audio functions that work in the UI buttons
    console.log("🔇 Using native Stop Audio functions before scene change...");
    this.useNativeStopAudioFunctions();
    
    // Small delay to let the stop audio functions complete
    setTimeout(() => {
        // Force cleanup all UIs to prevent stacking
        this.forceCleanupAllUIs();
        
        // Another small delay to ensure cleanup is complete
        setTimeout(() => {
            this.performSceneChange(newMode);
        }, 50);
    }, 100);
};

// Use the same Stop Audio functions that work in the UI buttons
AppManager.prototype.useNativeStopAudioFunctions = function() {
    console.log("🔇 === USING NATIVE STOP AUDIO FUNCTIONS ===");
    
    try {
        // 1. Stop Marching Cubes Audio (if in that scene)
        const marchingCubesEntities = this.app.root.find(entity => 
            entity.script && entity.script.uiController
        );
        
        marchingCubesEntities.forEach(entity => {
            const uiController = entity.script.uiController;
            if (uiController && typeof uiController.stopAudio === 'function') {
                console.log("🔇 Calling MarchingCubes stopAudio()");
                uiController.stopAudio();
            }
        });
        
        // 2. Stop Euler Audio (if in that scene)
        const eulerUIEntities = this.app.root.find(entity => 
            entity.script && entity.script.eulerUIController
        );
        
        eulerUIEntities.forEach(entity => {
            const eulerUIController = entity.script.eulerUIController;
            if (eulerUIController && typeof eulerUIController.stopAudio === 'function') {
                console.log("🔇 Calling Euler UI stopAudio()");
                eulerUIController.stopAudio();
            }
        });
        
        // 3. Also stop Euler Audio Manager directly
        const eulerAudioEntity = this.app.root.findByName('EulerAudioManager');
        if (eulerAudioEntity && eulerAudioEntity.script && eulerAudioEntity.script.eulerAudioManager) {
            const audioManager = eulerAudioEntity.script.eulerAudioManager;
            if (typeof audioManager.stopAudio === 'function') {
                console.log("🔇 Calling EulerAudioManager stopAudio()");
                audioManager.stopAudio();
            }
        }
        
        // 4. As backup, also stop Tone.js transport
        if (window.Tone && Tone.Transport) {
            if (Tone.Transport.state === 'started') {
                console.log("🔇 Stopping Tone.js Transport as backup");
                Tone.Transport.stop();
            }
        }
        
        console.log("✅ Native Stop Audio functions completed");
        
    } catch (e) {
        console.log("⚠️ Error in native stop audio functions:", e.message);
    }
};

// Stop ALL audio completely before scene change
AppManager.prototype.stopAllAudio = function() {
    console.log("🔇 === STOPPING ALL AUDIO COMPLETELY ===");
    
    try {
        if (window.Tone) {
            // 1. Stop and cancel transport
            if (Tone.Transport) {
                Tone.Transport.stop();
                Tone.Transport.cancel();
                console.log("🔇 Tone.js transport stopped and cancelled");
            }
            
            // 2. Dispose of ALL Tone.js objects
            if (Tone.Master) {
                // Temporarily mute to prevent clicks
                Tone.Master.mute = true;
                setTimeout(() => {
                    if (Tone.Master) Tone.Master.mute = false;
                }, 200);
            }
            
            // 3. Find and dispose ALL active Tone.js sources
            console.log("🔇 Disposing all Tone.js sources...");
            
            // Dispose all synths, oscillators, and sources
            if (Tone.context && Tone.context._timeouts) {
                Tone.context._timeouts.clear();
            }
            
            // Clear all scheduled events
            if (Tone.Draw) {
                Tone.Draw.cancel();
            }
            
            // 4. Stop any running oscillators or synths manually
            // This is the key part - dispose of all active audio nodes
            try {
                // Get all active Tone objects and dispose them
                Object.keys(Tone.context._context._nodes || {}).forEach(nodeId => {
                    const node = Tone.context._context._nodes[nodeId];
                    if (node && typeof node.dispose === 'function') {
                        console.log("🔇 Disposing Tone node:", nodeId);
                        node.dispose();
                    }
                });
            } catch (e) {
                console.log("⚠️ Error disposing Tone nodes:", e.message);
            }
            
            console.log("✅ All Tone.js sources disposed");
        }
        
        // 5. Stop HTML5 audio elements
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        
        // 6. Stop scene-specific audio managers
        this.stopSceneSpecificAudio();
        
        console.log("✅ ALL AUDIO STOPPED COMPLETELY");
        
    } catch (e) {
        console.log("⚠️ Error in stopAllAudio:", e.message);
    }
};

// Stop scene-specific audio managers
AppManager.prototype.stopSceneSpecificAudio = function() {
    console.log("🔇 Stopping scene-specific audio managers...");
    
    try {
        // Stop Euler audio manager
        const eulerAudioEntity = this.app.root.findByName('EulerAudioManager');
        if (eulerAudioEntity && eulerAudioEntity.script && eulerAudioEntity.script.eulerAudioManager) {
            console.log("🔇 Stopping Euler audio manager");
            const audioManager = eulerAudioEntity.script.eulerAudioManager;
            
            // Try multiple methods to stop audio
            if (audioManager.stopAllAudio) {
                audioManager.stopAllAudio();
            }
            if (audioManager.dispose) {
                audioManager.dispose();
            }
            if (audioManager.synth && audioManager.synth.dispose) {
                audioManager.synth.dispose();
            }
        }
        
        // Stop Marching Cubes audio
        const marchingCubesEntities = this.app.root.find(entity => 
            entity.script && (entity.script.marchingCubes || entity.script.uiController)
        );
        marchingCubesEntities.forEach(entity => {
            if (entity.script.uiController && entity.script.uiController.stopAllAudio) {
                console.log("🔇 Stopping Marching Cubes audio");
                entity.script.uiController.stopAllAudio();
            }
            
            // Also try to dispose any synths directly
            if (entity.script.uiController && entity.script.uiController.synth) {
                if (entity.script.uiController.synth.dispose) {
                    entity.script.uiController.synth.dispose();
                }
            }
        });
        
        console.log("✅ Scene-specific audio stopped");
    } catch (e) {
        console.log("⚠️ Error stopping scene-specific audio:", e.message);
    }
};

// Force cleanup all UIs before scene change
AppManager.prototype.forceCleanupAllUIs = function() {
    console.log("🧹 === ULTRA-AGGRESSIVE UI CLEANUP ===");
    
    // NOTE: Audio is already stopped by useNativeStopAudioFunctions()
    // So we focus only on UI cleanup here
    
    // Method 1: Remove ALL mode switchers with more specific targeting
    const modeSwitchers = document.querySelectorAll('.app-manager-mode-switcher, #app-manager-mode-switcher, [id*="app-manager-mode-switcher"]');
    console.log(`🔍 Found ${modeSwitchers.length} mode switchers - removing all`);
    modeSwitchers.forEach((switcher, index) => {
        console.log(`🗑️ Removing mode switcher ${index + 1}:`, switcher.id || 'no-id', switcher.className);
        if (switcher.parentNode) {
            switcher.parentNode.removeChild(switcher);
        }
    });
    
    // Method 1.5: Also remove any elements that contain mode switcher buttons
    const buttonContainers = document.querySelectorAll('div');
    buttonContainers.forEach(container => {
        const buttons = container.querySelectorAll('button');
        let hasModeSwitcherButtons = false;
        
        buttons.forEach(button => {
            const text = button.textContent.toLowerCase();
            if (text.includes('home') || text.includes('physical oscillators') || text.includes('euler topology') || text.includes('loading')) {
                hasModeSwitcherButtons = true;
            }
        });
        
        if (hasModeSwitcherButtons && buttons.length >= 2) {
            console.log(`🗑️ Removing container with mode switcher buttons`);
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        }
    });
    
    // Method 2: Remove ALL lil-gui control panels (they get duplicated)
    const lilGuiPanels = document.querySelectorAll('.lil-gui');
    console.log(`🔍 Found ${lilGuiPanels.length} lil-gui panels - removing all`);
    lilGuiPanels.forEach((panel, index) => {
        console.log(`🗑️ Removing lil-gui panel ${index + 1}`);
        if (panel.parentNode) {
            panel.parentNode.removeChild(panel);
        }
    });
    
    // Method 3: Remove ALL canvas elements except PlayCanvas main canvas
    const canvasElements = document.querySelectorAll('canvas');
    console.log(`🔍 Found ${canvasElements.length} canvas elements`);
    canvasElements.forEach((canvas, index) => {
        // Keep only the main PlayCanvas canvas
        if (canvas.id !== 'application-canvas' && !canvas.classList.contains('pc-canvas')) {
            console.log(`🗑️ Removing canvas ${index + 1}: ${canvas.id || 'no-id'}`);
            if (canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        }
    });
    
    // Method 4: Remove ALL Network State / System Stats panels
    const statsPanels = document.querySelectorAll('div[style*="Network State"], div[style*="System Stats"]');
    console.log(`🔍 Found ${statsPanels.length} stats panels`);
    statsPanels.forEach((panel, index) => {
        console.log(`🗑️ Removing stats panel ${index + 1}`);
        if (panel.parentNode) {
            panel.parentNode.removeChild(panel);
        }
    });
    
    // Method 5: Remove elements containing specific text patterns (more aggressive)
    const textPatterns = [
        'INTERSPECIFICS',
        'SONIC MACHINES',
        'PHYSICAL OSCILLATORS',
        'Network State',
        'System Stats',
        'Controls',
        'Start Audio',
        'Stop Audio'
    ];
    
    textPatterns.forEach(pattern => {
        const elements = document.querySelectorAll('*');
        elements.forEach(element => {
            if (element.textContent && element.textContent.includes(pattern)) {
                // Skip if it's part of the main PlayCanvas canvas or critical elements
                if (element.tagName !== 'CANVAS' && 
                    element.id !== 'application-canvas' &&
                    !element.classList.contains('pc-canvas') &&
                    element !== document.body &&
                    element !== document.html) {
                    
                    // Check if it's a container div that might have our UI
                    const style = element.getAttribute('style') || '';
                    if (style.includes('position: fixed') || 
                        style.includes('position: absolute') ||
                        element.classList.contains('lil-gui') ||
                        element.classList.contains('app-manager-mode-switcher')) {
                        
                        console.log(`🗑️ Removing element with text "${pattern}":`, element.tagName);
                        if (element.parentNode) {
                            element.parentNode.removeChild(element);
                        }
                    }
                }
            }
        });
    });
    
    // Method 6: Remove by specific style patterns (ultra-aggressive)
    const aggressiveSelectors = [
        // Fixed positioned elements (except cookies)
        'div[style*="position: fixed"]:not([id*="onetrust"]):not([class*="onetrust"])',
        // Absolute positioned elements with specific backgrounds
        'div[style*="position: absolute"][style*="background: rgba(0, 0, 0"]',
        'div[style*="position: absolute"][style*="background: rgb(0, 0, 0"]',
        // Elements with z-index that aren't cookies
        'div[style*="z-index: 1000"]:not([id*="onetrust"]):not([class*="onetrust"])',
        'div[style*="z-index: 2000"]:not([id*="onetrust"]):not([class*="onetrust"])',
        'div[style*="z-index: 9999"]:not([id*="onetrust"]):not([class*="onetrust"])',
        'div[style*="z-index: 10000"]:not([id*="onetrust"]):not([class*="onetrust"])'
    ];
    
    aggressiveSelectors.forEach(selector => {
        try {
            const elements = document.querySelectorAll(selector);
            console.log(`🔍 Aggressive selector "${selector}" found ${elements.length} elements`);
            elements.forEach((element, index) => {
                console.log(`🗑️ Aggressively removing element ${index + 1}:`, element.tagName, element.className || 'no-class');
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });
        } catch (e) {
            console.log(`⚠️ Selector failed: ${selector}`, e.message);
        }
    });
    
    // Method 7: Force deactivate known scripts
    const homeScreenEntity = this.app.root.findByName('HomeScreen');
    if (homeScreenEntity && homeScreenEntity.script && homeScreenEntity.script.HomeScreen) {
        console.log(`🔧 Force deactivating HomeScreen script`);
        const script = homeScreenEntity.script.HomeScreen;
        if (script.deactivate) {
            script.deactivate();
        }
    }
    
    console.log("✅ ULTRA-AGGRESSIVE cleanup complete - UI should be clean now");
};

// REMOVED: Old changeScene function - replaced by performSceneChange

// Get scene name for each mode
AppManager.prototype.getSceneNameForMode = function(mode) {
    switch (mode) {
        case 'home':
            return 'Main'; // Cambiado de 'Home' a 'Main' para usar HomeScreen como escena principal
        case 'euler':
            return 'Euler';
        case 'marchingCubes':
            return 'MarchingCubes';
        default:
            console.error("Unknown mode:", mode);
            return 'Main'; // Cambiado de 'Home' a 'Main'
    }
};

// Update mode switcher UI to reflect current state
AppManager.prototype.updateModeSwitcherUI = function() {
    console.log("🎨 Updating mode switcher UI after scene change...");
    
    // Check if mode switcher exists, if not recreate it
    let modeSwitcher = document.getElementById('app-manager-mode-switcher');
    if (!modeSwitcher) {
        console.log("🔧 Mode switcher not found - recreating it");
        this.createModeSwitcherUI();
        modeSwitcher = document.getElementById('app-manager-mode-switcher');
    }
    
    if (!modeSwitcher) {
        console.error("❌ Failed to create/find mode switcher");
        return;
    }

    const buttons = modeSwitcher.querySelectorAll('.app-manager-mode-button');
    
    // Reset all buttons to normal state first
    buttons.forEach(button => {
        button.style.background = 'rgba(0, 0, 0, 0.7)';
        button.style.border = '1px solid';
        button.style.transform = 'scale(1)';
        button.style.opacity = '1';
        button.textContent = button.textContent.replace('LOADING...', this.getOriginalButtonText(button));
    });

    // Update current mode button
    buttons.forEach(button => {
        const buttonMode = this.getButtonMode(button);
        if (buttonMode === this.currentMode) {
            // Active state
            button.style.background = 'rgba(255, 255, 255, 0.2)';
            button.style.border = '2px solid ' + button.style.color;
        }
    });

    // Show/hide mode switcher based on current mode
    if (this.currentMode === 'home') {
        console.log("🙈 Mode switcher hidden in HOME mode");
        modeSwitcher.style.display = 'none';
    } else {
        console.log(`👁️ Mode switcher visible in ${this.currentMode} mode`);
        modeSwitcher.style.display = 'flex';
    }
};

// Get mode from button element
AppManager.prototype.getModeFromButton = function(button) {
    const text = button.textContent;
    if (text.includes('HOME')) return 'home';
    if (text.includes('PHYSICAL')) return 'marchingCubes';
    if (text.includes('EULER')) return 'euler';
    return null;
};

// Helper function to get button mode from button element
AppManager.prototype.getButtonMode = function(button) {
    const text = button.textContent.toLowerCase();
    if (text.includes('home')) return 'home';
    if (text.includes('physical') || text.includes('marching')) return 'marchingCubes';
    if (text.includes('euler')) return 'euler';
    return null;
};

// Helper function to get original button text
AppManager.prototype.getOriginalButtonText = function(button) {
    const mode = this.getButtonMode(button);
    switch (mode) {
        case 'home': return 'HOME';
        case 'marchingCubes': return 'PHYSICAL OSCILLATORS';
        case 'euler': return 'EULER TOPOLOGY';
        default: return button.textContent;
    }
};

// Update mode switcher visibility based on current mode
AppManager.prototype.updateModeSwitcherVisibility = function() {
    if (!this.modeSwitcher) return;
    
    if (this.activeMode === 'home') {
        this.modeSwitcher.style.display = 'none';
        console.log("🙈 Mode switcher hidden in HOME mode");
    } else {
        this.modeSwitcher.style.display = 'flex';
        console.log("👁️ Mode switcher visible in", this.activeMode, "mode");
    }
};

// ===== AUDIO CONTEXT MANAGEMENT =====
// Ensure audio context is ready and running
AppManager.prototype.ensureAudioContext = function() {
    console.log("🔊 Ensuring audio context is ready...");
    
    try {
        if (window.Tone) {
            // Check if context is suspended
            if (Tone.context.state === 'suspended') {
                console.log("🔊 Audio context suspended - will resume on user interaction");
                // Don't force resume here - let the scene handle it on user interaction
            } else if (Tone.context.state === 'running') {
                console.log("✅ Audio context already running");
            }
            
            // Ensure transport is ready
            if (Tone.Transport.state === 'stopped') {
                console.log("🔊 Tone.js transport ready");
            }
            
            return true;
        }
        
        console.log("⚠️ Tone.js not available");
        return false;
    } catch (e) {
        console.log("⚠️ Error checking audio context:", e.message);
        return false;
    }
};

// Setup debug keyboard shortcuts
AppManager.prototype.setupDebugShortcuts = function() {
    console.log("🎹 Debug shortcuts enabled: 1=Home, 2=Marching Cubes, 3=Euler");
    
    // Listen for keyboard shortcuts
    this.app.keyboard.on(pc.EVENT_KEYDOWN, (event) => {
        // Only work if not transitioning
        if (this.isTransitioning) return;
        
        switch (event.key) {
            case pc.KEY_1:
                console.log("🎹 Debug shortcut: Switching to Home");
                this.switchMode('home');
                break;
            case pc.KEY_2:
                console.log("🎹 Debug shortcut: Switching to Marching Cubes");
                this.switchMode('marchingCubes');
                break;
            case pc.KEY_3:
                console.log("🎹 Debug shortcut: Switching to Euler");
                this.switchMode('euler');
                break;
        }
    });
};

// Perform the actual scene change after cleanup
AppManager.prototype.performSceneChange = function(newMode) {
    console.log(`🎬 Starting scene change to mode: ${newMode}`);
    
    const sceneMap = {
        'home': 'Main',
        'marchingCubes': 'MarchingCubes', 
        'euler': 'Euler'
    };
    
    const targetScene = sceneMap[newMode];
    console.log(`🎬 Target scene: ${targetScene}`);
    
    if (!targetScene) {
        console.error(`❌ Unknown mode: ${newMode}`);
        this.isTransitioning = false;
        return;
    }
    
    // List available scenes for debugging
    const availableScenes = this.app.scenes.list().map(scene => scene.name);
    console.log(`📋 Available scenes: (${availableScenes.length})`, availableScenes);
    
    // Find target scene
    const sceneItem = this.app.scenes.find(targetScene);
    if (!sceneItem) {
        console.error(`❌ Scene '${targetScene}' not found`);
        this.isTransitioning = false;
        return;
    }
    
    console.log(`🎯 Found target scene: ${targetScene}`);
    
    try {
        console.log(`🚀 Changing to scene: ${targetScene}`);
        
        this.app.scenes.changeScene(targetScene, (err) => {
            if (err) {
                console.error(`❌ Scene change failed:`, err);
                this.isTransitioning = false;
                return;
            }
            
            console.log(`✅ Successfully changed to scene: ${targetScene}`);
            
            // Update current mode
            this.currentMode = newMode;
            
            // Small delay to let scene initialize
            setTimeout(() => {
                console.log("🎨 Updating mode switcher UI after scene change...");
                this.updateModeSwitcherUI();
                
                // Ensure audio context is ready
                this.ensureAudioContext();
                
                // Restart audio systems for the new scene
                this.restartAudioForScene(newMode);
                
                console.log(`✅ Scene change complete - now in '${newMode}' mode`);
                this.isTransitioning = false;
            }, 500);
        });
        
    } catch (error) {
        console.error(`❌ Scene change error:`, error);
        this.isTransitioning = false;
    }
};

// Restart audio systems for the new scene
AppManager.prototype.restartAudioForScene = function(mode) {
    console.log(`🔊 Restarting audio for ${mode} scene...`);
    
    try {
        // Ensure Tone.js is ready
        if (window.Tone) {
            // Unmute master if it was muted
            if (Tone.Master && Tone.Master.mute) {
                Tone.Master.mute = false;
                console.log("🔊 Tone.js master unmuted");
            }
            
            // Make sure transport is in a good state
            if (Tone.Transport.state === 'stopped') {
                console.log("🔊 Tone.js transport ready for new scene");
            }
            
            // Ensure audio context is running (but don't force it)
            if (Tone.context.state === 'suspended') {
                console.log("🔊 Audio context suspended - will resume on user interaction");
                // The scene's "Start Audio" button will handle this
            } else if (Tone.context.state === 'running') {
                console.log("✅ Audio context running and ready");
            }
        }
        
        // Give scenes a moment to initialize their audio systems
        setTimeout(() => {
            console.log(`🔊 Audio restart complete for ${mode} scene`);
        }, 100);
        
    } catch (e) {
        console.log("⚠️ Error restarting audio:", e.message);
    }
};

// ===== CLEANUP =====
AppManager.prototype.destroy = function() {
    console.log("🧹 Cleaning up App Manager");
    
    // Remove mode switcher UI
    if (this.modeSwitcher && this.modeSwitcher.parentNode) {
        document.body.removeChild(this.modeSwitcher);
    }
    
    console.log("✅ App Manager cleanup complete");
}; 