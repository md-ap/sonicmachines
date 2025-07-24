// Este archivo será movido al folder 'marching cubes ' (con espacio al final) para unificar la ubicación.
// Scene Setup Script for PlayCanvas
var SceneSetup = pc.createScript('sceneSetup');

// Add script attributes for editor configuration
SceneSetup.attributes.add('cameraDistance', { type: 'number', default: 8.0, title: 'Camera Distance' });
SceneSetup.attributes.add('lightIntensity', { type: 'number', default: 1.0, title: 'Light Intensity' });
SceneSetup.attributes.add('isViverse', { type: 'boolean', default: false, title: 'Is Viverse' });

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
        console.log("SceneSetup running in marching cubes mode");
    }
    
    // Setup camera only if not in Viverse and doesn't exist
    if (!runningInViverse) {
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
    
    // Add first person controller script for Viverse
    if (runningInViverse) {
        this.setupFirstPersonController();
    }
};

// Setup camera entity - solo si no existe, y agregar mainCameraController
SceneSetup.prototype.setupCamera = function() {
    let camera = this.app.root.findByName('Camera');
    if (!camera) {
        camera = new pc.Entity('Camera');
        camera.addComponent('camera', {
            clearColor: new pc.Color(0, 0, 0),
            clearColorBuffer: true,
            clearDepthBuffer: true
        });
        camera.addComponent('script');
        camera.script.create('mainCameraController');
        this.app.root.addChild(camera);
        // Posición inicial neutra, el script la ajustará según el modo
        camera.setPosition(0, 1, 3);
        camera.lookAt(0, 0, 0);
        console.log('📷 Camera creada y mainCameraController agregado');
    } else if (!camera.script || !camera.script.mainCameraController) {
        if (!camera.script) camera.addComponent('script');
        camera.script.create('mainCameraController');
        console.log('📷 mainCameraController agregado a cámara existente');
    }
};

// Setup SpawnPoint for Viverse
SceneSetup.prototype.setupSpawnPoint = function() {
    const spawnPoint = new pc.Entity('SpawnPoint');
    spawnPoint.tags.add('spawn-point');
    this.app.root.addChild(spawnPoint);
    
    spawnPoint.setPosition(0, 1.5, 2);
    spawnPoint.setEulerAngles(0, 0, 0);
    
    console.log('SpawnPoint created for Viverse');
};

// Setup floor for Viverse
SceneSetup.prototype.setupFloor = function() {
    const floor = new pc.Entity('Floor');
    
    floor.addComponent('render', {
        type: 'plane',
        castShadows: false,
        receiveShadows: true
    });
    
    const material = new pc.StandardMaterial();
    material.opacity = 0.1;
    material.blendType = pc.BLEND_NORMAL;
    material.depthWrite = false;
    material.update();
    
    floor.render.material = material;
    
    floor.addComponent('collision', {
        type: 'box',
        halfExtents: new pc.Vec3(3, 0.1, 3)
    });
    
    floor.addComponent('rigidbody', {
        type: 'static',
        restitution: 0.5
    });
    
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
        color: new pc.Color(1, 1, 1),
        intensity: 2.0,
        castShadows: false,
        shadowBias: 0.05,
        normalOffsetBias: 0.05
    });
    this.app.root.addChild(light);
    light.setEulerAngles(45, 30, 0);
    console.log("💡 Directional light created with high intensity");
};

// Setup marching cubes entity
SceneSetup.prototype.setupMarchingCubes = function() {
    const marchingCubes = new pc.Entity('MarchingCubes');
    
    this.app.root.addChild(marchingCubes);
    
    marchingCubes.addComponent('script');
    
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
    const spawnPoint = this.app.root.findByName('SpawnPoint');
    if (!spawnPoint) {
        console.error('Cannot setup FirstPersonController: SpawnPoint not found');
        return;
    }
    
    if (!spawnPoint.script) {
        spawnPoint.addComponent('script');
    }
    
    if (!spawnPoint.script.firstPersonController) {
        spawnPoint.script.create('firstPersonController');
        console.log('FirstPersonController script added to SpawnPoint');
    }
};

// Load Tone.js script dynamically
SceneSetup.prototype.loadToneJS = function() {
    if (typeof Tone !== 'undefined') {
        console.log('Tone.js already loaded');
        return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js';
    script.async = true;
    
    script.addEventListener('load', () => {
        console.log('Tone.js loaded successfully');
    });
    
    script.addEventListener('error', () => {
        console.error('Failed to load Tone.js');
    });
    
    document.head.appendChild(script);
}; 