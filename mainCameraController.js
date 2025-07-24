// Main Camera Controller - Unificado para Euler y Marching Cubes
var MainCameraController = pc.createScript('mainCameraController');

// Atributos configurables
MainCameraController.attributes.add('eulerDistance', { type: 'number', default: 50, title: 'Euler Distance' });
MainCameraController.attributes.add('marchingCubesDistance', { type: 'number', default: 6, title: 'Marching Cubes Distance' });
MainCameraController.attributes.add('homeDistance', { type: 'number', default: 20, title: 'Home Distance' });
MainCameraController.attributes.add('rotateSpeed', { type: 'number', default: 0.3, title: 'Rotate Speed' });
MainCameraController.attributes.add('zoomSpeed', { type: 'number', default: 2.0, title: 'Zoom Speed' });
MainCameraController.attributes.add('minDistance', { type: 'number', default: 5, title: 'Min Distance' });
MainCameraController.attributes.add('maxDistance', { type: 'number', default: 100, title: 'Max Distance' });

MainCameraController.prototype.initialize = function() {
    console.log("📷 Main Camera Controller initialized");
    
    // Estado de cámara
    this.pitch = 0;
    this.yaw = 0;
    this.currentDistance = this.getDefaultDistance();
    this.targetPitch = 0;
    this.targetYaw = 0;
    this.targetDistance = this.getDefaultDistance();
    this.isRotating = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.isTouching = false;
    this.lastTouchX = 0;
    this.lastTouchY = 0;
    this.lastTouchDistance = 0;
    this.keys = { w: false, a: false, s: false, d: false, q: false, e: false };
    this.moveSpeed = 10.0;
    this.keyboardRotateSpeed = 60.0;
    this.uiBlocked = false;
    this.target = new pc.Vec3(0, 0, 0);
    this.autoRotate = true;
    this.autoRotateSpeed = 1.0;
    this.lastMode = null;
    
    // Properties for Euler UI controller
    this.targetDistance = this.getDefaultDistance();
    this.distance = this.getDefaultDistance();
    
    this.setupEventListeners();
    this.updateCameraForMode();
    
    console.log("✅ Main Camera Controller setup complete");
};

MainCameraController.prototype.getDefaultDistance = function() {
    const appManager = this.app.root.findByName('AppManager');
    if (appManager && appManager.script && appManager.script.AppManager) {
        const mode = appManager.script.AppManager.currentMode;
        if (mode === 'euler') return this.eulerDistance;
        if (mode === 'marchingCubes') return this.marchingCubesDistance;
    }
    return this.eulerDistance;
};

MainCameraController.prototype.updateCameraForMode = function() {
    const appManager = this.app.root.findByName('AppManager');
    let mode = 'euler';
    if (appManager && appManager.script && appManager.script.AppManager) {
        mode = appManager.script.AppManager.currentMode;
    }
    
    if (mode !== this.lastMode) {
        console.log(`📷 Switching camera to ${mode} mode`);
        
        if (mode === 'euler') {
            // Euler mode - use farther distance for better view of the network (50 units)
            this.target.set(0, 0, 0);
            this.targetDistance = this.eulerDistance; // 50 units
            this.currentDistance = this.eulerDistance;
            this.pitch = 0;
            this.yaw = 0;
            this.entity.setPosition(0, 0, this.eulerDistance);
            this.entity.setEulerAngles(0, 0, 0);
            this.entity.lookAt(0, 0, 0);
            console.log(`📷 Euler camera positioned at distance: ${this.eulerDistance}`);
        } else if (mode === 'marchingCubes') {
            // MarchingCubes mode - use closer distance and elevated view for blobs (6 units)
            this.target.set(0, 0, 0);
            this.targetDistance = this.marchingCubesDistance; // 6 units
            this.currentDistance = this.marchingCubesDistance;
            this.pitch = -10; // Slight downward angle
            this.yaw = 0;
            this.entity.setPosition(0, 2, this.marchingCubesDistance); // Elevated Y position
            this.entity.setEulerAngles(-10, 0, 0);
            this.entity.lookAt(0, 0, 0);
            console.log(`📷 MarchingCubes camera positioned at distance: ${this.marchingCubesDistance}, elevated`);
        } else {
            // Home mode - medium distance
            this.target.set(0, 0, 0);
            this.targetDistance = this.homeDistance; // 20 units
            this.currentDistance = this.homeDistance;
            this.pitch = 0;
            this.yaw = 0;
            this.entity.setPosition(0, 0, this.homeDistance);
            this.entity.setEulerAngles(0, 0, 0);
            this.entity.lookAt(0, 0, 0);
            console.log(`📷 Home camera positioned at distance: ${this.homeDistance}`);
        }
        
        this.lastMode = mode;
        console.log(`✅ Camera updated for ${mode} mode`);
    }
};

MainCameraController.prototype.setupEventListeners = function() {
    try {
        console.log("🎮 Setting up camera event listeners...");
        
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
        
        // Add event listeners
        window.addEventListener('mousedown', this.onMouseDown, { passive: false });
        window.addEventListener('mouseup', this.onMouseUp, { passive: false });
        window.addEventListener('mousemove', this.onMouseMove, { passive: false });
        window.addEventListener('wheel', this.onMouseWheel, { passive: false });
        
        window.addEventListener('touchstart', this.onTouchStart, { passive: false });
        window.addEventListener('touchend', this.onTouchEnd, { passive: false });
        window.addEventListener('touchmove', this.onTouchMove, { passive: false });
        
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
MainCameraController.prototype._onMouseDown = function(event) {
    const elementUnderMouse = document.elementFromPoint(event.clientX, event.clientY);
    const isOverUI = elementUnderMouse && (
        elementUnderMouse.closest('.lil-gui') || 
        elementUnderMouse.closest('button') ||
        (elementUnderMouse.tagName === 'CANVAS' && 
         (elementUnderMouse.style.position === 'fixed' || 
          elementUnderMouse.style.zIndex > 1000))
    );
    
    if (!isOverUI && (event.button === 0 || event.button === 2)) {
        this.isRotating = true;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
        event.preventDefault();
    }
};

MainCameraController.prototype._onMouseUp = function(event) {
    this.isRotating = false;
};

MainCameraController.prototype._onMouseMove = function(event) {
    if (this.isRotating) {
        const deltaX = event.clientX - this.lastMouseX;
        const deltaY = event.clientY - this.lastMouseY;
        
        this.targetYaw -= deltaX * this.rotateSpeed * 0.2;
        this.targetPitch -= deltaY * this.rotateSpeed * 0.2;
        
        // Clamp pitch to avoid flipping
        this.targetPitch = Math.max(-89, Math.min(89, this.targetPitch));
        
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
    }
};

MainCameraController.prototype._onMouseWheel = function(event) {
    const delta = event.deltaY > 0 ? 1 : -1;
    this.targetDistance += delta * this.zoomSpeed;
    this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance));
    event.preventDefault();
};

// Touch event handlers
MainCameraController.prototype._onTouchStart = function(event) {
    if (event.touches.length === 1) {
        this.isTouching = true;
        this.lastTouchX = event.touches[0].clientX;
        this.lastTouchY = event.touches[0].clientY;
    } else if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        this.lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
    }
    event.preventDefault();
};

MainCameraController.prototype._onTouchEnd = function(event) {
    this.isTouching = false;
};

MainCameraController.prototype._onTouchMove = function(event) {
    if (event.touches.length === 1 && this.isTouching) {
        const deltaX = event.touches[0].clientX - this.lastTouchX;
        const deltaY = event.touches[0].clientY - this.lastTouchY;
        
        this.targetYaw -= deltaX * this.rotateSpeed * 0.3;
        this.targetPitch -= deltaY * this.rotateSpeed * 0.3;
        
        this.targetPitch = Math.max(-89, Math.min(89, this.targetPitch));
        
        this.lastTouchX = event.touches[0].clientX;
        this.lastTouchY = event.touches[0].clientY;
    } else if (event.touches.length === 2) {
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
MainCameraController.prototype._onKeyDown = function(event) {
    const key = event.key.toLowerCase();
    if (this.keys.hasOwnProperty(key)) {
        this.keys[key] = true;
        event.preventDefault();
    }
    
    switch(key) {
        case 'home':
            this.resetCamera();
            event.preventDefault();
            break;
        case '+':
        case '=':
            this.targetDistance -= this.zoomSpeed;
            this.targetDistance = Math.max(this.minDistance, this.targetDistance);
            event.preventDefault();
            break;
        case '-':
            this.targetDistance += this.zoomSpeed;
            this.targetDistance = Math.min(this.maxDistance, this.targetDistance);
            event.preventDefault();
            break;
    }
};

MainCameraController.prototype._onKeyUp = function(event) {
    const key = event.key.toLowerCase();
    if (this.keys.hasOwnProperty(key)) {
        this.keys[key] = false;
        event.preventDefault();
    }
};

MainCameraController.prototype.resetCamera = function() {
    this.targetPitch = 0;
    this.targetYaw = 0;
    this.targetDistance = this.getDefaultDistance();
    console.log('📷 Camera reset to default position');
};

MainCameraController.prototype.updateKeyboardMovement = function(dt) {
    let moveX = 0;
    let moveY = 0;
    let moveZ = 0;
    
    if (this.keys.w) moveZ -= 1;
    if (this.keys.s) moveZ += 1;
    if (this.keys.a) moveX -= 1;
    if (this.keys.d) moveX += 1;
    if (this.keys.q) moveY -= 1;
    if (this.keys.e) moveY += 1;
    
    if (moveX !== 0 || moveY !== 0 || moveZ !== 0) {
        const forward = new pc.Vec3();
        const right = new pc.Vec3();
        const up = new pc.Vec3();
        
        this.entity.getForward(forward);
        this.entity.getRight(right);
        this.entity.getUp(up);
        
        const movement = new pc.Vec3();
        movement.add(right.clone().scale(moveX * this.moveSpeed * dt));
        movement.add(up.clone().scale(moveY * this.moveSpeed * dt));
        movement.add(forward.clone().scale(moveZ * this.moveSpeed * dt));
        
        this.target.add(movement);
    }
};

MainCameraController.prototype.updateCameraPosition = function() {
    const lerpFactor = 0.1;
    this.pitch = pc.math.lerp(this.pitch, this.targetPitch, lerpFactor);
    this.yaw = pc.math.lerp(this.yaw, this.targetYaw, lerpFactor);
    this.currentDistance = pc.math.lerp(this.currentDistance, this.targetDistance, lerpFactor);
    
    // Update distance property for Euler UI controller
    this.distance = this.currentDistance;
    
    const pitchRad = this.pitch * pc.math.DEG_TO_RAD;
    const yawRad = this.yaw * pc.math.DEG_TO_RAD;
    
    const x = this.currentDistance * Math.cos(pitchRad) * Math.sin(yawRad);
    const y = this.currentDistance * Math.sin(pitchRad);
    const z = this.currentDistance * Math.cos(pitchRad) * Math.cos(yawRad);
    
    this.entity.setPosition(
        this.target.x + x,
        this.target.y + y,
        this.target.z + z
    );
    
    this.entity.lookAt(this.target);
};

MainCameraController.prototype.getCameraInfo = function() {
    const position = this.entity.getPosition();
    const distance = position.distance(this.target);
    
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

MainCameraController.prototype.update = function(dt) {
    const appManager = this.app.root.findByName('AppManager');
    let mode = 'euler';
    if (appManager && appManager.script && appManager.script.AppManager) {
        mode = appManager.script.AppManager.currentMode;
    }
    
    this.updateCameraForMode();
    
    if (mode === 'euler' || mode === 'marchingCubes') {
        if (!this.isRotating && !this.isTouching && this.autoRotate) {
            this.targetYaw += this.autoRotateSpeed * this.rotateSpeed;
        }
        this.updateKeyboardMovement(dt);
        this.updateCameraPosition();
    }
    
    // Send camera info to audio manager for spatial audio
    const audioEntity = this.app.root.findByName('AudioEntity');
    if (audioEntity && audioEntity.script.eulerAudioManager) {
        const cameraInfo = this.getCameraInfo();
        // audioEntity.script.eulerAudioManager.updateCameraInfo(cameraInfo);
    }
};

MainCameraController.prototype.destroy = function() {
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