var EulerCameraController = pc.createScript('eulerCameraController');

// Add script attributes for editor configuration
EulerCameraController.attributes.add('distance', { type: 'number', default: 35, title: 'Distance' });
EulerCameraController.attributes.add('rotateSpeed', { type: 'number', default: 0.3, title: 'Rotate Speed' });
EulerCameraController.attributes.add('zoomSpeed', { type: 'number', default: 2.0, title: 'Zoom Speed' });
EulerCameraController.attributes.add('minDistance', { type: 'number', default: 10, title: 'Min Distance' });
EulerCameraController.attributes.add('maxDistance', { type: 'number', default: 100, title: 'Max Distance' });

// Initialize code called once per entity
EulerCameraController.prototype.initialize = function() {
    console.log("Euler Camera Controller initialized");
    
    // Always initialize camera controls - mode checking happens in update loop
    // This ensures camera is always ready when Euler mode activates
    
    // Camera state
    this.pitch = 0;
    this.yaw = 0;
    this.currentDistance = this.distance;
    
    // Target values for smooth interpolation
    this.targetPitch = 0;
    this.targetYaw = 0;
    this.targetDistance = this.distance;
    
    // Mouse state
    this.isRotating = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    
    // Touch state for mobile
    this.isTouching = false;
    this.lastTouchX = 0;
    this.lastTouchY = 0;
    this.lastTouchDistance = 0;
    
    // Keyboard state for Viverse compatibility
    this.keys = {
        w: false,
        a: false,
        s: false,
        d: false,
        q: false,
        e: false
    };
    
    // Movement speed for keyboard controls
    this.moveSpeed = 10.0;
    this.keyboardRotateSpeed = 60.0; // degrees per second
    
    // UI blocking flag
    this.uiBlocked = false;
    
    // Target to look at (center of particle system)
    this.target = new pc.Vec3(0, 0, 0);
    
    // Setup event listeners
    console.log("🎮 Setting up camera event listeners...");
    this.setupEventListeners();
    
    // Set initial camera position
    console.log("📷 Setting initial camera position...");
    this.updateCameraPosition();
    
    // Start with automatic rotation like the original
    this.autoRotate = true;
    this.autoRotateSpeed = 1.0; // degrees per frame (increased for visibility)
    
    console.log("✅ Euler camera controller setup complete");
};

// Setup event listeners
EulerCameraController.prototype.setupEventListeners = function() {
    try {
        console.log("🎮 Binding event handlers...");
        // Mouse events
        this.onMouseDown = this._onMouseDown.bind(this);
        this.onMouseUp = this._onMouseUp.bind(this);
        this.onMouseMove = this._onMouseMove.bind(this);
        this.onMouseWheel = this._onMouseWheel.bind(this);
        
        // Touch events
        this.onTouchStart = this._onTouchStart.bind(this);
        this.onTouchEnd = this._onTouchEnd.bind(this);
        this.onTouchMove = this._onTouchMove.bind(this);
        
        // Keyboard events
        this.onKeyDown = this._onKeyDown.bind(this);
        this.onKeyUp = this._onKeyUp.bind(this);
        
        console.log("🖱️ Adding mouse event listeners...");
        // Add event listeners with passive options
        window.addEventListener('mousedown', this.onMouseDown, { passive: false });
        window.addEventListener('mouseup', this.onMouseUp, { passive: false });
        window.addEventListener('mousemove', this.onMouseMove, { passive: false });
        window.addEventListener('wheel', this.onMouseWheel, { passive: false });
        
        console.log("👆 Adding touch event listeners...");
        window.addEventListener('touchstart', this.onTouchStart, { passive: false });
        window.addEventListener('touchend', this.onTouchEnd, { passive: false });
        window.addEventListener('touchmove', this.onTouchMove, { passive: false });
        
        console.log("⌨️ Adding keyboard event listeners...");
        window.addEventListener('keydown', this.onKeyDown, { passive: false });
        window.addEventListener('keyup', this.onKeyUp, { passive: false });
        
        // Prevent context menu on right click
        window.addEventListener('contextmenu', (e) => e.preventDefault(), { passive: false });
        
        console.log("✅ All camera event listeners added successfully");
    } catch (error) {
        console.error("❌ Error setting up camera event listeners:", error);
    }
};

// Mouse event handlers
EulerCameraController.prototype._onMouseDown = function(event) {
    // Check if mouse is over UI elements directly (but not the main PlayCanvas canvas)
    const elementUnderMouse = document.elementFromPoint(event.clientX, event.clientY);
    const isOverUI = elementUnderMouse && (
        elementUnderMouse.closest('.lil-gui') || 
        elementUnderMouse.closest('button') ||
        (elementUnderMouse.tagName === 'CANVAS' && 
         (elementUnderMouse.style.position === 'fixed' || 
          elementUnderMouse.style.zIndex > 1000))
    );
    
            // console.log(`🔍 Element under mouse: ${elementUnderMouse?.tagName}, id: ${elementUnderMouse?.id}, class: ${elementUnderMouse?.className}`); // Commented to reduce console spam
        
        // console.log(`🖱️ Mouse down: button=${event.button}, uiBlocked=${this.uiBlocked}, isOverUI=${isOverUI}`); // Commented to reduce console spam
    
    // Allow rotation if not over UI elements and correct button
    if (!isOverUI && (event.button === 0 || event.button === 2)) { // Left or right mouse button
                        // console.log("✅ Starting camera rotation"); // Commented to reduce console spam
        this.isRotating = true;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
        event.preventDefault();
    } else {
                    // console.log("❌ Mouse input blocked - over UI or wrong button"); // Commented to reduce console spam
    }
};

EulerCameraController.prototype._onMouseUp = function(event) {
            // console.log("🖱️ Mouse up - stopping rotation"); // Commented to reduce console spam
    this.isRotating = false;
};

EulerCameraController.prototype._onMouseMove = function(event) {
    if (this.isRotating) {
        const deltaX = event.clientX - this.lastMouseX;
        const deltaY = event.clientY - this.lastMouseY;
        
        // Only log if there's significant movement to avoid spam
        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
            // console.log(`🔄 Camera rotating: deltaX=${deltaX}, deltaY=${deltaY}`); // Commented to reduce console spam
        }
        
        this.targetYaw -= deltaX * this.rotateSpeed * 0.2;
        this.targetPitch -= deltaY * this.rotateSpeed * 0.2;
        
        // Clamp pitch to avoid flipping
        this.targetPitch = Math.max(-89, Math.min(89, this.targetPitch));
        
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
    }
};

EulerCameraController.prototype._onMouseWheel = function(event) {
    const delta = event.deltaY > 0 ? 1 : -1;
    this.targetDistance += delta * this.zoomSpeed;
    this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance));
    event.preventDefault();
};

// Touch event handlers
EulerCameraController.prototype._onTouchStart = function(event) {
    if (event.touches.length === 1) {
        // Single touch - rotation
        this.isTouching = true;
        this.lastTouchX = event.touches[0].clientX;
        this.lastTouchY = event.touches[0].clientY;
    } else if (event.touches.length === 2) {
        // Two finger touch - zoom
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        this.lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
    }
    event.preventDefault();
};

EulerCameraController.prototype._onTouchEnd = function(event) {
    this.isTouching = false;
};

EulerCameraController.prototype._onTouchMove = function(event) {
    if (event.touches.length === 1 && this.isTouching) {
        // Single touch - rotation
        const deltaX = event.touches[0].clientX - this.lastTouchX;
        const deltaY = event.touches[0].clientY - this.lastTouchY;
        
        this.targetYaw -= deltaX * this.rotateSpeed * 0.3;
        this.targetPitch -= deltaY * this.rotateSpeed * 0.3;
        
        // Clamp pitch
        this.targetPitch = Math.max(-89, Math.min(89, this.targetPitch));
        
        this.lastTouchX = event.touches[0].clientX;
        this.lastTouchY = event.touches[0].clientY;
    } else if (event.touches.length === 2) {
        // Two finger touch - zoom
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (this.lastTouchDistance > 0) {
            const delta = (distance - this.lastTouchDistance) * 0.01;
            this.targetDistance -= delta * this.zoomSpeed;
            this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance));
        }
        
        this.lastTouchDistance = distance;
    }
    event.preventDefault();
};

// Keyboard event handlers
EulerCameraController.prototype._onKeyDown = function(event) {
    const key = event.key.toLowerCase();
    if (this.keys.hasOwnProperty(key)) {
        this.keys[key] = true;
        event.preventDefault();
    }
    
    // Additional keyboard shortcuts
    switch(key) {
        case 'home': // Reset camera
            this.resetCamera();
            event.preventDefault();
            break;
        case '+':
        case '=': // Zoom in
            this.targetDistance -= this.zoomSpeed;
            this.targetDistance = Math.max(this.minDistance, this.targetDistance);
            event.preventDefault();
            break;
        case '-': // Zoom out
            this.targetDistance += this.zoomSpeed;
            this.targetDistance = Math.min(this.maxDistance, this.targetDistance);
            event.preventDefault();
            break;
    }
};

EulerCameraController.prototype._onKeyUp = function(event) {
    const key = event.key.toLowerCase();
    if (this.keys.hasOwnProperty(key)) {
        this.keys[key] = false;
        event.preventDefault();
    }
};

// Reset camera to default position
EulerCameraController.prototype.resetCamera = function() {
    this.targetPitch = 0;
    this.targetYaw = 0;
    this.targetDistance = this.distance;
    console.log('Camera reset to default position');
};

// Update camera position based on keyboard input
EulerCameraController.prototype.updateKeyboardMovement = function(dt) {
    // WASD movement (relative to camera orientation)
    let moveX = 0;
    let moveY = 0;
    let moveZ = 0;
    
    if (this.keys.w) moveZ -= 1; // Forward
    if (this.keys.s) moveZ += 1; // Backward
    if (this.keys.a) moveX -= 1; // Left
    if (this.keys.d) moveX += 1; // Right
    if (this.keys.q) moveY -= 1; // Down
    if (this.keys.e) moveY += 1; // Up
    
    // Apply movement
    if (moveX !== 0 || moveY !== 0 || moveZ !== 0) {
        // Get camera's forward, right, and up vectors
        const forward = new pc.Vec3();
        const right = new pc.Vec3();
        const up = new pc.Vec3();
        
        this.entity.getForward(forward);
        this.entity.getRight(right);
        this.entity.getUp(up);
        
        // Calculate movement vector
        const movement = new pc.Vec3();
        movement.add(right.clone().scale(moveX * this.moveSpeed * dt));
        movement.add(up.clone().scale(moveY * this.moveSpeed * dt));
        movement.add(forward.clone().scale(moveZ * this.moveSpeed * dt));
        
        // Update target position
        this.target.add(movement);
    }
};

// Update camera position
EulerCameraController.prototype.updateCameraPosition = function() {
    // Smooth interpolation
    const lerpFactor = 0.1;
    const oldYaw = this.yaw;
    this.pitch = pc.math.lerp(this.pitch, this.targetPitch, lerpFactor);
    this.yaw = pc.math.lerp(this.yaw, this.targetYaw, lerpFactor);
    this.currentDistance = pc.math.lerp(this.currentDistance, this.targetDistance, lerpFactor);
    
    // Debug significant camera changes
    if (Math.abs(this.yaw - oldYaw) > 0.1) {
        console.log(`📷 Camera position updated: yaw=${this.yaw.toFixed(1)}, distance=${this.currentDistance.toFixed(1)}`);
    }
    
    // Convert spherical coordinates to Cartesian
    const pitchRad = this.pitch * pc.math.DEG_TO_RAD;
    const yawRad = this.yaw * pc.math.DEG_TO_RAD;
    
    const x = this.currentDistance * Math.cos(pitchRad) * Math.sin(yawRad);
    const y = this.currentDistance * Math.sin(pitchRad);
    const z = this.currentDistance * Math.cos(pitchRad) * Math.cos(yawRad);
    
    // Set camera position relative to target
    this.entity.setPosition(
        this.target.x + x,
        this.target.y + y,
        this.target.z + z
    );
    
    // Look at target
    this.entity.lookAt(this.target);
};

// Get camera info for audio feedback
EulerCameraController.prototype.getCameraInfo = function() {
    const position = this.entity.getPosition();
    const distance = position.distance(this.target);
    
    // Calculate azimuth and elevation
    const direction = new pc.Vec3();
    direction.sub2(position, this.target).normalize();
    
    const azimuth = Math.atan2(direction.x, direction.z) * pc.math.RAD_TO_DEG;
    const elevation = Math.asin(direction.y) * pc.math.RAD_TO_DEG;
    
    return {
        distance: distance,
        azimuth: azimuth,
        elevation: elevation,
        position: position.clone(),
        target: this.target.clone()
    };
};

// Update function called every frame
EulerCameraController.prototype.update = function(dt) {
    // Check if we should run (only when euler mode is active)
    const appManager = this.app.root.findByName('AppManager');
    if (appManager && appManager.script && appManager.script.AppManager) {
        const currentMode = appManager.script.AppManager.currentMode;
        if (currentMode !== 'euler') {
            // Don't update camera when not in euler mode
            return;
        }
    }
    
    // Auto rotation when not manually controlling
    if (!this.isRotating && !this.isTouching) {
        this.targetYaw += this.autoRotateSpeed * this.rotateSpeed;
        // Debug auto-rotation occasionally
        if (Math.floor(Date.now() / 1000) % 5 === 0 && Date.now() % 1000 < 20) {
            // console.log(`🔄 Auto-rotating: targetYaw=${this.targetYaw.toFixed(1)}, currentYaw=${this.yaw.toFixed(1)}`); // Commented to reduce console spam
        }
    }
    
    // Update keyboard movement
    this.updateKeyboardMovement(dt);
    
    // Update camera position
    this.updateCameraPosition();
    
    // Send camera info to audio manager for spatial audio
    const audioEntity = this.app.root.findByName('AudioEntity');
    if (audioEntity && audioEntity.script.eulerAudioManager) {
        const cameraInfo = this.getCameraInfo();
        // You can extend the audio manager to use camera info for spatial audio
        // audioEntity.script.eulerAudioManager.updateCameraInfo(cameraInfo);
    }
};

// Clean up when script is destroyed
EulerCameraController.prototype.destroy = function() {
    // Remove event listeners
    window.removeEventListener('mousedown', this.onMouseDown, { passive: false });
    window.removeEventListener('mouseup', this.onMouseUp, { passive: false });
    window.removeEventListener('mousemove', this.onMouseMove, { passive: false });
    window.removeEventListener('wheel', this.onMouseWheel, { passive: false });
    
    window.removeEventListener('touchstart', this.onTouchStart, { passive: false });
    window.removeEventListener('touchend', this.onTouchEnd, { passive: false });
    window.removeEventListener('touchmove', this.onTouchMove, { passive: false });
    
    window.removeEventListener('keydown', this.onKeyDown, { passive: false });
    window.removeEventListener('keyup', this.onKeyUp, { passive: false });
}; 