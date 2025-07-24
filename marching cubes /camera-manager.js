// Camera Manager Script for Viverse - PlayCanvas format
var CameraManager = pc.createScript('CameraManager');

// Initialize code called once per entity
CameraManager.prototype.initialize = function() {
    console.log("Camera Manager initialized");
    
    // Check if we should run (only when marching cubes mode is active)
    const appManager = this.app.root.findByName('AppManager');
    if (appManager && appManager.script && appManager.script.AppManager) {
        const currentMode = appManager.script.AppManager.currentMode;
        if (currentMode !== 'marchingCubes') {
            console.log("Camera Manager disabled - not in marching cubes mode");
            return;
        }
    }
    
    // Check if we're running in Viverse (with @viverse SDK available)
    if (typeof CameraService !== 'undefined') {
        try {
            this.cameraService = new CameraService();
            // Primera persona = índice 0
            this.cameraService.switchPov(0);
            // Opcional: bloquear cambios de POV
            this.cameraService.canSwitchPov = false;
            // Opcional: bloquear giro/zoom si no los quieres
            // this.cameraService.canRotate = false;
            // this.cameraService.canZoom = false;
            
            console.log("Viverse camera service initialized");
        } catch (error) {
            console.warn("Could not initialize Viverse camera service:", error);
        }
    } else {
        console.log("Camera Manager: Viverse SDK not available - running in PlayCanvas mode");
    }
}; 