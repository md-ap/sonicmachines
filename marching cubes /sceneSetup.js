// Scene Setup Script for PlayCanvas
var SceneSetup = pc.createScript('sceneSetup');

// Add script attributes for editor configuration
SceneSetup.attributes.add('cameraDistance', { type: 'number', default: 8.0, title: 'Camera Distance' });
SceneSetup.attributes.add('lightIntensity', { type: 'number', default: 1.0, title: 'Light Intensity' });
SceneSetup.attributes.add('isViverse', { type: 'boolean', default: false, title: 'Is Viverse' }); // Default to false for PlayCanvas

// Initialize code called once per entity
SceneSetup.prototype.initialize = function() {
    console.log("🌍 [SceneSetup] script initialized");
    
    // Detect if we're running in Viverse
    const runningInViverse = this.isViverse || (window.viverse !== undefined);
    console.log("Running in Viverse:", runningInViverse);
    
    // Check if we're in mode-managed environment
    const appManager = this.app.root.findByName('AppManager');
    if (appManager && appManager.script && appManager.script.AppManager) {
        const currentMode = appManager.script.AppManager.currentMode;
        if (currentMode !== 'marchingCubes') {
            console.log("SceneSetup disabled - not in marching cubes mode");
            return;
        }
        // We're in marching cubes mode, continue with setup
        console.log("SceneSetup running in marching cubes mode");
    }
    
    // Setup camera only if not in Viverse
    if (!runningInViverse && !this.app.root.findByName('Camera')) {
        this.setupCamera();
    }
    
    // Setup SpawnPoint for Viverse if needed
    if (runningInViverse && !this.app.root.findByName('SpawnPoint')) {
        this.setupSpawnPoint();
    }
    
    // Setup light if it doesn't exist
    if (!this.app.root.findByName('DirectionalLight')) {
        this.setupLight();
    }
    
    // Setup floor for Viverse if needed
    if (runningInViverse && !this.app.root.findByName('Floor')) {
        this.setupFloor();
    }
    
    // Setup marching cubes entity if it doesn't exist
    if (!this.app.root.findByName('MarchingCubes')) {
        this.setupMarchingCubes();
    }
    
    // Add Tone.js script if needed
    this.loadToneJS();
    
    // Skip central start audio button in managed mode (UI has its own audio controls)
    // this.createStartAudioButton();
    
    // Add first person controller script for Viverse
    if (runningInViverse) {
        this.setupFirstPersonController();
    }
};

// Setup camera entity - only used in non-Viverse mode
SceneSetup.prototype.setupCamera = function() {
    const camera = new pc.Entity('Camera');
    camera.addComponent('camera', {
        clearColor: new pc.Color(0, 0, 0), // Black background
        clearColorBuffer: true,
        clearDepthBuffer: true
    });
    this.app.root.addChild(camera);
    // Position camera for optimal viewing
    camera.setPosition(0, 1, 3); // Stable position without excessive movement
    camera.lookAt(0, 0, 0);
    console.log("📷 Camera positioned at (0, 1, 3) looking at (0, 0, 0)");
};

// Setup SpawnPoint for Viverse
SceneSetup.prototype.setupSpawnPoint = function() {
    const spawnPoint = new pc.Entity('SpawnPoint');
    spawnPoint.tags.add('spawn-point'); // Important: Add the required tag
    this.app.root.addChild(spawnPoint);
    
    // Position the spawn point for stable viewing
    spawnPoint.setPosition(0, 1.5, 2);
    spawnPoint.setEulerAngles(0, 0, 0);
    
    console.log('SpawnPoint created for Viverse');
};

// Setup floor for Viverse
SceneSetup.prototype.setupFloor = function() {
    const floor = new pc.Entity('Floor');
    
    // Add a render component with a plane model
    floor.addComponent('render', {
        type: 'plane',
        castShadows: false,
        receiveShadows: true
    });
    
    // Create transparent material
    const material = new pc.StandardMaterial();
    material.opacity = 0.1;
    material.blendType = pc.BLEND_NORMAL;
    material.depthWrite = false;
    material.update();
    
    // Assign material to the floor
    floor.render.material = material;
    
    // Add collision component
    floor.addComponent('collision', {
        type: 'box',
        halfExtents: new pc.Vec3(3, 0.1, 3)
    });
    
    // Add rigidbody component
    floor.addComponent('rigidbody', {
        type: 'static',
        restitution: 0.5
    });
    
    // Position and scale the floor
    floor.setLocalPosition(0, -1.5, 0);
    floor.setLocalScale(6, 1, 6);
    
    this.app.root.addChild(floor);
    console.log('Floor created for Viverse');
};

// Setup directional light
SceneSetup.prototype.setupLight = function() {
    const light = new pc.Entity('DirectionalLight');
    light.addComponent('light', {
        type: 'directional',
        color: new pc.Color(1, 1, 1), // White light
        intensity: 2.0, // Brighter light for visibility
        castShadows: false, // Disable shadows to avoid shader issues
        shadowBias: 0.05,
        normalOffsetBias: 0.05
    });
    this.app.root.addChild(light);
    light.setEulerAngles(45, 30, 0); // Angle the light
    console.log("💡 Directional light created with high intensity");
};

// Setup marching cubes entity
SceneSetup.prototype.setupMarchingCubes = function() {
    const marchingCubes = new pc.Entity('MarchingCubes');
    
    // Add the entity to the scene first
    this.app.root.addChild(marchingCubes);
    
    // Add script component
    marchingCubes.addComponent('script');
    
    // Add marching cubes script to the script component
    marchingCubes.script.create('marchingCubes', {
        attributes: {
            resolution: 28,
            size: 3.0,
            isolation: 1.0,
            numBlobs: 1,
            speed: 5.0,
            enableAudio: true
        }
    });
    
    console.log('MarchingCubes entity created with script');
};

// Add first person controller script for Viverse
SceneSetup.prototype.setupFirstPersonController = function() {
    // Find the SpawnPoint entity
    const spawnPoint = this.app.root.findByName('SpawnPoint');
    if (!spawnPoint) {
        console.error('Cannot setup FirstPersonController: SpawnPoint not found');
        return;
    }
    
    // Add script component if it doesn't exist
    if (!spawnPoint.script) {
        spawnPoint.addComponent('script');
    }
    
    // Add firstPersonController script to the SpawnPoint
    if (!spawnPoint.script.firstPersonController) {
        spawnPoint.script.create('firstPersonController');
        console.log('FirstPersonController script added to SpawnPoint');
    }
};

// Load Tone.js script dynamically
SceneSetup.prototype.loadToneJS = function() {
    // Check if Tone.js is already available
    if (typeof Tone !== 'undefined') {
        console.log('Tone.js already loaded');
        return;
    }
    
    // Create script element
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js';
    script.async = true;
    
    // Add load event listener
    script.addEventListener('load', () => {
        console.log('Tone.js loaded successfully');
    });
    
    // Add error event listener
    script.addEventListener('error', () => {
        console.error('Failed to load Tone.js');
    });
    
    // Append script to document head
    document.head.appendChild(script);
};

// Create start audio button
SceneSetup.prototype.createStartAudioButton = function() {
    // Create start button
    const startButton = document.createElement('button');
    startButton.textContent = 'Start Audio';
    startButton.style.position = 'fixed';
    startButton.style.top = '50%';
    startButton.style.left = '50%';
    startButton.style.transform = 'translate(-50%, -50%)';
    startButton.style.padding = '15px 30px';
    startButton.style.background = '#0f0';
    startButton.style.color = '#000';
    startButton.style.border = 'none';
    startButton.style.borderRadius = '5px';
    startButton.style.fontSize = '18px';
    startButton.style.cursor = 'pointer';
    startButton.style.zIndex = '2000'; // Higher than other UI elements
    
    // Add click event
    startButton.addEventListener('click', async () => {
        console.log('Start audio button clicked');
        
        if (typeof Tone === 'undefined') {
            console.error('Tone.js not loaded yet');
            return;
        }
        
        try {
            // Start Tone.js audio context
            await Tone.start();
            console.log('Audio context started');
            
            // Find marching cubes entity and initialize audio
            const marchingCubes = this.app.root.findByName('MarchingCubes');
            if (marchingCubes && marchingCubes.script && marchingCubes.script.marchingCubes) {
                console.log('Initializing audio for marching cubes');
                marchingCubes.script.marchingCubes.initializeAudio();
            } else {
                console.error('Could not find marching cubes script');
            }
            
            // Hide button after starting
            startButton.style.display = 'none';
        } catch (error) {
            console.error('Error starting audio:', error);
        }
    });
    
    // Add button to document
    document.body.appendChild(startButton);
    
    console.log('✅ [SceneSetup] Start audio button created and added to DOM');
}; 