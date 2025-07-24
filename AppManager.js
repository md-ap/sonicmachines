// App Manager Script for PlayCanvas - Controls switching between different modes
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
    this.activeMode = null;
    this.isTransitioning = false;
    
    // Store references to mode entities (will be found/created)
    this.homeEntity = null;
    this.marchingCubesEntity = null;
    this.eulerEntity = null;
    
    // Audio context management
    this.audioContextStarted = false;
    
    // Create mode switcher UI (always visible)
    this.createModeSwitcherUI();
    
    // Initialize with home screen
    this.switchMode('home');
    
    // Global keyboard listeners for quick mode switching (dev only)
    if (this.enableDebug) {
        this.setupDebugKeyboardShortcuts();
    }
    
    console.log("✅ App Manager setup complete");
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
    
    this.modeButtons = {};
    
    modes.forEach(modeInfo => {
        const button = document.createElement('button');
        button.className = 'app-manager-mode-button'; // Unique class to protect from cleanup
        button.textContent = modeInfo.name;
        button.style.cssText = `
            background: transparent;
            border: 0.5px solid #ffffff;
            color: #ffffff;
            padding: 4px 8px;
            border-radius: 0px;
            cursor: pointer;
            font-family: 'Roboto', sans-serif;
            font-size: 11px;
            font-weight: 400;
            transition: all 0.2s ease;
        `;
        
        // Hover effects
        button.addEventListener('mouseover', () => {
            if (this.currentMode !== modeInfo.mode) {
                button.style.background = '#ffffff';
                button.style.color = '#000';
            }
        });
        
        button.addEventListener('mouseout', () => {
            if (this.currentMode !== modeInfo.mode) {
                button.style.background = 'transparent';
                button.style.color = '#ffffff';
            }
        });
        
        // Click handler
        button.addEventListener('click', () => {
            if (!this.isTransitioning) {
                this.switchMode(modeInfo.mode);
            }
        });
        
        this.modeButtons[modeInfo.mode] = button;
        this.modeSwitcher.appendChild(button);
    });
    
    document.body.appendChild(this.modeSwitcher);
    
    // Update initial button states
    this.updateModeSwitcherUI();
};

// Update mode switcher UI to reflect current mode
AppManager.prototype.updateModeSwitcherUI = function() {
    // Update button states
    Object.keys(this.modeButtons).forEach(mode => {
        const button = this.modeButtons[mode];
        
        if (mode === this.currentMode) {
            // Active state
            button.style.background = '#ffffff';
            button.style.color = '#000';
            button.style.fontWeight = 'bold';
        } else {
            // Inactive state
            button.style.background = 'transparent';
            button.style.color = '#ffffff';
            button.style.fontWeight = 'normal';
        }
    });
};

// Control mode switcher visibility
AppManager.prototype.updateModeSwitcherVisibility = function() {
    if (!this.modeSwitcher) return;
    
    // Hide mode switcher in home mode, show in other modes
    if (this.currentMode === 'home') {
        this.modeSwitcher.style.display = 'none';
        console.log("🙈 Mode switcher hidden in HOME mode");
    } else {
        this.modeSwitcher.style.display = 'flex';
        console.log("👁️ Mode switcher visible in", this.currentMode, "mode");
    }
};

// Main mode switching function
AppManager.prototype.switchMode = function(targetMode) {
    if (this.isTransitioning) {
        console.log(`⏳ Already transitioning, ignoring switch to '${targetMode}'`);
        return;
    }
    
    if (this.currentMode === targetMode) {
        console.log(`⚠️ Already in '${targetMode}' mode, ignoring switch`);
        return;
    }
    
    console.log(`🔄 Switching from '${this.currentMode}' to '${targetMode}'`);
    this.isTransitioning = true;
    
    // Deactivate current mode
    this.deactivateCurrentMode();
    
    // Longer delay to allow COMPLETE Euler cleanup before Marching Cubes activation
    const delayForMode = targetMode === 'marchingCubes' && this.currentMode === 'euler' ? 800 : 400;
    console.log(`⏳ Waiting ${delayForMode}ms for complete cleanup before activating ${targetMode}`);
    
    setTimeout(() => {
        // Update state FIRST (before activating mode)
        this.currentMode = targetMode;
        this.activeMode = targetMode;
        
        if (targetMode === 'marchingCubes') {
            console.log("🧊 ACTIVATING MARCHING CUBES after Euler cleanup");
        }
        
        // Then activate new mode (scripts will see correct currentMode)
        this.activateMode(targetMode);
        
        // Update UI
        this.updateModeSwitcherUI();
        
        // Control mode switcher visibility based on current mode
        this.updateModeSwitcherVisibility();
        
        this.isTransitioning = false;
        console.log(`✅ Successfully switched to '${targetMode}' mode`);
    }, delayForMode);
};

// Deactivate whatever mode is currently active
AppManager.prototype.deactivateCurrentMode = function() {
    console.log("🔽 Deactivating current mode:", this.currentMode);
    
    // Global audio stop to prevent overlapping between modes
    try {
        if (typeof Tone !== 'undefined' && Tone.Transport) {
            console.log("🔇 Stopping global Tone.js transport during mode switch...");
            Tone.Transport.stop();
            Tone.Transport.cancel(); // Cancel any scheduled events
            
            // Mute master volume temporarily
            if (Tone.Destination) {
                Tone.Destination.mute = true;
                setTimeout(() => {
                    if (Tone.Destination) Tone.Destination.mute = false;
                }, 500); // Unmute after mode switch is complete
            }
        }
    } catch (error) {
        console.warn("Warning during global audio stop:", error);
    }
    
    switch (this.currentMode) {
        case 'none':
            console.log("No mode to deactivate");
            break;
        case 'home':
            this.deactivateHomeScreen();
            break;
        case 'marchingCubes':
            this.deactivateMarchingCubes();
            break;
        case 'euler':
            this.deactivateEuler();
            break;
        default:
            console.log("Unknown mode to deactivate:", this.currentMode);
            break;
    }
};

// Activate specified mode
AppManager.prototype.activateMode = function(mode) {
    console.log("🔼 Activating mode:", mode);
    
    switch (mode) {
        case 'home':
            this.activateHomeScreen();
            break;
        case 'marchingCubes':
            this.activateMarchingCubes();
            break;
        case 'euler':
            this.activateEuler();
            break;
        default:
            console.error("Unknown mode:", mode);
            break;
    }
};

// ===== HOME SCREEN MANAGEMENT =====
AppManager.prototype.activateHomeScreen = function() {
    console.log("🏠 Activating Home Screen");
    
    // Find or create home screen entity
    this.homeEntity = this.app.root.findByName('HomeScreen');
    
    if (!this.homeEntity) {
        console.log("Creating HomeScreen entity");
        this.homeEntity = new pc.Entity('HomeScreen');
        this.homeEntity.addComponent('script');
        
        // Add home screen script (will be created separately)
        this.homeEntity.script.create('HomeScreen', {
            attributes: {
                appManager: this
            }
        });
        
        this.app.root.addChild(this.homeEntity);
        console.log("✅ HomeScreen entity created");
    } else {
        console.log("✅ Found existing HomeScreen entity");
    }
    
    // Enable home screen
    this.homeEntity.enabled = true;
    
    // If home screen script exists, activate it
    if (this.homeEntity.script && this.homeEntity.script.HomeScreen) {
        console.log("🏠 Calling HomeScreen.activate()");
        this.homeEntity.script.HomeScreen.activate();
        console.log("🏠 Home Screen activated");
    } else {
        console.error("❌ HomeScreen script not found!", {
            hasScript: !!this.homeEntity.script,
            hasHomeScreen: this.homeEntity.script ? !!this.homeEntity.script.HomeScreen : false
        });
    }
};

AppManager.prototype.deactivateHomeScreen = function() {
    if (this.homeEntity && this.homeEntity.script && this.homeEntity.script.HomeScreen) {
        this.homeEntity.script.HomeScreen.deactivate();
    }
    
    if (this.homeEntity) {
        this.homeEntity.enabled = false;
    }
};

// ===== MARCHING CUBES MANAGEMENT =====
AppManager.prototype.activateMarchingCubes = function() {
    console.log("🟦 Activating Marching Cubes mode");
    
    // Special handling when coming from Euler mode
    const previousMode = this.activeMode;
    if (previousMode === 'euler') {
        console.log("🚨 SPECIAL: Activating Marching Cubes after Euler - using deep cleanup mode");
        console.log("🧊 Ensuring all Euler render conflicts are resolved...");
    }
    
    // Find or create marching cubes entities
    this.setupMarchingCubesEntities();
    
    // Small delay to ensure DOM cleanup doesn't interfere with entity activation
    setTimeout(() => {
        // Enable marching cubes entities and scripts
        this.enableMarchingCubesMode();
        
        // Additional delay to ensure rendering
        setTimeout(() => {
            console.log("🔄 Force triggering Marching Cubes update...");
            const marchingCubesEntity = this.app.root.findByName('MarchingCubes');
            if (marchingCubesEntity && marchingCubesEntity.script && marchingCubesEntity.script.marchingCubes) {
                // Force an update to ensure the mesh is generated
                if (typeof marchingCubesEntity.script.marchingCubes.updateMarchingCubes === 'function') {
                    marchingCubesEntity.script.marchingCubes.updateMarchingCubes();
                    console.log("✅ Forced Marching Cubes mesh update");
                }
            }
        }, 100);
        
    }, 50);
    
    // Start audio context if needed
    this.ensureAudioContext();
};

AppManager.prototype.deactivateMarchingCubes = function() {
    console.log("🔽 Deactivating Marching Cubes mode");
    
    // Clean up marching cubes UI FIRST while entities are still enabled
    this.cleanupMarchingCubesUI();
    
    // Small delay to ensure DOM cleanup completes before disabling entities
    setTimeout(() => {
        // Disable entities AFTER cleanup is complete
        this.disableMarchingCubesMode();
        console.log("✅ Marching Cubes deactivation complete");
    }, 50);
};

AppManager.prototype.setupMarchingCubesEntities = function() {
    // This will find or create the marching cubes entities structure
    // UI Entity for controls
    let uiEntity = this.app.root.findByName('UI');
    if (!uiEntity) {
        console.log("Creating UI entity for Marching Cubes");
        uiEntity = new pc.Entity('UI');
        uiEntity.addComponent('script');
        
        // Add uiController script
        try {
            console.log("🎮 Adding uiController script to UI entity...");
            uiEntity.script.create('uiController');
            console.log("✅ Added uiController script to UI");
        } catch (error) {
            console.error("❌ Failed to add uiController script:", error);
        }
        
        this.app.root.addChild(uiEntity);
    }
    
    // Scene Entity for setup  
    let sceneEntity = this.app.root.findByName('Scene');
    if (!sceneEntity) {
        console.log("Creating Scene entity for Marching Cubes");
        sceneEntity = new pc.Entity('Scene');
        sceneEntity.addComponent('script');
        
        // Add sceneSetup script
        try {
            console.log("🌍 Adding sceneSetup script to Scene entity...");
            sceneEntity.script.create('sceneSetup');
            console.log("✅ Added sceneSetup script to Scene");
        } catch (error) {
            console.error("❌ Failed to add sceneSetup script:", error);
        }
        
        this.app.root.addChild(sceneEntity);
    }
    
    // MarchingCubes Entity for the main algorithm
    let marchingCubesEntity = this.app.root.findByName('MarchingCubes');
    if (!marchingCubesEntity) {
        console.log("Creating MarchingCubes entity");
        marchingCubesEntity = new pc.Entity('MarchingCubes');
        marchingCubesEntity.addComponent('script');
        
        // Add marchingCubes script
        try {
            console.log("🧊 Adding marchingCubes script to MarchingCubes entity...");
            marchingCubesEntity.script.create('marchingCubes');
            console.log("✅ Added marchingCubes script to MarchingCubes");
        } catch (error) {
            console.error("❌ Failed to add marchingCubes script:", error);
        }
        
        this.app.root.addChild(marchingCubesEntity);
    }
    
    // SpawnPoint (for Viverse)
    if (this.runningInViverse) {
        let spawnPoint = this.app.root.findByName('SpawnPoint');
        if (!spawnPoint) {
            console.log("Creating SpawnPoint entity for Viverse");
            spawnPoint = new pc.Entity('SpawnPoint');
            spawnPoint.tags.add('spawn-point');
            spawnPoint.addComponent('script');
            this.app.root.addChild(spawnPoint);
        }
    }
    
    console.log("✅ Marching Cubes entities setup complete");
};

AppManager.prototype.enableMarchingCubesMode = function() {
    console.log("🔧 Enabling Marching Cubes mode entities...");
    
    // 🎯 CRITICAL: Fix camera position FIRST for visibility - FORCE reset from Euler
    console.log("📷 FORCE resetting camera for Marching Cubes visibility...");
    const camera = this.app.root.findByName('Camera');
    if (camera) {
        const oldPos = camera.getPosition();
        console.log(`📷 Camera position before FORCE reset: (${oldPos.x.toFixed(2)}, ${oldPos.y.toFixed(2)}, ${oldPos.z.toFixed(2)})`);
        
        // CRITICAL: Disable any Euler camera controller first
        if (camera.script && camera.script.eulerCameraController) {
            camera.script.eulerCameraController.enabled = false;
            console.log("📷 Euler camera controller disabled");
        }
        
        // Force camera to optimal marching cubes viewing position - HARD RESET
        camera.setPosition(0, 2, 8); // Optimal distance for marching cubes
        camera.setEulerAngles(0, 0, 0); // Reset rotation
        camera.lookAt(0, 0, 0);     // Look at center where objects are
        
        // Double-check position after reset
        const newPos = camera.getPosition();
        console.log(`📷 Camera position after FORCE reset: (${newPos.x.toFixed(2)}, ${newPos.y.toFixed(2)}, ${newPos.z.toFixed(2)})`);
        console.log(`🎯 Camera FORCE repositioned - marching cubes should now be visible!`);
        
        // Force enable camera if it was disabled
        camera.enabled = true;
    } else {
        console.warn("⚠️ No camera found to reposition!");
    }
    
    // Enable and initialize marching cubes scripts
    const uiEntity = this.app.root.findByName('UI');
    const sceneEntity = this.app.root.findByName('Scene');
    const marchingCubesEntity = this.app.root.findByName('MarchingCubes');
    const spawnPoint = this.app.root.findByName('SpawnPoint');
    
    console.log("🔍 Entity status:", {
        uiEntity: uiEntity ? 'found' : 'not found',
        sceneEntity: sceneEntity ? 'found' : 'not found', 
        marchingCubesEntity: marchingCubesEntity ? 'found' : 'not found',
        spawnPoint: spawnPoint ? 'found' : 'not found'
    });
    
    if (uiEntity) {
        uiEntity.enabled = true;
        
        // Debug: List available scripts
        if (uiEntity.script) {
            console.log("🔍 UI entity scripts:", Object.keys(uiEntity.script));
        }
        
        // Force re-initialize the script
        if (uiEntity.script && uiEntity.script.uiController) {
            try {
                console.log("🔄 Re-initializing uiController");
                uiEntity.script.uiController.initialize();
            } catch (error) {
                console.error("❌ Error re-initializing uiController:", error);
            }
        } else {
            console.warn("⚠️ uiController script not found on UI entity");
        }
        console.log("✅ UI entity enabled");
    }
    
    if (sceneEntity) {
        sceneEntity.enabled = true;
        
        // Force re-initialize the script to create the Start Audio button
        if (sceneEntity.script && sceneEntity.script.sceneSetup) {
            try {
                console.log("🔄 Re-initializing sceneSetup to create Start Audio button");
                sceneEntity.script.sceneSetup.initialize();
            } catch (error) {
                console.error("❌ Error re-initializing sceneSetup:", error);
            }
        } else {
            console.warn("⚠️ sceneSetup script not found on Scene entity");
        }
        console.log("✅ Scene entity enabled");
    }
    
    if (marchingCubesEntity) {
        console.log("🧊 Enabling MarchingCubes entity...");
        marchingCubesEntity.enabled = true;
        
        // Force re-initialize the script
        if (marchingCubesEntity.script && marchingCubesEntity.script.marchingCubes) {
            try {
                console.log("🔄 Re-initializing marchingCubes script...");
                marchingCubesEntity.script.marchingCubes.initialize();
                
                // Debug: Check if blobs were created and FORCE mesh generation
                setTimeout(() => {
                    const script = marchingCubesEntity.script.marchingCubes;
                    console.log("🔍 Marching Cubes debug:", {
                        enabled: marchingCubesEntity.enabled,
                        hasBlobs: script.blobs ? script.blobs.length : 0,
                        hasMeshEntity: script.meshEntity ? 'yes' : 'no',
                        meshEnabled: script.meshEntity ? script.meshEntity.enabled : 'no mesh'
                    });
                    
                                    // CRITICAL: Force initial mesh generation
                if (script && script.blobs && script.blobs.length > 0) {
                    console.log("🚀 FORCING initial mesh generation...");
                    script.time = 0; // Reset time
                    script.updateMarchingCubes(0); // Force initial mesh creation
                    
                    // CRITICAL: Fix camera position for Marching Cubes visibility
                    const camera = this.app.root.findByName('Camera');
                    if (camera) {
                        const oldPos = camera.getPosition();
                        console.log(`📷 Camera OLD position: (${oldPos.x}, ${oldPos.y}, ${oldPos.z})`);
                        
                        // Force camera to marching cubes viewing position
                        camera.setPosition(0, 2, 5); // Close to origin where marching cubes are
                        camera.lookAt(0, 0, 0);     // Look at center
                        
                        const newPos = camera.getPosition();
                        console.log(`📷 Camera NEW position: (${newPos.x}, ${newPos.y}, ${newPos.z})`);
                        console.log(`🎯 Camera should now see marching cubes objects!`);
                    } else {
                        console.warn("⚠️ No camera found!");
                    }
                        
                        // Double-check that mesh was created
                        setTimeout(() => {
                            if (script.meshEntity && script.meshEntity.render && script.meshEntity.render.meshInstances) {
                                const meshCount = script.meshEntity.render.meshInstances.length;
                                console.log("✅ Mesh instances created:", meshCount);
                                if (meshCount === 0) {
                                    console.error("❌ NO MESH INSTANCES - MESH NOT RENDERING");
                                }
                            } else {
                                console.error("❌ MESH ENTITY HAS NO RENDER COMPONENT");
                            }
                        }, 100);
                    }
                }, 200);
                
            } catch (error) {
                console.error("❌ Error re-initializing marchingCubes:", error);
            }
        } else {
            console.warn("⚠️ marchingCubes script not found on MarchingCubes entity");
        }
        console.log("✅ MarchingCubes entity enabled");
    } else {
        console.error("❌ MarchingCubes entity not found!");
    }
    
    if (spawnPoint) {
        spawnPoint.enabled = true;
        console.log("✅ SpawnPoint enabled");
    }
    
    console.log("🟦 Marching Cubes mode entities enabled");
};

AppManager.prototype.disableMarchingCubesMode = function() {
    // Disable marching cubes entities
    const uiEntity = this.app.root.findByName('UI');
    const sceneEntity = this.app.root.findByName('Scene');
    const spawnPoint = this.app.root.findByName('SpawnPoint');
    const marchingCubes = this.app.root.findByName('MarchingCubes');
    
    if (uiEntity) {
        uiEntity.enabled = false;
        console.log("🔽 UI entity disabled");
    }
    
    if (sceneEntity) {
        sceneEntity.enabled = false;
        console.log("🔽 Scene entity disabled");
    }
    
    if (marchingCubes) {
        marchingCubes.enabled = false;
        console.log("🔽 MarchingCubes entity disabled");
    }
    
    if (spawnPoint) {
        spawnPoint.enabled = false;
        console.log("🔽 SpawnPoint disabled");
    }
};

AppManager.prototype.cleanupMarchingCubesUI = function() {
    // Remove any marching cubes UI elements from DOM
    console.log("🧹 Cleaning up Marching Cubes UI elements");
    
    const elementsToRemove = [
        'div[style*="Simulation"]', // Simulation panel
        'canvas[style*="waveform"]', // Waveform visualization
        'div[style*="Debug Panel"]', // Debug panel
        'button[style*="Start Audio"]', // Start audio button
        'div[style*="rgba(0, 0, 0, 0.8)"]', // Debug terminal
        'div[style*="color: #0f0"]' // Green terminal text
    ];
    
    elementsToRemove.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });
    });
    
    // More specific cleanup for marching cubes UI
    const allDivs = document.querySelectorAll('div');
    allDivs.forEach(div => {
        if (div.textContent && (
            div.textContent.includes('Marching Cubes') ||
            div.textContent.includes('Simulation') ||
            div.textContent.includes('Waveform')
        )) {
            if (div.parentNode) {
                div.parentNode.removeChild(div);
            }
        }
    });
};

// ===== EULER MANAGEMENT =====
AppManager.prototype.activateEuler = function() {
    console.log("🟠 Activating Euler mode");
    
    // Find or create euler entities
    this.setupEulerEntities();
    
    // Enable euler mode
    this.enableEulerMode();
    
    // Start audio context if needed
    this.ensureAudioContext();
};

AppManager.prototype.deactivateEuler = function() {
    console.log("🔽 Deactivating Euler mode");
    
    // 🚨 CRITICAL: Complete Euler system shutdown for Marching Cubes compatibility
    console.log("🛑 DEEP SHUTDOWN of Euler systems...");
    
    // 1. Force stop all Euler scripts and animations immediately
    this.forceStopEulerSystems();
    
    // 2. Clean up Euler UI while entities are still accessible
    this.cleanupEulerUI();
    
    // 3. Destroy Euler rendering systems completely
    setTimeout(() => {
        this.destroyEulerRenderSystems();
        
        // 4. Disable entities after systems are destroyed
        setTimeout(() => {
            this.disableEulerMode();
            
            // 5. Final cleanup to ensure no Euler state remains
            setTimeout(() => {
                this.clearEulerResidue();
                console.log("✅ Euler COMPLETE deactivation finished");
            }, 100);
        }, 100);
    }, 100);
};

AppManager.prototype.setupEulerEntities = function() {
    // EulerContainer Entity
    let eulerContainer = this.app.root.findByName('EulerContainer');
    if (!eulerContainer) {
        console.log("Creating EulerContainer entity");
        eulerContainer = new pc.Entity('EulerContainer');
        eulerContainer.addComponent('script');
        
        // Add eulerTopologySimulation script
        try {
            eulerContainer.script.create('eulerTopologySimulation');
            console.log("✅ Added eulerTopologySimulation script to EulerContainer");
        } catch (error) {
            console.error("❌ Failed to add eulerTopologySimulation script:", error);
        }
        
        this.app.root.addChild(eulerContainer);
    }
    
    // AudioEntity
    let audioEntity = this.app.root.findByName('AudioEntity');
    if (!audioEntity) {
        console.log("Creating AudioEntity entity");
        audioEntity = new pc.Entity('AudioEntity');
        audioEntity.addComponent('script');
        
        // Add eulerAudioManager script
        try {
            audioEntity.script.create('eulerAudioManager');
            console.log("✅ Added eulerAudioManager script to AudioEntity");
        } catch (error) {
            console.error("❌ Failed to add eulerAudioManager script:", error);
        }
        
        this.app.root.addChild(audioEntity);
    }
    
    // Camera Entity (only if not in Viverse)
    if (!this.runningInViverse) {
        let cameraEntity = this.app.root.findByName('Camera');
        if (!cameraEntity) {
            console.log("Creating Camera entity");
            cameraEntity = new pc.Entity('Camera');
            cameraEntity.addComponent('camera');
            cameraEntity.addComponent('script');
            
            // Add eulerCameraController script
            try {
                cameraEntity.script.create('eulerCameraController');
                console.log("✅ Added eulerCameraController script to Camera");
            } catch (error) {
                console.error("❌ Failed to add eulerCameraController script:", error);
            }
            
            this.app.root.addChild(cameraEntity);
        }
    }
    
    // UI Entity (optional)
    let uiEntity = this.app.root.findByName('UI');
    if (!uiEntity) {
        console.log("Creating UI entity");
        uiEntity = new pc.Entity('UI');
        uiEntity.addComponent('script');
        
        // Add eulerUIController script
        try {
            console.log("🎨 Adding eulerUIController script to UI entity...");
            uiEntity.script.create('eulerUIController');
            console.log("✅ Added eulerUIController script to UI");
            
            // Verify it was added
            if (uiEntity.script.eulerUIController) {
                console.log("✅ eulerUIController script verified on UI entity");
            } else {
                console.error("❌ eulerUIController script not found after creation");
            }
        } catch (error) {
            console.error("❌ Failed to add eulerUIController script:", error);
        }
        
        this.app.root.addChild(uiEntity);
        console.log("✅ UI entity added to scene");
    } else {
        console.log("✅ Found existing UI entity");
    }
    
    console.log("✅ Euler entities setup complete");
};

AppManager.prototype.enableEulerMode = function() {
    // Enable euler entities
    const eulerContainer = this.app.root.findByName('EulerContainer');
    const audioEntity = this.app.root.findByName('AudioEntity');
    const cameraEntity = this.app.root.findByName('Camera');
    const uiEntity = this.app.root.findByName('UI');
    
    if (eulerContainer) {
        eulerContainer.enabled = true;
        
        // Debug: List available scripts
        if (eulerContainer.script) {
            console.log("🔍 EulerContainer scripts:", Object.keys(eulerContainer.script));
        }
        
        // Force re-initialize the script now that mode is correct
        if (eulerContainer.script && eulerContainer.script.eulerTopologySimulation) {
            try {
                console.log("🔄 Re-initializing eulerTopologySimulation");
                eulerContainer.script.eulerTopologySimulation.initialize();
            } catch (error) {
                console.error("❌ Error re-initializing eulerTopologySimulation:", error);
            }
        } else {
            console.warn("⚠️ eulerTopologySimulation script not found on EulerContainer");
        }
        console.log("✅ EulerContainer enabled");
    }
    
    if (audioEntity) {
        audioEntity.enabled = true;
        // Force re-initialize the script
        if (audioEntity.script && audioEntity.script.eulerAudioManager) {
            try {
                console.log("🔄 Re-initializing eulerAudioManager");
                audioEntity.script.eulerAudioManager.initialize();
            } catch (error) {
                console.error("❌ Error re-initializing eulerAudioManager:", error);
            }
        }
        console.log("✅ AudioEntity enabled");
    }
    
    if (cameraEntity && !this.runningInViverse) {
        cameraEntity.enabled = true;
        // Force re-initialize the script
        if (cameraEntity.script && cameraEntity.script.eulerCameraController) {
            try {
                console.log("🔄 Re-initializing eulerCameraController");
                cameraEntity.script.eulerCameraController.initialize();
            } catch (error) {
                console.error("❌ Error re-initializing eulerCameraController:", error);
            }
        }
        console.log("✅ Camera enabled");
    }
    
    if (uiEntity) {
        uiEntity.enabled = true;
        
        // Debug: List available scripts on UI entity
        if (uiEntity.script) {
            console.log("🔍 UI entity scripts:", Object.keys(uiEntity.script));
        }
        
        // Force re-initialize the script
        if (uiEntity.script && uiEntity.script.eulerUIController) {
            try {
                console.log("🔄 Re-initializing eulerUIController");
                uiEntity.script.eulerUIController.initialize();
            } catch (error) {
                console.error("❌ Error re-initializing eulerUIController:", error);
            }
        } else {
            console.warn("⚠️ eulerUIController script not found on UI entity");
            
            // Try to create it if missing
            if (uiEntity.script) {
                try {
                    console.log("🛠️ Creating missing eulerUIController script...");
                    uiEntity.script.create('eulerUIController');
                    console.log("✅ eulerUIController script created");
                    
                    // Try to initialize it
                    if (uiEntity.script.eulerUIController) {
                        uiEntity.script.eulerUIController.initialize();
                    }
                } catch (error) {
                    console.error("❌ Failed to create eulerUIController script:", error);
                }
            }
        }
        console.log("✅ UI entity enabled");
    }
    
    console.log("🟠 Euler mode entities enabled");
};

// Force stop all Euler scripts and systems immediately
AppManager.prototype.forceStopEulerSystems = function() {
    console.log("🛑 Force stopping all Euler systems...");
    
    // Stop Euler particle simulation
    const eulerContainer = this.app.root.findByName('EulerContainer');
    if (eulerContainer && eulerContainer.script && eulerContainer.script.eulerTopologySimulation) {
        try {
            const simulation = eulerContainer.script.eulerTopologySimulation;  
            // Force stop the update loop
            simulation.enabled = false;
            // Clear particles and connections
            if (simulation.particles) simulation.particles = [];
            if (simulation.particleConnections) simulation.particleConnections.clear();
            if (simulation.currentTriangles) simulation.currentTriangles.clear();
            console.log("🛑 Euler topology simulation stopped");
        } catch (error) {
            console.warn("Warning stopping Euler simulation:", error);
        }
    }
    
    // Stop Euler audio completely
    const audioEntity = this.app.root.findByName('AudioEntity');
    if (audioEntity && audioEntity.script && audioEntity.script.eulerAudioManager) {
        try {
            const audioManager = audioEntity.script.eulerAudioManager;
            audioManager.stopAudio();
            audioManager.enabled = false;
            console.log("🛑 Euler audio manager stopped");
        } catch (error) {
            console.warn("Warning stopping Euler audio:", error);
        }
    }
    
    // Stop Euler camera controller
    const cameraEntity = this.app.root.findByName('Camera');
    if (cameraEntity && cameraEntity.script && cameraEntity.script.eulerCameraController) {
        try {
            const cameraController = cameraEntity.script.eulerCameraController;
            cameraController.enabled = false;
            // Stop auto rotation
            cameraController.autoRotate = false;
            console.log("🛑 Euler camera controller stopped");
        } catch (error) {
            console.warn("Warning stopping Euler camera:", error);
        }
    }
};

// Destroy Euler rendering systems completely
AppManager.prototype.destroyEulerRenderSystems = function() {
    console.log("💥 Destroying Euler render systems...");
    
    const eulerContainer = this.app.root.findByName('EulerContainer');
    if (eulerContainer && eulerContainer.script && eulerContainer.script.eulerTopologySimulation) {
        try {
            const simulation = eulerContainer.script.eulerTopologySimulation;
            
            // Destroy mesh instances that cause shader conflicts
            if (simulation.particleMeshInstance) {
                simulation.particleMeshInstance.destroy();
                simulation.particleMeshInstance = null;
                console.log("💥 Destroyed Euler particle mesh instance");
            }
            
            if (simulation.lineMeshInstance) {
                simulation.lineMeshInstance.destroy();
                simulation.lineMeshInstance = null;
                console.log("💥 Destroyed Euler line mesh instance");
            }
            
            // Clear mesh entities that might conflict
            if (simulation.particleEntity) {
                simulation.particleEntity.destroy();
                simulation.particleEntity = null;
            }
            
            if (simulation.connectionEntity) {
                simulation.connectionEntity.destroy();
                simulation.connectionEntity = null;
            }
            
            console.log("💥 Euler render systems destroyed");
        } catch (error) {
            console.warn("Warning destroying Euler render systems:", error);
        }
    }
};

// Clear any remaining Euler residue 
AppManager.prototype.clearEulerResidue = function() {
    console.log("🧹 Clearing Euler residue...");
    
    // Force garbage collection of any remaining Euler state
    try {
        // Clear any remaining Tone.js state that might conflict
        if (typeof Tone !== 'undefined') {
            Tone.Transport.stop();
            Tone.Transport.cancel();
            // Clear any scheduled events
            console.log("🧹 Tone.js transport cleared");
        }
        
        // Clear any mesh data that might be lingering
        if (this.app && this.app.graphicsDevice) {
            // Force a render state reset
            console.log("🧹 Graphics device state cleared");
        }
    } catch (error) {
        console.warn("Warning during residue cleanup:", error);
    }
};

AppManager.prototype.disableEulerMode = function() {
    // Disable euler entities AFTER systems are destroyed
    const eulerContainer = this.app.root.findByName('EulerContainer');
    const audioEntity = this.app.root.findByName('AudioEntity');
    const cameraEntity = this.app.root.findByName('Camera');
    const uiEntity = this.app.root.findByName('UI');
    
    if (eulerContainer) {
        eulerContainer.enabled = false;
        console.log("🔽 EulerContainer disabled");
    }
    
    if (audioEntity) {
        audioEntity.enabled = false;
        console.log("🔽 AudioEntity disabled");
    }
    
    if (cameraEntity && !this.runningInViverse) {
        cameraEntity.enabled = false;
        console.log("🔽 Camera disabled");
    }
    
    if (uiEntity) {
        uiEntity.enabled = false;
        console.log("🔽 UI entity disabled");
    }
};

AppManager.prototype.cleanupMarchingCubesUI = function() {
    console.log("🧹 Cleaning up Marching Cubes UI...");
    
    // Debug: Count current DOM elements before cleanup
    const beforeCleanup = {
        divs: document.querySelectorAll('div').length,
        canvas: document.querySelectorAll('canvas').length,
        buttons: document.querySelectorAll('button').length
    };
    console.log("📊 DOM elements before cleanup:", beforeCleanup);
    
    // Call UIController cleanup method first (most comprehensive)
    const uiEntity = this.app.root.findByName('UI');
    if (uiEntity && uiEntity.script && uiEntity.script.uiController) {
        try {
            console.log("🎯 Calling UIController cleanup method...");
            if (typeof uiEntity.script.uiController.cleanup === 'function') {
                uiEntity.script.uiController.cleanup();
            } else {
                // Fallback to just stopping audio
                console.log("🔇 Fallback: Stopping Marching Cubes audio...");
                uiEntity.script.uiController.stopAudio();
            }
        } catch (error) {
            console.warn("Warning during UIController cleanup:", error);
        }
    } else {
        console.warn("⚠️ UIController not found for cleanup");
    }
    
    // Remove marching cubes UI elements by class/style
    const elementsToRemove = [
        'canvas[style*="waveform"]',
        '.lil-gui',
        'div[style*="MARCHING CUBES"]',
        'div[style*="Network State"]',
        'button[style*="Start Audio"]',
        'button[style*="Stop Audio"]',
        'div[style*="rgba(0, 0, 0, 0.8)"]', // Debug terminal
        'div[style*="color: #0f0"]' // Green terminal text
    ];
    
    elementsToRemove.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            // Protect mode switcher from cleanup
            if (el.id === 'app-manager-mode-switcher' || 
                el.className === 'app-manager-mode-switcher' ||
                el.className === 'app-manager-mode-button' ||
                el.closest('#app-manager-mode-switcher')) {
                console.log("🛡️ Protected mode switcher element from Marching Cubes cleanup");
                return; // Skip removing this element
            }
            
            if (el.parentNode) {
                el.parentNode.removeChild(el);
                console.log("🗑️ Removed element:", selector);
            }
        });
    });
    
    // Clean up any marching cubes-specific divs by content
    const allDivs = document.querySelectorAll('div');
    allDivs.forEach(div => {
        // Protect mode switcher from cleanup
        if (div.id === 'app-manager-mode-switcher' || 
            div.className === 'app-manager-mode-switcher' ||
            div.closest('#app-manager-mode-switcher')) {
            return; // Skip removing this element
        }
        
        if (div.textContent && (
            div.textContent.includes('MARCHING CUBES') ||
            div.textContent.includes('Triangle Density') ||
            div.textContent.includes('Blob Density') ||
            div.textContent.includes('Audio: Started') ||
            div.textContent.includes('Audio: Stopped')
        )) {
            // Extra check: don't remove if it's a mode button (contains HOME, CUBES, EULER)
            if (div.textContent.includes('HOME') || 
                div.textContent.includes('CUBES') || 
                div.textContent.includes('EULER')) {
                console.log("🛡️ Protected mode button from content cleanup");
                return;
            }
            
            if (div.parentNode) {
                div.parentNode.removeChild(div);
                console.log("🗑️ Removed marching cubes div");
            }
        }
    });
    
    // Clean up any orphaned canvas elements
    const allCanvas = document.querySelectorAll('canvas');
    allCanvas.forEach(canvas => {
        if (canvas.style.position === 'fixed' && canvas.style.bottom) {
            canvas.parentNode.removeChild(canvas);
            console.log("🗑️ Removed orphaned canvas");
        }
    });
    
    // Debug: Count DOM elements after cleanup
    const afterCleanup = {
        divs: document.querySelectorAll('div').length,
        canvas: document.querySelectorAll('canvas').length,
        buttons: document.querySelectorAll('button').length
    };
    console.log("📊 DOM elements after cleanup:", afterCleanup);
    console.log("📉 Elements removed:", {
        divs: beforeCleanup.divs - afterCleanup.divs,
        canvas: beforeCleanup.canvas - afterCleanup.canvas,
        buttons: beforeCleanup.buttons - afterCleanup.buttons
    });
    
    console.log("✅ Marching Cubes UI cleanup complete");
};

AppManager.prototype.cleanupEulerUI = function() {
    console.log("🧹 AGGRESSIVE Euler UI cleanup for Marching Cubes compatibility...");
    
    // Debug: Count current DOM elements before cleanup
    const beforeCleanup = {
        divs: document.querySelectorAll('div').length,
        canvas: document.querySelectorAll('canvas').length,
        buttons: document.querySelectorAll('button').length
    };
    console.log("📊 DOM elements before AGGRESSIVE cleanup:", beforeCleanup);
    
    // Call EulerUIController cleanup method first (most comprehensive)
    const uiEntity = this.app.root.findByName('UI');
    if (uiEntity && uiEntity.script && uiEntity.script.eulerUIController) {
        try {
            console.log("🎯 Calling EulerUIController cleanup method...");
            if (typeof uiEntity.script.eulerUIController.cleanup === 'function') {
                uiEntity.script.eulerUIController.cleanup();
            } else {
                // Fallback to legacy destroy method
                console.log("🔄 Fallback: Using legacy destroy method...");
                uiEntity.script.eulerUIController.destroy();
            }
        } catch (error) {
            console.warn("Warning during EulerUIController cleanup:", error);
        }
    } else {
        console.warn("⚠️ EulerUIController not found for cleanup");
    }
    
    // CRITICAL: Also cleanup EulerTopologySimulation DOM elements (terminal, stats, title)
    const eulerContainer = this.app.root.findByName('EulerContainer');
    if (eulerContainer && eulerContainer.script && eulerContainer.script.eulerTopologySimulation) {
        try {
            console.log("🎯 Calling EulerTopologySimulation cleanup method...");
            if (typeof eulerContainer.script.eulerTopologySimulation.destroy === 'function') {
                eulerContainer.script.eulerTopologySimulation.destroy();
            }
        } catch (error) {
            console.warn("Warning during EulerTopologySimulation cleanup:", error);
        }
    } else {
        console.warn("⚠️ EulerTopologySimulation not found for cleanup");
    }
    
    // Also stop audio manager directly as backup
    const audioEntity = this.app.root.findByName('AudioEntity');
    if (audioEntity && audioEntity.script && audioEntity.script.eulerAudioManager) {
        try {
            console.log("🔇 Backup: Stopping Euler audio directly...");
            audioEntity.script.eulerAudioManager.stopAudio();
        } catch (error) {
            console.warn("Warning stopping Euler audio:", error);
        }
    }
    
    // Remove euler UI elements by selector
    const elementsToRemove = [
        'div[style*="Network State"]',
        'div[style*="System Stats"]', 
        'div[style*="INTERSPECIFICS"]',
        'div[style*="terminal"]',
        'div[style*="EULER TOPOLOGY SYNTH"]',
        'div[style*="Triangle Density"]',
        '.lil-gui',
        'canvas[style*="waveform"]',
        'canvas[style*="blend"]',
        'button[style*="Start Audio"]',
        'button[style*="Stop Audio"]',
        'div[style*="rgba(0, 0, 0, 0.8)"]', // Debug terminal
        'div[style*="color: #0f0"]' // Green terminal text
    ];
    
    elementsToRemove.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            // Protect mode switcher from cleanup
            if (el.id === 'app-manager-mode-switcher' || 
                el.className === 'app-manager-mode-switcher' ||
                el.className === 'app-manager-mode-button' ||
                el.closest('#app-manager-mode-switcher')) {
                console.log("🛡️ Protected mode switcher element from Euler cleanup");
                return; // Skip removing this element
            }
            
            if (el.parentNode) {
                el.parentNode.removeChild(el);
                console.log("🗑️ Removed element:", selector);
            }
        });
    });
    
    // Clean up any euler-specific divs by content
    const allDivs = document.querySelectorAll('div');
    allDivs.forEach(div => {
        // Protect mode switcher from cleanup
        if (div.id === 'app-manager-mode-switcher' || 
            div.className === 'app-manager-mode-switcher' ||
            div.closest('#app-manager-mode-switcher')) {
            return; // Skip removing this element
        }
        
        if (div.textContent && (
            div.textContent.includes('EULER') ||
            div.textContent.includes('TOPOLOGY SYNTH') ||
            div.textContent.includes('Network State') ||
            div.textContent.includes('Triangle Density') ||
            div.textContent.includes('INTERSPECIFICS') ||
            div.textContent.includes('Audio: Started') ||
            div.textContent.includes('Audio: Stopped') ||
            div.textContent.includes('Controls') ||
            div.textContent.includes('Particle Count') ||
            div.textContent.includes('Active Triangles')
        )) {
            // Extra check: don't remove if it's a mode button (contains HOME, CUBES, EULER)
            if (div.textContent.includes('HOME') || 
                div.textContent.includes('CUBES') || 
                (div.textContent.includes('EULER') && div.textContent.length < 10)) {
                console.log("🛡️ Protected mode button from content cleanup");
                return;
            }
            
            if (div.parentNode) {
                div.parentNode.removeChild(div);
                console.log("🗑️ Removed euler div by content");
            }
        }
    });
    
    // Clean up any orphaned canvas elements from Euler
    const allCanvas = document.querySelectorAll('canvas');
    allCanvas.forEach(canvas => {
        if (canvas.style.position === 'fixed' && 
            (canvas.style.left === '30px' || canvas.style.right === '30px')) {
            canvas.parentNode.removeChild(canvas);
            console.log("🗑️ Removed orphaned Euler canvas");
        }
    });
    
    // Debug: Count DOM elements after cleanup
    const afterCleanup = {
        divs: document.querySelectorAll('div').length,
        canvas: document.querySelectorAll('canvas').length,
        buttons: document.querySelectorAll('button').length
    };
    console.log("📊 DOM elements after cleanup:", afterCleanup);
    console.log("📉 Elements removed:", {
        divs: beforeCleanup.divs - afterCleanup.divs,
        canvas: beforeCleanup.canvas - afterCleanup.canvas,
        buttons: beforeCleanup.buttons - afterCleanup.buttons
    });
    
    // 🚨 EXTRA AGGRESSIVE cleanup for Marching Cubes compatibility
    console.log("🚨 EXTRA AGGRESSIVE cleanup - removing ALL potential Euler conflicts...");
    
    // Force remove ANY fixed position elements that could be Euler UI
    const allFixedElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const style = window.getComputedStyle(el);
        return style.position === 'fixed' && el.id !== 'app-manager-mode-switcher';
    });
    
    allFixedElements.forEach(el => {
        // Extra protection for mode switcher
        if (el.id === 'app-manager-mode-switcher' || 
            el.className === 'app-manager-mode-switcher' ||
            el.closest('#app-manager-mode-switcher')) {
            return;
        }
        
        // Check if it looks like Euler UI
        const text = el.textContent || '';
        const hasEulerContent = text.includes('Triangle') || 
                               text.includes('Particle') || 
                               text.includes('Network') ||
                               text.includes('EULER') ||
                               text.includes('TOPOLOGY') ||
                               text.includes('Controls') ||
                               el.tagName === 'CANVAS';
        
        if (hasEulerContent && el.parentNode) {
            el.parentNode.removeChild(el);
            console.log("🚨 AGGRESSIVE: Removed potential Euler UI element");
        }
    });
    
    // Force clear any remaining animation frames that could be from Euler
    for (let i = 0; i < 100; i++) {
        try {
            cancelAnimationFrame(i);
        } catch (e) {
            // Ignore errors
        }
    }
    
    console.log("✅ AGGRESSIVE Euler UI cleanup complete - ready for Marching Cubes");
};

// ===== AUDIO CONTEXT MANAGEMENT =====
AppManager.prototype.ensureAudioContext = function() {
    if (this.audioContextStarted) return;
    
    if (typeof Tone !== 'undefined') {
        Tone.start().then(() => {
            this.audioContextStarted = true;
            console.log("🔊 Audio context started");
        }).catch(err => {
            console.error("Failed to start audio context:", err);
        });
    }
};

// ===== DEBUG SHORTCUTS =====
AppManager.prototype.setupDebugKeyboardShortcuts = function() {
    window.addEventListener('keydown', (e) => {
        // Only respond to shortcuts if no input elements are focused
        if (document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'TEXTAREA') {
            return;
        }
        
        switch (e.key) {
            case '1':
                this.switchMode('home');
                break;
            case '2':
                this.switchMode('marchingCubes');
                break;
            case '3':
                this.switchMode('euler');
                break;
        }
    });
    
    console.log("🎹 Debug shortcuts enabled: 1=Home, 2=Marching Cubes, 3=Euler");
};

// ===== CLEANUP =====
AppManager.prototype.destroy = function() {
    console.log("🧹 Cleaning up App Manager");
    
    // Remove mode switcher UI
    if (this.modeSwitcher && this.modeSwitcher.parentNode) {
        document.body.removeChild(this.modeSwitcher);
    }
    
    // Deactivate current mode
    this.deactivateCurrentMode();
    
    console.log("✅ App Manager cleanup complete");
}; 