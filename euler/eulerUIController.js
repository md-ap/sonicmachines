var EulerUIController = pc.createScript('eulerUIController');

// Initialize code called once per entity
EulerUIController.prototype.initialize = function() {
    console.log("Euler UI Controller initialized");
    
    // Load Roboto font from Google Fonts
    this.loadRobotoFont();
    
    // Check if we should run (only when euler mode is active)
    const appManager = this.app.root.findByName('AppManager');
    if (appManager && appManager.script && appManager.script.AppManager) {
        const currentMode = appManager.script.AppManager.currentMode;
        if (currentMode !== 'euler') {
            console.log("Euler UI Controller disabled - not in euler mode");
            return;
        }
    }
    
    // Find other components
    this.simulationEntity = this.app.root.findByName('EulerContainer');
    this.audioEntity = this.app.root.findByName('AudioEntity');
    this.cameraEntity = this.app.root.findByName('Camera');
    
    if (!this.simulationEntity) {
        console.error("Could not find EulerContainer entity");
        return;
    }
    
    // Get simulation script
    this.simulation = this.simulationEntity.script.eulerTopologySimulation;
    if (!this.simulation) {
        console.error("Could not find eulerTopologySimulation script");
        return;
    }
    
    // Get audio manager
    this.audioManager = this.audioEntity ? this.audioEntity.script.eulerAudioManager : null;
    
    // Get camera controller
    this.cameraController = this.cameraEntity ? this.cameraEntity.script.eulerCameraController : null;
    
    // Initialize waveform animation control
    this.isWaveformAnimating = false;
    this.animationFrameId = null;
    
    // Create UI like original with lil-gui style
    console.log("🎨 Creating original style UI...");
    this.createOriginalStyleUI();
    
    console.log("🔊 Creating audio controls...");
    this.createAudioControls();
    
    console.log("🌊 Creating waveform visualization...");
    this.createWaveformVisualization();
    
    console.log("📊 Creating blend visualization...");
    this.createBlendVisualization();
    
    console.log("🎮 Setting up camera controls...");
    this.setupCameraControls();
    
    console.log("✅ UI Controller setup complete");
};

// Load Roboto font from Google Fonts
EulerUIController.prototype.loadRobotoFont = function() {
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

// Create branding panel
EulerUIController.prototype.createBrandingPanel = function() {
    this.brandingPanel = document.createElement('div');
    this.brandingPanel.style.position = 'fixed';
    this.brandingPanel.style.top = '20px';
    this.brandingPanel.style.left = '20px';
    this.brandingPanel.style.background = 'rgba(0, 0, 0, 0.8)';
    this.brandingPanel.style.color = '#4CAF50';
    this.brandingPanel.style.fontFamily = "'Roboto', sans-serif";
    this.brandingPanel.style.fontSize = '16px';
    this.brandingPanel.style.fontWeight = '500';
    this.brandingPanel.style.padding = '12px 20px';
    this.brandingPanel.style.borderRadius = '8px';
    this.brandingPanel.style.border = '2px solid #4CAF50';
    this.brandingPanel.style.zIndex = '1000';
    this.brandingPanel.style.textAlign = 'center';
    this.brandingPanel.style.boxShadow = '0 0 20px rgba(76, 175, 80, 0.3)';
    
    this.brandingPanel.innerHTML = `
        <div style="margin-bottom: 4px;">INTERSPECIFICS</div>
        <div style="font-size: 12px; color: #fff; font-weight: 300;">EULER TOPOLOGY SYNTH</div>
    `;
    
    document.body.appendChild(this.brandingPanel);
};

// Create original style UI with lil-gui appearance
EulerUIController.prototype.createOriginalStyleUI = function() {
    // Create main GUI container
    this.guiContainer = document.createElement('div');
    this.guiContainer.className = 'lil-gui';
    this.guiContainer.style.position = 'fixed';
    this.guiContainer.style.top = '15px';
    this.guiContainer.style.right = '15px';
    this.guiContainer.style.width = '245px';
    this.guiContainer.style.background = '#000000';
    this.guiContainer.style.color = '#fff';
    this.guiContainer.style.fontFamily = "'Roboto', sans-serif";
    this.guiContainer.style.fontSize = '11px';
    this.guiContainer.style.borderRadius = '2px';
    this.guiContainer.style.border = '0.5px solid #ffffff';
    this.guiContainer.style.zIndex = '1000';
    this.guiContainer.style.userSelect = 'none';
    
    // Create title
    const title = document.createElement('div');
    title.style.background = '#000000';
    title.style.padding = '4px 8px';
    title.style.borderBottom = '0.5px solid #ffffff';
    title.style.fontWeight = '500';
    title.style.fontSize = '12px';
    title.textContent = 'Controls';
    this.guiContainer.appendChild(title);
    
    // Create controls container
    const controlsContainer = document.createElement('div');
    controlsContainer.style.padding = '0';
    this.guiContainer.appendChild(controlsContainer);
    
    // Add controls
    this.addControl(controlsContainer, 'showDots', 'Show Dots', 'checkbox', true);
    this.addControl(controlsContainer, 'showLines', 'Show Lines', 'checkbox', true);
    this.addControl(controlsContainer, 'minDistance', 'Min Distance', 'range', 125, { min: 10, max: 300, step: 5 });
    this.addControl(controlsContainer, 'limitConnections', 'Limit Connections', 'checkbox', true);
    this.addControl(controlsContainer, 'maxConnections', 'Max Connections', 'range', 10, { min: 0, max: 30, step: 1 });
    this.addControl(controlsContainer, 'particleCount', 'Particle Count', 'range', 500, { min: 0, max: 1000, step: 1 });
    this.addControl(controlsContainer, 'cameraDistance', 'Camera Distance', 'range', 1750, { min: 1000, max: 6000, step: 50 });
    this.addControl(controlsContainer, 'rotationSpeed', 'Rotation Speed', 'range', 0.3, { min: 0.1, max: 1.0, step: 0.1 });
    this.addControl(controlsContainer, 'rootMidi', 'Root MIDI (C1-B5)', 'range', 60, { min: 24, max: 83, step: 1 });
    
    // Musical Controls folder
    const musicFolder = this.addFolder(controlsContainer, 'Musical Controls');
    
    this.addControl(musicFolder, 'scale', 'Scale', 'select', 'Major', {
        options: ['Major', 'Minor', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Locrian']
    });
    
    this.addControl(musicFolder, 'microtuning', 'Microtuning', 'select', '12-TET', {
        options: ['12-TET', '19-TET', '24-TET', 'Just Intonation']
    });
    
    this.addControl(musicFolder, 'octave', 'Octave', 'range', 4, { min: 1, max: 7, step: 1 });
    
    this.addControl(musicFolder, 'networkRoot', 'Network modulates root', 'checkbox', false);
    
    this.addControl(musicFolder, 'volume', 'Volume (-3 dB max)', 'range', 0.5, { min: 0, max: 0.707, step: 0.01 });
    
    document.body.appendChild(this.guiContainer);
    
    // Store current values
    this.params = {
        showDots: true,
        showLines: true,
        minDistance: 125,
        limitConnections: true,
        maxConnections: 10,
        particleCount: 500,
        cameraDistance: 1750,
        rotationSpeed: 0.3,
        rootMidi: 60,
        scale: 'Major',
        microtuning: '12-TET',
        octave: 4,
        networkRoot: false,
        volume: 0.5
    };
};

// Add control helper
EulerUIController.prototype.addControl = function(container, property, label, type, defaultValue, options = {}) {
    const controlRow = document.createElement('div');
    controlRow.style.display = 'flex';
    controlRow.style.alignItems = 'center';
    controlRow.style.padding = '2px 8px';
    controlRow.style.borderBottom = '0.5px solid #ffffff';
    controlRow.style.minHeight = '20px';
    
    const labelEl = document.createElement('div');
    labelEl.style.flex = '1';
    labelEl.style.fontSize = '11px';
    labelEl.style.color = '#fff';
    labelEl.textContent = label;
    controlRow.appendChild(labelEl);
    
    const controlContainer = document.createElement('div');
    controlContainer.style.flex = '1';
    controlContainer.style.textAlign = 'right';
    
    let control;
    
    if (type === 'checkbox') {
        control = document.createElement('input');
        control.type = 'checkbox';
        control.checked = defaultValue;
        control.style.margin = '0';
        control.style.accentColor = '#888888';
        control.style.width = '14px';
        control.style.height = '14px';
        control.onchange = () => this.updateParameter(property, control.checked);
        controlContainer.appendChild(control);
    } else if (type === 'range') {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '4px';
        
        control = document.createElement('input');
        control.type = 'range';
        control.min = options.min || 0;
        control.max = options.max || 100;
        control.step = options.step || 1;
        control.value = defaultValue;
        control.style.width = '80px';
        control.style.height = '14px';
        control.style.background = '#000000';
        control.style.border = '0.5px solid #ffffff';
        control.style.outline = 'none';
        control.style.appearance = 'none';
        control.style.borderRadius = '7px';
        control.style.cursor = 'pointer';
        
        const valueDisplay = document.createElement('span');
        valueDisplay.style.fontSize = '10px';
        valueDisplay.style.color = '#ccc';
        valueDisplay.style.minWidth = '30px';
        valueDisplay.textContent = defaultValue;
        
        control.oninput = () => {
            const value = parseFloat(control.value);
            valueDisplay.textContent = value;
            this.updateParameter(property, value);
        };
        
        wrapper.appendChild(control);
        wrapper.appendChild(valueDisplay);
        controlContainer.appendChild(wrapper);
    } else if (type === 'select') {
        control = document.createElement('select');
        control.style.background = '#000000';
        control.style.color = '#fff';
        control.style.border = '0.5px solid #ffffff';
        control.style.borderRadius = '2px';
        control.style.fontSize = '10px';
        control.style.padding = '2px';
        control.style.width = '80px';
        
        options.options.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option;
            optionEl.textContent = option;
            if (option === defaultValue) optionEl.selected = true;
            control.appendChild(optionEl);
        });
        
        control.onchange = () => this.updateParameter(property, control.value);
        controlContainer.appendChild(control);
    }
    
    controlRow.appendChild(controlContainer);
    container.appendChild(controlRow);
    
    return control;
};

// Add folder helper
EulerUIController.prototype.addFolder = function(container, title) {
    const folder = document.createElement('div');
    
    const header = document.createElement('div');
    header.style.background = '#2c2c2c';
    header.style.padding = '4px 8px';
    header.style.borderBottom = '1px solid #3c3c3c';
    header.style.fontSize = '11px';
    header.style.fontWeight = 'bold';
    header.style.cursor = 'pointer';
    header.textContent = '▼ ' + title;
    
    const content = document.createElement('div');
    content.style.display = 'block';
    
    let isOpen = true;
    header.onclick = () => {
        isOpen = !isOpen;
        content.style.display = isOpen ? 'block' : 'none';
        header.textContent = (isOpen ? '▼ ' : '▶ ') + title;
    };
    
    folder.appendChild(header);
    folder.appendChild(content);
    container.appendChild(folder);
    
    return content;
};

// Update parameter
EulerUIController.prototype.updateParameter = function(property, value) {
    this.params[property] = value;
    
    if (this.simulation) {
        switch (property) {
            case 'showDots':
                this.simulation.showDots = value;
                if (this.simulation.particleMeshInstance) {
                    this.simulation.particleMeshInstance.visible = value;
                }
                break;
            case 'showLines':
                this.simulation.showLines = value;
                if (this.simulation.lineMeshInstance) {
                    this.simulation.lineMeshInstance.visible = value;
                }
                break;
            case 'minDistance':
                this.simulation.connectionDistance = value / 50; // Convert to simulation scale
                break;
            case 'limitConnections':
                // This would be handled in the simulation logic
                break;
            case 'maxConnections':
                this.simulation.maxConnectionsPerParticle = value;
                break;
            case 'particleCount':
                this.simulation.activeParticleCount = value;
                if (this.simulation.particleMesh) {
                    this.simulation.particleMesh.primitive[0].count = value;
                }
                break;
            case 'cameraDistance':
                if (this.cameraController) {
                    this.cameraController.targetDistance = value / 50; // Convert to simulation scale
                    this.cameraController.distance = value / 50;
                }
                break;
            case 'rotationSpeed':
                if (this.cameraController) {
                    this.cameraController.rotateSpeed = value;
                }
                break;
            case 'rootMidi':
                if (this.audioManager && this.audioManager.setRootNote) {
                    this.audioManager.setRootNote(value);
                    // Also update root frequency for immediate effect
                    this.audioManager.rootNote = value;
                    this.audioManager.rootFreq = Tone.Frequency(value, "midi").toFrequency();
                }
                break;
            case 'scale':
                if (this.audioManager && this.audioManager.setScale) {
                    this.audioManager.setScale(value);
                    this.audioManager.currentScale = value;
                }
                break;
            case 'microtuning':
                if (this.audioManager && this.audioManager.setMicrotuning) {
                    this.audioManager.setMicrotuning(value);
                    this.audioManager.microtuning = value;
                }
                break;
            case 'octave':
                // Update octave and recalculate root note
                if (this.audioManager) {
                    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                    const currentNote = noteNames[this.audioManager.rootNote % 12];
                    this.audioManager.setRootNoteAndOctave(currentNote, value);
                }
                break;
            case 'networkRoot':
                if (this.audioManager && this.audioManager.setNetworkRoot) {
                    this.audioManager.setNetworkRoot(value);
                    this.audioManager.networkModulatesRoot = value;
                }
                break;
            case 'volume':
                if (this.audioManager && this.audioManager.setVolume) {
                    this.audioManager.setVolume(value);
                    this.audioManager.masterVolume = value;
                    if (this.audioManager.masterGain) {
                        this.audioManager.masterGain.gain.value = value;
                    }
                }
                break;
        }
    }
};

// Create audio controls
EulerUIController.prototype.createAudioControls = function() {
    try {
        console.log("🔊 Creating audio controls container...");
        this.audioControls = document.createElement('div');
        this.audioControls.style.position = 'fixed';
        this.audioControls.style.right = '20px';
        this.audioControls.style.bottom = '20px'; // Aligned with mode switcher buttons
        this.audioControls.style.background = 'rgba(0, 0, 0, 0.8)';
        this.audioControls.style.color = '#fff';
        this.audioControls.style.fontFamily = "'Roboto', sans-serif";
        this.audioControls.style.fontSize = '12px';
        this.audioControls.style.padding = '10px';
        this.audioControls.style.borderRadius = '5px';
        this.audioControls.style.zIndex = '1000';
        this.audioControls.style.display = 'flex';
        this.audioControls.style.gap = '10px';
        this.audioControls.style.alignItems = 'center';
        
        // Start button
        this.startButton = document.createElement('button');
        this.startButton.textContent = 'Start Audio';
        this.startButton.style.padding = '5px 10px';
        this.startButton.style.backgroundColor = 'transparent';
        this.startButton.style.border = '0.5px solid #ffffff';
        this.startButton.style.borderRadius = '0px';
        this.startButton.style.fontWeight = 'normal';
        this.startButton.style.cursor = 'pointer';
        this.startButton.style.fontFamily = "'Roboto', sans-serif";
        this.startButton.style.color = 'white';
        this.startButton.onclick = () => this.startAudio();
        
        // Add hover effects
        this.startButton.addEventListener('mouseover', () => {
            // Only change hover style if not in "Audio Running" state
            if (this.startButton.textContent !== 'Audio Running') {
                this.startButton.style.background = '#ffffff';
                this.startButton.style.color = '#000';
            }
        });
        this.startButton.addEventListener('mouseout', () => {
            // Only restore normal style if not in "Audio Running" state
            if (this.startButton.textContent !== 'Audio Running') {
                this.startButton.style.background = 'transparent';
                this.startButton.style.color = '#ffffff';
            }
        });
        
        // Stop button
        this.stopButton = document.createElement('button');
        this.stopButton.textContent = 'Stop Audio';
        this.stopButton.style.padding = '5px 10px';
        this.stopButton.style.backgroundColor = 'transparent';
        this.stopButton.style.border = '0.5px solid #ffffff';
        this.stopButton.style.borderRadius = '0px';
        this.stopButton.style.fontWeight = 'normal';
        this.stopButton.style.cursor = 'pointer';
        this.stopButton.style.fontFamily = "'Roboto', sans-serif";
        this.stopButton.style.color = 'white';
        this.stopButton.onclick = () => this.stopAudio();
        
        // Add hover effects
        this.stopButton.addEventListener('mouseover', () => {
            this.stopButton.style.background = '#ffffff';
            this.stopButton.style.color = '#000';
        });
        this.stopButton.addEventListener('mouseout', () => {
            this.stopButton.style.background = 'transparent';
            this.stopButton.style.color = '#ffffff';
        });
        
        this.audioControls.appendChild(this.startButton);
        this.audioControls.appendChild(this.stopButton);
        
        document.body.appendChild(this.audioControls);
        console.log("✅ Audio controls created successfully");
    } catch (error) {
        console.error("❌ Error creating audio controls:", error);
    }
};

// Start audio
EulerUIController.prototype.startAudio = function() {
    if (this.audioManager && this.audioManager.startAudio) {
        this.audioManager.startAudio().then(() => {
            this.startButton.textContent = 'Audio Running';
            this.startButton.style.background = '#ffffff';
            this.startButton.style.color = '#000000';
            
            // Start waveform animation when audio starts
            this.startWaveformAnimation();
            
            console.log("Audio successfully started from UI");
        }).catch(error => {
            console.error("Failed to start audio from UI:", error);
            this.startButton.textContent = 'Start Failed';
            this.startButton.style.background = 'transparent';
            this.startButton.style.color = '#ffffff';
        });
    } else {
        console.warn("Audio manager not available or startAudio method missing");
    }
};

// Stop audio
EulerUIController.prototype.stopAudio = function() {
    if (this.audioManager && this.audioManager.stopAudio) {
        this.audioManager.stopAudio();
        
        // Stop waveform animation when audio stops
        this.stopWaveformAnimation();
        
        this.startButton.textContent = 'Start Audio';
        this.startButton.style.background = 'transparent';
        this.startButton.style.color = '#ffffff';
    } else {
        console.warn("Audio manager not available or stopAudio method missing");
    }
};

// Create waveform visualization
EulerUIController.prototype.createWaveformVisualization = function() {
    try {
        console.log("🌊 Creating waveform canvas...");
        this.waveformCanvas = document.createElement('canvas');
        this.waveformCanvas.width = 320;
        this.waveformCanvas.height = 80;
        this.waveformCanvas.style.position = 'fixed';
        this.waveformCanvas.style.left = '25px';
        this.waveformCanvas.style.bottom = '360px';
        this.waveformCanvas.style.background = 'rgba(0, 0, 0, 0.5)';
        this.waveformCanvas.style.border = '1px solid #444';
        this.waveformCanvas.style.borderRadius = '4px';
        this.waveformCanvas.style.zIndex = '2000';
        this.waveformCanvas.style.width = '320px';
        this.waveformCanvas.style.height = '80px';
        this.waveformCanvas.style.boxSizing = 'content-box';
        document.body.appendChild(this.waveformCanvas);
        
        // Draw initial flat line (stopped state)
        const ctx = this.waveformCanvas.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(0, this.waveformCanvas.height / 2);
        ctx.lineTo(this.waveformCanvas.width, this.waveformCanvas.height / 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        console.log("✅ Euler waveform visualization created (animation controlled by audio state)");
    } catch (error) {
        console.error("❌ Error creating waveform visualization:", error);
    }
};

// Draw waveform visualization
EulerUIController.prototype.drawWaveform = function() {
    if (!this.waveformCanvas) return;
    
    const ctx = this.waveformCanvas.getContext('2d');
    ctx.clearRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
    
    // Get audio data if available
    let data = null;
    if (this.audioManager && this.audioManager.analyser) {
        try {
            data = this.audioManager.analyser.getValue();
        } catch (error) {
            // Fallback to synthetic waveform
        }
    }
    
    // Draw waveform
    ctx.beginPath();
    ctx.moveTo(0, this.waveformCanvas.height / 2);
    
    if (data && data.length > 0) {
        // Real audio data
        for (let i = 0; i < data.length; i++) {
            const x = (i / data.length) * this.waveformCanvas.width;
            const y = (1 - (data[i] + 1) / 2) * this.waveformCanvas.height;
            ctx.lineTo(x, y);
        }
    } else {
        // Synthetic waveform based on network state
        const time = performance.now() * 0.001;
        for (let i = 0; i < this.waveformCanvas.width; i++) {
            const x = i;
            const frequency = 0.02 + (this.simulation ? this.simulation.networkState.triangleDensity * 0.05 : 0.02);
            const amplitude = 20 + (this.simulation ? this.simulation.networkState.networkComplexity * 30 : 20);
            const y = this.waveformCanvas.height / 2 + Math.sin((x * frequency) + time * 2) * amplitude;
            ctx.lineTo(x, y);
        }
    }
    
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
};

// Start waveform animation
EulerUIController.prototype.startWaveformAnimation = function() {
    if (this.isWaveformAnimating) return; // Already animating
    
    this.isWaveformAnimating = true;
    console.log("🌊 Starting Euler waveform animation");
    
    const animate = () => {
        if (this.isWaveformAnimating) {
            this.drawWaveform();
            this.animationFrameId = requestAnimationFrame(animate);
        }
    };
    animate();
};

// Stop waveform animation
EulerUIController.prototype.stopWaveformAnimation = function() {
    if (!this.isWaveformAnimating) return; // Already stopped
    
    this.isWaveformAnimating = false;
    console.log("🌊 Stopping Euler waveform animation");
    
    if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
    }
    
    // Clear the waveform canvas
    if (this.waveformCanvas) {
        const ctx = this.waveformCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
        
        // Draw a flat line to show stopped state
        ctx.beginPath();
        ctx.moveTo(0, this.waveformCanvas.height / 2);
        ctx.lineTo(this.waveformCanvas.width, this.waveformCanvas.height / 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
};

// Create blend visualization
EulerUIController.prototype.createBlendVisualization = function() {
    try {
        console.log("📊 Creating blend visualization canvas...");
        this.blendCanvas = document.createElement('canvas');
        this.blendCanvas.width = 120;
        this.blendCanvas.height = 120;
        this.blendCanvas.style.position = 'fixed';
        this.blendCanvas.style.right = '20px';
        this.blendCanvas.style.bottom = '230px'; // Moved up to avoid conflict with mode switcher and audio controls
        this.blendCanvas.style.background = '#222';
        this.blendCanvas.style.border = '1px solid #888';
        this.blendCanvas.style.borderRadius = '4px';
        this.blendCanvas.style.zIndex = '2000';
        this.blendCanvas.style.width = '120px';   // Prevent CSS stretching
        this.blendCanvas.style.height = '120px';  // Prevent CSS stretching
        this.blendCanvas.style.boxSizing = 'content-box'; // Prevent border from affecting size
        document.body.appendChild(this.blendCanvas);
        
        console.log("📊 Initializing blend visualization...");
        // Initialize with default values
        this.updateBlendViz(0.5, 0.5, 0.5, 0.5);
        console.log("✅ Blend visualization created successfully");
    } catch (error) {
        console.error("❌ Error creating blend visualization:", error);
    }
};

// Update blend visualization
EulerUIController.prototype.updateBlendViz = function(v1, v2, v3, v4) {
    if (!this.blendCanvas) return;
    
    const ctx = this.blendCanvas.getContext('2d');
    ctx.clearRect(0, 0, this.blendCanvas.width, this.blendCanvas.height);
    
    // Map v1-v4 to 2D (X = v1, Y = v3)
    const x = v1 * this.blendCanvas.width;
    const y = (1 - v3) * this.blendCanvas.height;
    
    // Draw background grid
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.blendCanvas.width/2, 0);
    ctx.lineTo(this.blendCanvas.width/2, this.blendCanvas.height);
    ctx.moveTo(0, this.blendCanvas.height/2);
    ctx.lineTo(this.blendCanvas.width, this.blendCanvas.height/2);
    ctx.stroke();
    
    // Draw the dot
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#4CAF50';
    ctx.shadowColor = '#4CAF50';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Label corners with synth names
    ctx.fillStyle = '#aaa';
    ctx.font = "10px 'Roboto', sans-serif";
    ctx.fillText('FM', 5, 15);
    ctx.fillText('AM', this.blendCanvas.width-25, 15);
    ctx.fillText('MEM', 5, this.blendCanvas.height-5);
    ctx.fillText('DUO', this.blendCanvas.width-30, this.blendCanvas.height-5);
};

// Setup camera controls that don't interfere with UI
EulerUIController.prototype.setupCameraControls = function() {
    this.isMouseOverUI = false;
    
    // Track mouse over UI elements
    const uiElements = [this.guiContainer, this.audioControls, this.waveformCanvas, this.blendCanvas];
    uiElements.forEach(element => {
        if (element) {
            element.addEventListener('mouseenter', () => {
                this.isMouseOverUI = true;
                if (this.cameraController) {
                    this.cameraController.uiBlocked = true;
                }
            });
            element.addEventListener('mouseleave', () => {
                this.isMouseOverUI = false;
                if (this.cameraController) {
                    this.cameraController.uiBlocked = false;
                }
            });
        }
    });
};

// Complete cleanup method (called by AppManager on mode switch)
EulerUIController.prototype.cleanup = function() {
    console.log("🧹 EulerUIController cleanup started...");
    
    try {
        // Stop waveform animation
        this.stopWaveformAnimation();
        
        // Stop audio completely
        this.stopAudio();
        
        // Remove DOM elements
        if (this.guiContainer && this.guiContainer.parentNode) {
            this.guiContainer.parentNode.removeChild(this.guiContainer);
            console.log("🗑️ Removed GUI container");
        }
        
        if (this.audioControls && this.audioControls.parentNode) {
            this.audioControls.parentNode.removeChild(this.audioControls);
            console.log("🗑️ Removed audio controls");
        }
        
        if (this.waveformCanvas && this.waveformCanvas.parentNode) {
            this.waveformCanvas.parentNode.removeChild(this.waveformCanvas);
            console.log("🗑️ Removed waveform canvas");
        }
        
        if (this.blendCanvas && this.blendCanvas.parentNode) {
            this.blendCanvas.parentNode.removeChild(this.blendCanvas);
            console.log("🗑️ Removed blend canvas");
        }
        
        if (this.brandingPanel && this.brandingPanel.parentNode) {
            this.brandingPanel.parentNode.removeChild(this.brandingPanel);
            console.log("🗑️ Removed branding panel");
        }
        
        // Clear references
        this.guiContainer = null;
        this.audioControls = null;
        this.waveformCanvas = null;
        this.blendCanvas = null;
        this.brandingPanel = null;
        this.isWaveformAnimating = false;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        console.log("✅ EulerUIController cleanup complete");
        
    } catch (error) {
        console.error("❌ Error during EulerUIController cleanup:", error);
    }
};

// Clean up (legacy destroy method)
EulerUIController.prototype.destroy = function() {
    // Call new cleanup method
    this.cleanup();
}; 