// Home Screen Script for PlayCanvas - Welcome screen with mode selection
var HomeScreen = pc.createScript('HomeScreen');

// Add script attributes for editor configuration
HomeScreen.attributes.add('showAnimations', { type: 'boolean', default: true, title: 'Show Animations' });
HomeScreen.attributes.add('showInstructions', { type: 'boolean', default: true, title: 'Show Instructions' });

// Initialize code called once per entity
HomeScreen.prototype.initialize = function() {
    console.log("🏠 Home Screen initialized");
    
    // Load Roboto font from Google Fonts
    this.loadRobotoFont();
    
    // Get reference to app manager
    this.appManager = this.app.root.findByName('AppManager');
    if (this.appManager && this.appManager.script && this.appManager.script.AppManager) {
        this.appManager = this.appManager.script.AppManager;
    } else {
        console.error("Could not find AppManager");
        return;
    }
    
    // State
    this.isActive = false;
    this.homeContainer = null;
    this.animationFrame = null;
    
    // 3D icon state
    this.iconObjects = [];
    
    // Rotation state (similar to euler system)
    this.rotationEnabled = true;
    this.autoRotateSpeed = 1.0; // degrees per frame
    this.rotationInterval = null;
    
    // Don't auto-activate, wait for AppManager to call activate()
    console.log("✅ Home Screen setup complete");
};

// Load Roboto font from Google Fonts
HomeScreen.prototype.loadRobotoFont = function() {
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

// Activate home screen
HomeScreen.prototype.activate = function() {
    if (this.isActive) return;
    
    console.log("🏠 Activating Home Screen");
    
    // Create the home UI
    this.createHomeUI();
    
    // Start animations for 3D icons (always enabled)
    this.startAnimations();
    
    // Icons are now static - no rotation
    console.log("🎯 Icons are static (no rotation)");
    
    this.isActive = true;
};

// Deactivate home screen
HomeScreen.prototype.deactivate = function() {
    if (!this.isActive) return;
    
    console.log("🏠 Deactivating Home Screen");
    
    // Stop animations
    this.stopAnimations();
    
    // Icons are static - no rotation to stop
    
    // Remove UI
    this.removeHomeUI();
    
    this.isActive = false;
};

// Create the home screen UI
HomeScreen.prototype.createHomeUI = function() {
    // Main container (full screen background)
    this.homeContainer = document.createElement('div');
    this.homeContainer.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: #000000;
        font-family: 'Roboto', sans-serif;
        color: white;
        z-index: 9999;
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 3rem 2rem 2rem 2rem;
        box-sizing: border-box;
    `;
    
    // Content container (limited width, centered)
    const contentContainer = document.createElement('div');
    contentContainer.style.cssText = `
        max-width: 1300px;
        width: 100%;
        height: 85vh;
        display: grid;
        grid-template-rows: auto 1fr auto;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem 2rem;
        padding: 0rem 2rem;
        box-sizing: border-box;
    `;
    
    // Row 1, Column 1: Title
    const titleSection = this.createTitleSection();
    titleSection.style.cssText += `
        grid-column: 1;
        grid-row: 1;
        display: flex;
        align-items: flex-start;
    `;
    contentContainer.appendChild(titleSection);
    
    // Row 1, Column 2: Description  
    const descriptionSection = this.createDescriptionSection();
    descriptionSection.style.cssText += `
        grid-column: 2;
        grid-row: 1;
        display: flex;
        align-items: flex-start;
        padding-top: 0;
    `;
    contentContainer.appendChild(descriptionSection);
    
    // Row 2, Column 1: Physical Oscillators
    const marchingCard = this.createModeCard({
        title: 'PHYSICAL OSCILLATORS',
        subtitle: 'Audio-Visual Synthesis',
        description: 'Interactive 3D blob generation with real-time audio synthesis. Shape morphing based on waveforms.',
        mode: 'marchingCubes',
        color: '#ffffff',
        icon: '●'
    });
    marchingCard.style.cssText += `
        grid-column: 1;
        grid-row: 2;
        align-self: center;
        justify-self: center;
    `;
    contentContainer.appendChild(marchingCard);
    
    // Row 2, Column 2: Euler Topology
    const eulerCard = this.createModeCard({
        title: 'EULER TOPOLOGY',
        subtitle: 'Network Sonification',
        description: 'Dynamic particle network visualization with topological audio mapping and spatial sound design.',
        mode: 'euler',
        color: '#ffffff',
        icon: '■'
    });
    eulerCard.style.cssText += `
        grid-column: 2;
        grid-row: 2;
        align-self: center;
        justify-self: center;
    `;
    contentContainer.appendChild(eulerCard);
    
    // Row 3: Footer (centered, spans both columns)
    const footer = this.createFooter();
    footer.style.cssText += `
        grid-column: 1 / -1;
        grid-row: 3;
        align-self: end;
        justify-self: center;
        text-align: center;
        max-width: none;
    `;
    contentContainer.appendChild(footer);
    
    this.homeContainer.appendChild(contentContainer);
    document.body.appendChild(this.homeContainer);
    
    // Verify 3D icons after a short delay
    setTimeout(() => {
        this.verify3DIcons();
        // Icons are static - no rotation needed
    }, 1000);
};

// Create title section (now just the title)
HomeScreen.prototype.createTitleSection = function() {
    const titleContainer = document.createElement('div');
    
    const mainTitle = document.createElement('h1');
    mainTitle.innerHTML = 'INTERSPECIFICS<br/>SONIC MACHINES/';
    mainTitle.style.cssText = `
        font-family: 'Roboto', sans-serif;
        font-size: 3.9rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        margin: 0;
        text-shadow: none;
        line-height: 1.1;
        color: #ffffff;
        padding-top: 34px;
    `;
    
    titleContainer.appendChild(mainTitle);
    return titleContainer;
};

// Create description section (separate from title)
HomeScreen.prototype.createDescriptionSection = function() {
    const descriptionContainer = document.createElement('div');
    
    const description = document.createElement('div');
    description.innerHTML = 'SonicMachines is a collection of generative audiovisual systems developed by Interspecifics. These "machines" explore the poetic potential of mathematics, physics, and topology through real-time simulations, where dynamical systems become sources for sonic and visual material. They are not instruments in the traditional sense but procedural worlds autonomous entities unfolding complexity over time through feedback, recursion, and geometric transformations.<br><br>This project investigates how abstract mathematical systems, such networks, or scalar fields can be rendered into experience through sound and visualization. Each Sonic Machine becomes a microcosm of motion, pattern, and rhythm.';
    description.style.cssText = `
        font-family: 'Roboto', sans-serif;
        font-size: 0.9rem;
        font-weight: 300;
        opacity: 0.8;
        letter-spacing: 0.02em;
        line-height: 1.5;
        text-align: justify;
    `;
    
    descriptionContainer.appendChild(description);
    return descriptionContainer;
};

// Create mode selection section
HomeScreen.prototype.createModeSelectionSection = function() {
    const modeSection = document.createElement('div');
    modeSection.style.cssText = `
        display: flex;
        gap: 3rem;
        flex-wrap: wrap;
        justify-content: center;
        align-items: flex-start;
    `;
    
    // Physical Oscillators mode card
    const marchingCard = this.createModeCard({
        title: 'PHYSICAL OSCILLATORS',
        subtitle: 'Audio-Visual Synthesis',
        description: 'Interactive 3D blob generation with\nreal-time audio synthesis. Shape\nmorphing based on waveforms.',
        mode: 'marchingCubes',
        color: '#ffffff',
        icon: '●'
    });
    
    // Euler mode card
    const eulerCard = this.createModeCard({
        title: 'EULER TOPOLOGY',
        subtitle: 'Network Sonification',
        description: 'Dynamic particle network\nvisualization with topological audio\nmapping and spatial sound design.',
        mode: 'euler',
        color: '#ffffff',
        icon: '■'
    });
    
    modeSection.appendChild(marchingCard);
    modeSection.appendChild(eulerCard);
    
    return modeSection;
};

// Create individual mode card
HomeScreen.prototype.createModeCard = function(config) {
    const card = document.createElement('div');
    card.style.cssText = `
        background: transparent;
        border: 1px solid #ffffff;
        border-radius: 0px;
        padding: 6rem 2.5rem;
        width: 100%;
        min-height: auto;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        box-sizing: border-box;
    `;
    
    // Icon container for 3D object
    const iconContainer = document.createElement('div');
    iconContainer.style.cssText = `
        width: 120px;
        height: 120px;
        margin-bottom: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    // Create 3D icon based on config
    const iconType = config.icon === '●' ? 'sphere' : 'cube';
    this.create3DIcon(iconType, iconContainer);
    
    // Title
    const title = document.createElement('h2');
    title.textContent = config.title;
    title.style.cssText = `
        font-family: 'Roboto', sans-serif;
        font-size: 1.8rem;
        color: #ffffff;
        text-align: center;
        margin: 0 0 0.5rem 0;
        font-weight: 700;
        letter-spacing: 0.02em;
    `;
    
    // Subtitle
    const subtitle = document.createElement('div');
    subtitle.textContent = config.subtitle;
    subtitle.style.cssText = `
        font-family: 'Roboto', sans-serif;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.7);
        text-align: center;
        margin-bottom: 1.5rem;
        font-style: italic;
        font-weight: 300;
    `;
    
    // Description (without forced line breaks)
    const description = document.createElement('div');
    description.textContent = config.description;
    description.style.cssText = `
        font-family: 'Roboto', sans-serif;
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.6);
        line-height: 1.5;
        text-align: center;
        font-weight: 300;
        max-width: 80%;
        margin: 0 auto;
    `;
    
    // Hover effects
    card.addEventListener('mouseover', () => {
        card.style.transform = 'translateY(-4px)';
        card.style.background = '#ffffff';
        card.style.color = '#000000';
        // Change text colors on hover
        title.style.color = '#000000';
        subtitle.style.color = 'rgba(0, 0, 0, 0.7)';
        description.style.color = 'rgba(0, 0, 0, 0.6)';
    });
    
    card.addEventListener('mouseout', () => {
        card.style.transform = 'translateY(0)';
        card.style.background = 'transparent';
        card.style.color = '#ffffff';
        // Restore text colors
        title.style.color = '#ffffff';
        subtitle.style.color = 'rgba(255, 255, 255, 0.7)';
        description.style.color = 'rgba(255, 255, 255, 0.6)';
    });
    
    // Click handler
    card.addEventListener('click', () => {
        console.log(`🎯 Card clicked: ${config.mode}`);
        console.log("🔍 AppManager reference:", this.appManager);
        
        // Add click animation
        card.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            if (this.appManager) {
                console.log(`🚀 Calling switchMode('${config.mode}')`);
                this.appManager.switchMode(config.mode);
            } else {
                console.error("❌ AppManager reference is null!");
            }
        }, 150);
    });
    
    card.appendChild(iconContainer);
    card.appendChild(title);
    card.appendChild(subtitle);
    card.appendChild(description);
    
    return card;
};

// Create instructions section
HomeScreen.prototype.createInstructionsSection = function() {
    const instructionsSection = document.createElement('div');
    instructionsSection.style.cssText = `
        background: transparent;
        border: 1px solid #ffffff;
        border-radius: 0px;
        padding: 2rem;
        max-width: 700px;
        margin-bottom: 2rem;
    `;
    
    const instructionsTitle = document.createElement('div');
    instructionsTitle.textContent = 'Quick Start';
    instructionsTitle.style.cssText = `
        font-family: 'Roboto', sans-serif;
        font-weight: 500;
        font-size: 1.1rem;
        margin-bottom: 1.5rem;
        color: #ffffff;
        text-align: center;
    `;
    
    const instructionsList = document.createElement('div');
    instructionsList.innerHTML = `
        <div style="text-align: left; font-family: 'Roboto', sans-serif; font-size: 0.9rem; line-height: 1.8; color: rgba(255,255,255,0.8); font-weight: 300;">
            • <strong>Click</strong> on a mode card to enter that experience<br/>
            • Use the <strong>mode switcher</strong> (top-right) to navigate between modes<br/>
            • <strong>Keyboard shortcuts:</strong> 1=Home, 2=Physical Oscillators, 3=Euler
        </div>
    `;
    
    instructionsSection.appendChild(instructionsTitle);
    instructionsSection.appendChild(instructionsList);
    
    return instructionsSection;
};

// Create footer
HomeScreen.prototype.createFooter = function() {
    const footer = document.createElement('div');
    footer.style.cssText = `
        font-family: 'Roboto', sans-serif;
        font-size: 0.8rem;
        font-weight: 300;
        color: rgba(255, 255, 255, 0.5);
        text-align: center;
        max-width: 600px;
    `;
    
    footer.innerHTML = `
        Concept design and code by interspecifics.<br/>
        Code implementation for Viverse - Play Canvas by MDAP<br/>
        For more information visit our <a href="https://github.com/interspecifics" target="_blank" style="color: rgba(255, 255, 255, 0.8); text-decoration: underline;">Github page</a>.
    `;
    
    return footer;
};

// Create 3D icon using CSS 3D transforms (more reliable)
HomeScreen.prototype.create3DIcon = function(iconType, container) {
    console.log(`🎯 Creating CSS 3D ${iconType} icon...`);
    
    // Create 3D container with perspective
    const icon3D = document.createElement('div');
    icon3D.style.cssText = `
        width: 120px;
        height: 120px;
        perspective: 300px;
        perspective-origin: center center;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    if (iconType === 'sphere') {
        // Create simple circular icon for Physical Oscillator (matching cube style)
        const circle = document.createElement('div');
        circle.className = 'icon-circle-3d';
        circle.style.cssText = `
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background: linear-gradient(45deg, #ffffff, #e0e0e0);
            border: 1px solid rgba(255,255,255,0.3);
            box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
            position: relative;
        `;
        
        icon3D.appendChild(circle);
        
    } else if (iconType === 'cube') {
        // Create cube using CSS 3D faces
        const cube = document.createElement('div');
        cube.className = 'icon-cube-3d';
        cube.style.cssText = `
            width: 70px;
            height: 70px;
            position: relative;
            transform-style: preserve-3d;
        `;
        
        // Create 6 faces of the cube
        const faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
        faces.forEach((face, index) => {
            const faceDiv = document.createElement('div');
            faceDiv.className = `cube-face cube-${face}`;
            
            let transform = '';
            switch(face) {
                case 'front':  transform = 'translateZ(35px)'; break;
                case 'back':   transform = 'translateZ(-35px) rotateY(180deg)'; break;
                case 'right':  transform = 'rotateY(90deg) translateZ(35px)'; break;
                case 'left':   transform = 'rotateY(-90deg) translateZ(35px)'; break;
                case 'top':    transform = 'rotateX(90deg) translateZ(35px)'; break;
                case 'bottom': transform = 'rotateX(-90deg) translateZ(35px)'; break;
            }
            
            faceDiv.style.cssText = `
                position: absolute;
                width: 70px;
                height: 70px;
                background: linear-gradient(45deg, #ffffff, #e0e0e0);
                border: 1px solid rgba(255,255,255,0.3);
                transform: ${transform};
                box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
            `;
            
            cube.appendChild(faceDiv);
        });
        
        icon3D.appendChild(cube);
    }
    
    // Store reference for animation
    this.iconObjects.push({
        element: icon3D.firstChild, // This will be the sphereContainer or cube
        type: iconType,
        container: icon3D
    });
    
    container.appendChild(icon3D);
    
    console.log(`✅ Created CSS 3D ${iconType} icon - Total icons: ${this.iconObjects.length}`);
};

// Animate 3D icons using CSS transforms (inspired by euler rotation system)
HomeScreen.prototype.animate3DIcons = function() {
    if (!this.rotationEnabled || !this.iconObjects.length) return;
    
    const time = Date.now() * 0.001;
    
    this.iconObjects.forEach((iconObj, index) => {
        if (iconObj.element && iconObj.type) {
            // Initialize rotation angles if not set
            if (!iconObj.rotX) iconObj.rotX = 0;
            if (!iconObj.rotY) iconObj.rotY = 0;
            if (!iconObj.rotZ) iconObj.rotZ = 0;
            
            if (iconObj.type === 'sphere') {
                // Sphere: No rotation - static
                iconObj.rotX = 0;
                iconObj.rotY = 0;
                iconObj.rotZ = 0;
                
            } else if (iconObj.type === 'cube') {
                // Cube: No rotation - static
                iconObj.rotX = 0;
                iconObj.rotY = 0;
                iconObj.rotZ = 0;
            }
            
            // Apply rotation
            iconObj.element.style.transform = `
                rotateX(${iconObj.rotX}deg) 
                rotateY(${iconObj.rotY}deg) 
                rotateZ(${iconObj.rotZ}deg)
            `;
        }
    });
};

// Start icon rotation system (backup method using setInterval like euler)
HomeScreen.prototype.startIconRotation = function() {
    if (this.rotationInterval) return; // Already running
    
    console.log("🔄 Starting icon auto-rotation system...");
    
    // Use setInterval for reliable rotation (60 FPS)
    this.rotationInterval = setInterval(() => {
        if (this.isActive && this.rotationEnabled) {
            this.animate3DIcons();
        }
    }, 16); // ~60 FPS
    
    console.log("✅ Icon rotation system started");
};

// Stop icon rotation system
HomeScreen.prototype.stopIconRotation = function() {
    if (this.rotationInterval) {
        clearInterval(this.rotationInterval);
        this.rotationInterval = null;
        console.log("🛑 Icon rotation system stopped");
    }
};

// Start animations
HomeScreen.prototype.startAnimations = function() {
    if (this.animationFrame) return;
    
    const animate = () => {
        if (!this.isActive) return;
        
        // Animate 3D icons (priority - always first)
        this.animate3DIcons();
        
        // Animate grid background
        this.animateGrid();
        
        // Animate particles
        this.animateParticles();
        
        this.animationFrame = requestAnimationFrame(animate);
    };
    
    console.log("🎬 Starting HomeScreen animations with 3D icons...");
    
    animate();
};

// Stop animations
HomeScreen.prototype.stopAnimations = function() {
    if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
    }
};

// Animate grid background
HomeScreen.prototype.animateGrid = function() {
    if (!this.gridCtx) return;
    
    const ctx = this.gridCtx;
    const canvas = this.gridCanvas;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const time = Date.now() * 0.001;
    const gridSize = 50;
    
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 0; x < canvas.width; x += gridSize) {
        const offset = Math.sin(time + x * 0.01) * 10;
        ctx.beginPath();
        ctx.moveTo(x + offset, 0);
        ctx.lineTo(x + offset, canvas.height);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y < canvas.height; y += gridSize) {
        const offset = Math.cos(time + y * 0.01) * 10;
        ctx.beginPath();
        ctx.moveTo(0, y + offset);
        ctx.lineTo(canvas.width, y + offset);
        ctx.stroke();
    }
};

// Animate floating particles
HomeScreen.prototype.animateParticles = function() {
    if (!this.particles) return;
    
    this.particles.forEach(particle => {
        // Update position
        particle._x += particle._vx;
        particle._y += particle._vy;
        
        // Wrap around screen
        if (particle._x < -5) particle._x = 105;
        if (particle._x > 105) particle._x = -5;
        if (particle._y < -5) particle._y = 105;
        if (particle._y > 105) particle._y = -5;
        
        // Apply position
        particle.style.left = particle._x + '%';
        particle.style.top = particle._y + '%';
        
        // Pulsing effect
        const pulse = Math.sin(Date.now() * 0.003 + particle._x * 0.1) * 0.5 + 0.5;
        particle.style.opacity = 0.2 + pulse * 0.3;
    });
};

// Remove home UI
HomeScreen.prototype.removeHomeUI = function() {
    // Clean up 3D icon applications first
    this.cleanup3DIcons();
    
    if (this.homeContainer && this.homeContainer.parentNode) {
        document.body.removeChild(this.homeContainer);
        this.homeContainer = null;
    }
    
    // Clear references
    this.gridCanvas = null;
    this.gridCtx = null;
    this.particles = null;
};

// Clean up 3D icon resources
HomeScreen.prototype.cleanup3DIcons = function() {
    console.log("🧹 Cleaning up 3D icons...");
    
    // Clear icon objects array
    this.iconObjects = [];
    
    console.log("✅ 3D icons cleanup complete");
};

// Verify 3D icons are working
HomeScreen.prototype.verify3DIcons = function() {
    console.log("🔍 Verifying CSS 3D icons...");
    console.log(`📊 Total icon objects: ${this.iconObjects.length}`);
    console.log(`🔄 Rotation enabled: ${this.rotationEnabled}`);
    console.log(`⚡ Rotation speed: ${this.autoRotateSpeed}`);
    console.log(`🎯 Rotation interval active: ${!!this.rotationInterval}`);
    
    this.iconObjects.forEach((iconObj, index) => {
        if (iconObj.element && iconObj.type) {
            console.log(`✅ Icon ${index} (${iconObj.type}): `, {
                elementExists: !!iconObj.element,
                hasTransform: !!iconObj.element.style.transform,
                className: iconObj.element.className,
                rotationAngles: {
                    rotX: iconObj.rotX || 0,
                    rotY: iconObj.rotY || 0,
                    rotZ: iconObj.rotZ || 0
                }
            });
            
            // Icons are static - no test rotation needed
            if (iconObj.element) {
                console.log(`✅ ${iconObj.type} icon is static`);
            }
        } else {
            console.error(`❌ Icon ${index} has missing components!`);
        }
    });
    
    if (this.iconObjects.length === 2) {
        console.log("🎯 Both CSS 3D icons (sphere + cube) created successfully!");
        console.log("🎯 Icons are static (no rotation)");
    } else {
        console.warn(`⚠️ Expected 2 icons, but found ${this.iconObjects.length}`);
    }
};

// Handle window resize
HomeScreen.prototype.handleResize = function() {
    if (this.gridCanvas) {
        this.gridCanvas.width = window.innerWidth;
        this.gridCanvas.height = window.innerHeight;
    }
};

// Cleanup
HomeScreen.prototype.destroy = function() {
    console.log("🧹 Cleaning up Home Screen");
    
    this.stopAnimations();
    this.removeHomeUI();
    
    // Remove resize listener
    window.removeEventListener('resize', this.handleResize.bind(this));
    
    // Reset rotation state
    this.rotationEnabled = false;
    this.iconObjects = [];
    
    console.log("✅ Home Screen cleanup complete");
};

// Handle window resize (setup listener on initialize)
window.addEventListener('resize', HomeScreen.prototype.handleResize.bind(this)); 