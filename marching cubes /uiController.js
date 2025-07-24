// UI Controller Script for PlayCanvas
var UIController = pc.createScript('uiController');

// Add script attributes for editor configuration
UIController.attributes.add('showDebugPanel', { type: 'boolean', default: false, title: 'Show Debug Panel' });
UIController.attributes.add('showWaveformViz', { type: 'boolean', default: true, title: 'Show Waveform Visualization' });
UIController.attributes.add('showSimPanel', { type: 'boolean', default: true, title: 'Show Simulation Panel' });
UIController.attributes.add('isViverse', { type: 'boolean', default: false, title: 'Is Viverse' }); // Default to false for PlayCanvas

// Initialize code called once per entity
UIController.prototype.initialize = function() {
    console.log("🎮 [UIController] script initialized");
    
    // Load Roboto font from Google Fonts
    this.loadRobotoFont();
    
    // Add custom slider styles
    this.addSliderStyles();
    
    // Always initialize UI controls - mode checking happens in update loop
    // This ensures UI is ready when marching cubes mode activates
    
    // Detect if we're running in Viverse
    this.runningInViverse = this.isViverse || (window.viverse !== undefined);
    console.log("UI running in Viverse:", this.runningInViverse);
    
    // Define waveforms directly in code instead of as an attribute
    this.waveforms = [
        { name: 'sine' },
        { name: 'square' },
        { name: 'triangle' },
        { name: 'sawtooth' }
    ];
    
    // Store selected waveform
    this.selectedWaveform = 'sine';
    
    // Find marching cubes entity and script
    this.marchingCubes = this.app.root.findByName('MarchingCubes');
    if (this.marchingCubes && this.marchingCubes.script) {
        this.marchingCubesScript = this.marchingCubes.script.marchingCubes;
        console.log('Found marching cubes script:', this.marchingCubesScript ? 'yes' : 'no');
    } else {
        console.warn('Could not find marching cubes script');
        
        // Try to find it after a short delay (in case it's initialized later)
        setTimeout(() => {
            this.marchingCubes = this.app.root.findByName('MarchingCubes');
            if (this.marchingCubes && this.marchingCubes.script) {
                this.marchingCubesScript = this.marchingCubes.script.marchingCubes;
                console.log('Found marching cubes script (delayed):', this.marchingCubesScript ? 'yes' : 'no');
                
                if (this.marchingCubesScript) {
                    // Skip automatic shape update to avoid double initialization
                    console.log('Found marching cubes script (delayed) - skipping automatic shape update');
                }
            }
        }, 500);
    }
    
    // Initialize audio effect parameters first
    this.initializeAudioEffectParams();
    
        // Create Euler-style UI layout
    const appManagerEntity = this.app.root.findByName('AppManager');
    const shouldCreateUI = !appManagerEntity || !appManagerEntity.script || !appManagerEntity.script.AppManager || 
                          appManagerEntity.script.AppManager.currentMode === 'marchingCubes';
    
    if (shouldCreateUI) {
        console.log("🎨 Creating Euler-style UI layout for Marching Cubes");
        
        // 1. Header - top left (like Euler)
        this.createTitleElement();
        
        // 2. Controls - top right (like Euler lil-gui style)  
        this.createEulerStyleControls();
        
        // 3. Waveform - bottom left (like Euler)
        this.createWaveformVisualization();
        
        // 4. Network State - bottom left under waveform (like Euler)
        this.createNetworkStateDisplay();
        
        // 5. Audio Controls - bottom right (like Euler)
        this.createAudioControls();
    } else {
        console.log("🎮 Skipping UI creation - not in marching cubes mode");
    }
    
    // Add keyboard event listeners
    this.addKeyboardListeners();
    
    // Add page visibility change listener to keep audio running when tab is not active
    this.setupAudioTabFix();
    
    // Initialize waveform animation control
    this.isWaveformAnimating = false;
    this.animationFrameId = null;
    
    // Apply initial colors immediately (no timeout to avoid visual changes after load)
    if (this.marchingCubesScript) {
        this.updateBlobColors();
        // Skip automatic shape update - let the default settings work
        console.log(`🔍 [UIController] Initial script numBlobs: ${this.marchingCubesScript.numBlobs}`);
        console.log(`🔍 [UIController] Initial blobs array length: ${this.marchingCubesScript.blobs ? this.marchingCubesScript.blobs.length : 'undefined'}`);
    }
    
    // Debug: Show what UI elements were created
    const debugAppManager = this.app.root.findByName('AppManager');
    if (debugAppManager && debugAppManager.script && debugAppManager.script.AppManager) {
        const currentMode = debugAppManager.script.AppManager.currentMode;
        console.log(`✅ [UIController] setup complete - mode: ${currentMode}`);
        console.log(`   - Title: ${this.titleElement ? 'Created' : 'Not created'}`);
        console.log(`   - Controls: ${this.guiContainer ? 'Created' : 'Not created'}`);
        console.log(`   - Waveform: ${this.waveformCanvas ? 'Created' : 'Not created'}`);
        console.log(`   - Network State: ${this.networkStateDisplay ? 'Created' : 'Not created'}`);
        console.log(`   - Audio Controls: ${this.audioControls ? 'Created' : 'Not created'}`);
    } else {
        console.log("✅ [UIController] setup complete - standalone mode");
    }
};

// Load Roboto font from Google Fonts
UIController.prototype.loadRobotoFont = function() {
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

// Add custom slider styles for white controls
UIController.prototype.addSliderStyles = function() {
    // Check if styles are already added
    if (document.querySelector('#ui-controller-slider-styles')) {
        return;
    }
    
    // Create style element
    const style = document.createElement('style');
    style.id = 'ui-controller-slider-styles';
    style.textContent = `
        /* Custom slider styles for white controls */
        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            background: #ffffff;
            border: 1px solid #ffffff;
            border-radius: 50%;
            cursor: pointer;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
            background: #f0f0f0;
            border-color: #f0f0f0;
        }
        
        input[type="range"]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            background: #ffffff;
            border: 1px solid #ffffff;
            border-radius: 50%;
            cursor: pointer;
            -moz-appearance: none;
            appearance: none;
        }
        
        input[type="range"]::-moz-range-thumb:hover {
            background: #f0f0f0;
            border-color: #f0f0f0;
        }
    `;
    
    document.head.appendChild(style);
    console.log("🎨 Custom white slider styles added");
};

// Initialize audio effect parameters
UIController.prototype.initializeAudioEffectParams = function() {
    // Initialize filter cutoff frequencies with definite values
    this.lowpassCutoff = 20000; // Maximum value for lowpass (fully open)
    this.highpassCutoff = 20;   // Minimum value for highpass (fully open)
    
    // Initialize delay parameters to zero (no delay initially)
    this.delayTime = 0;
    this.delayFeedback = 0;
    this.delayWet = 0;
    
    // Initialize distortion amount
    this.distortionAmount = 0;
    
    // Apply initial values to audio effects if they exist already
    if (this.marchingCubesScript) {
        // Apply filter settings
        if (this.marchingCubesScript.lowpass) {
            this.marchingCubesScript.lowpass.frequency.value = this.lowpassCutoff;
        }
        if (this.marchingCubesScript.highpass) {
            this.marchingCubesScript.highpass.frequency.value = this.highpassCutoff;
        }
        
        // Apply delay settings (disabled initially)
        if (this.marchingCubesScript.delay) {
            this.marchingCubesScript.delay.delayTime.value = this.delayTime;
            this.marchingCubesScript.delay.feedback.value = this.delayFeedback;
            this.marchingCubesScript.delay.wet.value = this.delayWet;
        }
    }
};

// OLD: createSimulationPanel function removed - replaced with Euler-style UI layout

// Helper function to add slider control (slider only, no number input)
UIController.prototype.addSliderControl = function(id, label, min, max, step, defaultValue, onChange, unit = '') {
    const container = document.createElement('div');
    container.style.marginBottom = '15px';
    container.style.pointerEvents = 'auto'; // Ensure container is interactive
    container.style.position = 'relative'; // Establish positioning context
    container.style.zIndex = '100001'; // Above panel but below controls
    
    // Ensure defaultValue is a valid number
    defaultValue = typeof defaultValue === 'number' && !isNaN(defaultValue) ? defaultValue : 0;
    
    // Create label with value display
    const labelContainer = document.createElement('div');
    labelContainer.style.display = 'flex';
    labelContainer.style.justifyContent = 'space-between';
    labelContainer.style.marginBottom = '5px';
    
    const labelText = document.createElement('span');
    labelText.textContent = label;
    
    const valueDisplay = document.createElement('span');
    // Format the value with consistent decimal places
    const formattedValue = Number.isInteger(defaultValue) ? defaultValue.toString() : defaultValue.toFixed(2);
    valueDisplay.textContent = formattedValue + (unit ? ' ' + unit : '');
    valueDisplay.style.color = '#0f0';
    valueDisplay.style.minWidth = '70px'; // Ensure fixed width for value display
    valueDisplay.style.textAlign = 'right'; // Right align text for consistent look
    valueDisplay.style.display = 'inline-block'; // Ensures the width is respected
    
    labelContainer.appendChild(labelText);
    labelContainer.appendChild(valueDisplay);
    container.appendChild(labelContainer);
    
    // Create slider
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = defaultValue;
    slider.style.width = '100%';
    slider.style.height = '20px';
    slider.style.background = '#333';
    slider.style.borderRadius = '10px';
    slider.style.outline = 'none';
    slider.style.appearance = 'none';
    slider.style.cursor = 'pointer';
    slider.style.pointerEvents = 'auto'; // Ensure slider responds to mouse events
    // Use setProperty to force styles with !important
    slider.style.setProperty('z-index', '100002', 'important');
    slider.style.setProperty('position', 'relative', 'important');
    slider.style.setProperty('pointer-events', 'auto', 'important');
    slider.style.setProperty('touch-action', 'manipulation', 'important');
    
    // Custom slider styling
    slider.style.webkitAppearance = 'none';
    slider.style.transition = 'background 0.2s';
    
    // Add debugging event listeners
    slider.addEventListener('mousedown', (e) => {
        console.log(`🖱️ [DEBUG] Slider "${label}" mousedown event received`);
        e.stopPropagation(); // Prevent event bubbling
    });
    
    slider.addEventListener('click', (e) => {
        console.log(`🖱️ [DEBUG] Slider "${label}" click event received`);
        e.stopPropagation(); // Prevent event bubbling
    });
    
    // Add event listener  
    slider.addEventListener('input', (e) => {
        console.log(`🖱️ [UIController] Slider "${label}" changed to:`, parseFloat(slider.value));
        e.stopPropagation(); // Prevent event bubbling
        const value = parseFloat(slider.value);
        // Format the value with consistent decimal places
        const formattedValue = Number.isInteger(value) ? value.toString() : value.toFixed(2);
        valueDisplay.textContent = formattedValue + (unit ? ' ' + unit : '');
        onChange(value);
    });
    
    container.appendChild(slider);
    
    // Append to content container instead of directly to simPanel
    if (this.simPanelContent) {
        this.simPanelContent.appendChild(container);
    } else {
        this.simPanel.appendChild(container);
    }
};

// Create title element (like Euler)
UIController.prototype.createTitleElement = function() {
    this.titleElement = document.createElement('div');
    this.titleElement.style.position = 'fixed';
    this.titleElement.style.left = '30px';
    this.titleElement.style.top = '20px';
    this.titleElement.style.color = '#ffffff';
    this.titleElement.style.fontFamily = 'Roboto, sans-serif';
    this.titleElement.style.fontSize = '14px';
    this.titleElement.style.textAlign = 'left';
    this.titleElement.style.zIndex = '9999';
    this.titleElement.style.textShadow = 'none';
    this.titleElement.style.letterSpacing = '0px';
    this.titleElement.style.lineHeight = '1.2';
    this.titleElement.style.fontWeight = 'normal';
    this.titleElement.style.pointerEvents = 'none';
    this.titleElement.style.userSelect = 'none';
    this.titleElement.style.whiteSpace = 'pre';
    this.titleElement.innerHTML = `INTERSPECIFICS
SONIC MACHINES /
PHYSICAL OSCILLATORS`;
    document.body.appendChild(this.titleElement);
};

// Helper function to add range control (slider + number input) - DEPRECATED
UIController.prototype.addRangeControl = function(id, label, min, max, step, defaultValue, onChange) {
    this.addSliderControl(id, label, min, max, step, defaultValue, onChange);
};

// Create Euler-style controls (top right)
UIController.prototype.createEulerStyleControls = function() {
    // Create main GUI container like Euler
    this.guiContainer = document.createElement('div');
    this.guiContainer.className = 'lil-gui';
    this.guiContainer.style.position = 'fixed';
    this.guiContainer.style.top = '20px';
    this.guiContainer.style.right = '30px';
    this.guiContainer.style.width = '245px';
    this.guiContainer.style.background = '#000000';
    this.guiContainer.style.color = '#fff';
    this.guiContainer.style.fontFamily = 'Roboto, sans-serif';
    this.guiContainer.style.fontSize = '11px';
    this.guiContainer.style.borderRadius = '2px';
    this.guiContainer.style.border = '0.5px solid #ffffff';
    this.guiContainer.style.zIndex = '1000';
    this.guiContainer.style.userSelect = 'none';
    this.guiContainer.style.pointerEvents = 'auto';
    
    // Create title
    const title = document.createElement('div');
    title.style.background = '#000000';
    title.style.padding = '4px 8px';
    title.style.borderBottom = '0.5px solid #ffffff';
    title.style.fontWeight = 'bold';
    title.style.fontSize = '12px';
    title.textContent = 'Controls';
    this.guiContainer.appendChild(title);
    
    // Create controls container
    const controlsContainer = document.createElement('div');
    controlsContainer.style.padding = '0';
    this.guiContainer.appendChild(controlsContainer);
    
    // Add marching cubes controls
    this.addEulerControl(controlsContainer, 'waveform', 'Waveform', 'select', 'sine', {
        options: ['sine', 'square', 'triangle', 'sawtooth']
    });
    this.addEulerControl(controlsContainer, 'chord', 'Chord', 'select', 'None', {
        options: ['None', 'Unison × 2', 'Unison × 3', 'Major', 'Minor', 'Major 7th', 'Minor 7th']
    });
    this.addEulerControl(controlsContainer, 'volume', 'Volume', 'range', -10, { min: -60, max: 0, step: 1, unit: 'dB' });
    this.addEulerControl(controlsContainer, 'speed', 'Speed', 'range', 5, { min: 0.1, max: 10, step: 0.1 });
    this.addEulerControl(controlsContainer, 'numBlobs', 'Num Blobs', 'range', 1, { min: 1, max: 10, step: 1 });
    this.addEulerControl(controlsContainer, 'reverbMix', 'Reverb Mix', 'range', 0.5, { min: 0, max: 1, step: 0.01 });
    
    // Audio Effects folder
    const audioFolder = this.addEulerFolder(controlsContainer, 'Audio Effects');
    this.addEulerControl(audioFolder, 'delayTime', 'Delay Time', 'range', 0, { min: 0, max: 1, step: 0.01, unit: 's' });
    this.addEulerControl(audioFolder, 'delayFeedback', 'Delay Feedback', 'range', 0, { min: 0, max: 0.9, step: 0.01 });
    this.addEulerControl(audioFolder, 'delayMix', 'Delay Mix', 'range', 0, { min: 0, max: 1, step: 0.01 });
    this.addEulerControl(audioFolder, 'lowpassFilter', 'Lowpass Filter', 'range', 20000, { min: 200, max: 20000, step: 100, unit: 'Hz' });
    this.addEulerControl(audioFolder, 'highpassFilter', 'Highpass Filter', 'range', 20, { min: 20, max: 5000, step: 10, unit: 'Hz' });
    
    document.body.appendChild(this.guiContainer);
    
    // Store current values
    this.params = {
        waveform: 'sine',
        chord: 'None',
        volume: -10,
        speed: 5,
        numBlobs: 1,
        reverbMix: 0.5,
        delayTime: 0,
        delayFeedback: 0,
        delayMix: 0,
        lowpassFilter: 20000,
        highpassFilter: 20
    };
};

// Add Euler-style control helper
UIController.prototype.addEulerControl = function(container, property, label, type, defaultValue, options = {}) {
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
        control.style.accentColor = '#ffffff';
        control.style.width = '14px';
        control.style.height = '14px';
        control.onchange = () => this.updateMarchingCubesParameter(property, control.checked);
        controlContainer.appendChild(control);
    } else if (type === 'range') {
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
        
        // Simplified like Euler - no value display, just the control
        control.oninput = () => {
            const value = parseFloat(control.value);
            this.updateMarchingCubesParameter(property, value);
        };
        
        controlContainer.appendChild(control);
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
        
        control.onchange = () => this.updateMarchingCubesParameter(property, control.value);
        controlContainer.appendChild(control);
    }
    
    controlRow.appendChild(controlContainer);
    container.appendChild(controlRow);
    
    return control;
};

// Add Euler-style folder helper
UIController.prototype.addEulerFolder = function(container, title) {
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

// Update marching cubes parameter
UIController.prototype.updateMarchingCubesParameter = function(property, value) {
    // Store the parameter
    if (this.params) {
        this.params[property] = value;
    }
    
    console.log(`🎛️ [UIController] ${property} changed to:`, value);
    
    // Update the marching cubes script
    if (!this.marchingCubesScript) {
        return;
    }
    
    switch (property) {
        case 'waveform':
            this.selectedWaveform = value;
            if (typeof this.marchingCubesScript.updateWaveform === 'function') {
                this.marchingCubesScript.updateWaveform(value);
            }
            this.updateBlobColors();
            this.updateBlobShape(value);
            break;
        case 'chord':
            if (typeof this.marchingCubesScript.updateChord === 'function') {
                this.marchingCubesScript.updateChord(value);
            }
            this.updateBlobColors();
            break;
        case 'volume':
            if (typeof this.marchingCubesScript.updateMasterVolume === 'function') {
                this.marchingCubesScript.updateMasterVolume(value);
            }
            this.updateBlobColors();
            break;
        case 'speed':
            if (this.marchingCubesScript) {
                this.marchingCubesScript.speed = value;
            }
            this.updateBlobColors();
            break;
        case 'numBlobs':
            console.log(`🎛️ [UIController] Setting numBlobs to: ${value} (type: ${typeof value})`);
            if (typeof this.marchingCubesScript.updateNumBlobs === 'function') {
                // Convert to number to ensure correct type
                const numValue = parseInt(value, 10);
                console.log(`🎛️ [UIController] Converted numBlobs to: ${numValue}`);
                this.marchingCubesScript.updateNumBlobs(numValue);
            } else {
                console.warn('⚠️ [UIController] updateNumBlobs function not available');
            }
            break;
        case 'reverbMix':
            if (typeof this.marchingCubesScript.updateReverbMix === 'function') {
                this.marchingCubesScript.updateReverbMix(value);
            }
            this.updateBlobColors();
            break;
        case 'delayTime':
            this.delayTime = value;
            if (this.marchingCubesScript && this.marchingCubesScript.delay) {
                this.marchingCubesScript.delay.delayTime.rampTo(value, 0.1);
            }
            this.updateBlobColors();
            break;
        case 'delayFeedback':
            this.delayFeedback = value;
            if (this.marchingCubesScript && this.marchingCubesScript.delay) {
                this.marchingCubesScript.delay.feedback.rampTo(value, 0.1);
            }
            this.updateBlobColors();
            break;
        case 'delayMix':
            this.delayMix = value;
            if (this.marchingCubesScript && this.marchingCubesScript.delay) {
                this.marchingCubesScript.delay.wet.rampTo(value, 0.1);
            }
            this.updateBlobColors();
            break;
        case 'lowpassFilter':
            this.lowpassCutoff = value;
            if (this.marchingCubesScript && this.marchingCubesScript.lowpass) {
                this.marchingCubesScript.lowpass.frequency.rampTo(value, 0.1);
            }
            this.updateBlobColors();
            break;
        case 'highpassFilter':
            this.highpassCutoff = value;
            if (this.marchingCubesScript && this.marchingCubesScript.highpass) {
                this.marchingCubesScript.highpass.frequency.rampTo(value, 0.1);
            }
            this.updateBlobColors();
            break;
    }
};

// Create waveform visualization (like Euler)
UIController.prototype.createWaveformVisualization = function() {
    try {
        console.log("🌊 Creating waveform canvas like Euler...");
        this.waveformCanvas = document.createElement('canvas');
        this.waveformCanvas.width = 320;
        this.waveformCanvas.height = 80;
        this.waveformCanvas.style.position = 'fixed';
        this.waveformCanvas.style.left = '30px';
        this.waveformCanvas.style.bottom = '320px'; // Much higher to avoid overlap with Network State
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
        
        console.log("✅ Waveform visualization created (animation controlled by audio state)");
    } catch (error) {
        console.error("❌ Error creating waveform visualization:", error);
    }
};

// Create network state display (like Euler)
UIController.prototype.createNetworkStateDisplay = function() {
    this.networkStateDisplay = document.createElement('div');
    this.networkStateDisplay.style.position = 'fixed';
    this.networkStateDisplay.style.left = '30px';
    this.networkStateDisplay.style.bottom = '20px'; // Aligned with HOME/CUBES/EULER buttons
    this.networkStateDisplay.style.width = '320px';
    this.networkStateDisplay.style.background = 'rgba(0,0,0,0.7)';
    this.networkStateDisplay.style.color = '#ffffff';
    this.networkStateDisplay.style.font = "12px 'Roboto', sans-serif";
    this.networkStateDisplay.style.padding = '10px';
    this.networkStateDisplay.style.borderRadius = '5px';
    this.networkStateDisplay.style.zIndex = '1000';
    this.networkStateDisplay.style.textShadow = '1px 1px 1px rgba(0,0,0,0.5)';
    
    // Set initial content
    this.updateNetworkStateDisplay();
    
    document.body.appendChild(this.networkStateDisplay);
};

// Create audio controls (like Euler)
UIController.prototype.createAudioControls = function() {
    try {
        console.log("🔊 Creating audio controls like Euler...");
        this.audioControls = document.createElement('div');
        this.audioControls.style.position = 'fixed';
        this.audioControls.style.right = '30px'; // Aligned with right edge of Controls panel
        this.audioControls.style.bottom = '20px'; // Aligned with mode switcher buttons
        this.audioControls.style.background = 'rgba(0, 0, 0, 0.8)';
        this.audioControls.style.color = '#fff';
        this.audioControls.style.fontFamily = 'Roboto, sans-serif';
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
        this.startButton.style.cursor = 'pointer';
        this.startButton.style.fontFamily = 'Roboto, sans-serif';
        this.startButton.style.fontWeight = 'normal';
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
        this.stopButton.style.cursor = 'pointer';
        this.stopButton.style.fontFamily = 'Roboto, sans-serif';
        this.stopButton.style.fontWeight = 'normal';
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

// Update network state display (based on marching cubes blobs)
UIController.prototype.updateNetworkStateDisplay = function() {
    if (!this.networkStateDisplay) return;
    
    // Get blob data from marching cubes script
    let blobCount = 0;
    let meshVertices = 0;
    let speed = 5;
    let reverbMix = 0.5;
    let audioLevel = -Infinity;
    let isClipping = false;
    
    if (this.marchingCubesScript) {
        blobCount = this.marchingCubesScript.blobs ? this.marchingCubesScript.blobs.length : 0;
        speed = this.marchingCubesScript.speed || 5;
        
        // Get mesh vertex count
        if (this.marchingCubesScript.meshEntity && 
            this.marchingCubesScript.meshEntity.render && 
            this.marchingCubesScript.meshEntity.render.meshInstances && 
            this.marchingCubesScript.meshEntity.render.meshInstances.length > 0) {
            const mesh = this.marchingCubesScript.meshEntity.render.meshInstances[0].mesh;
            if (mesh && mesh.vertexBuffer) {
                meshVertices = mesh.vertexBuffer.numVertices;
            }
        }
        
        // Get audio level if available
        if (this.marchingCubesScript.meter) {
            const level = this.marchingCubesScript.meter.getValue();
            if (typeof Tone !== 'undefined') {
                audioLevel = Tone.gainToDb(level);
                if (!isFinite(audioLevel)) audioLevel = -Infinity;
                isClipping = audioLevel > -1;
            }
        }
    }
    
    // Calculate synthetic network metrics based on blob data
    const networkState = {
        blobDensity: (blobCount / 10) * 100, // Normalized to 0-100%
        meshComplexity: Math.min(100, (meshVertices / 1000) * 100), // Normalized
        spatialDistribution: speed / 10, // Based on speed
        audioActivity: isFinite(audioLevel) ? Math.max(0, (audioLevel + 60) / 60) : 0, // Normalized
        reverbAmount: (this.marchingCubesScript?.reverbMix || 0.5) * 100,
        filterActivity: this.lowpassCutoff ? (20000 - this.lowpassCutoff) / 19800 * 100 : 0,
        connectionDensity: Math.min(100, (meshVertices / 500) * 100)
    };
    
    const stats = `
    <div style="margin-bottom: 10px;">
                    <h3 style="margin: 0 0 5px 0; color: #ffffff;">Network State</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 11px;">
            <div>Blob Density:</div>
            <div>${networkState.blobDensity.toFixed(1)}%</div>
            <div>Mesh Complexity:</div>
            <div>${networkState.meshComplexity.toFixed(1)}%</div>
            <div>Spatial Distribution:</div>
            <div>${networkState.spatialDistribution.toFixed(2)}</div>
            <div>Audio Activity:</div>
            <div>${(networkState.audioActivity * 100).toFixed(1)}%</div>
            <div>Reverb Amount:</div>
            <div>${networkState.reverbAmount.toFixed(1)}%</div>
            <div>Filter Activity:</div>
            <div>${networkState.filterActivity.toFixed(1)}%</div>
            <div>Connection Density:</div>
            <div>${networkState.connectionDensity.toFixed(1)}%</div>
        </div>
    </div>
    <div style="margin-top: 10px;">
        <h3 style="margin: 0 0 5px 0; color: #ffffff;">System Stats</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 11px;">
            <div>Blobs:</div>
            <div>${blobCount}</div>
            <div>Mesh Vertices:</div>
            <div>${meshVertices}</div>
            <div>Speed:</div>
            <div>${speed.toFixed(1)}</div>
            <div>Audio Level:</div>
            <div>${isFinite(audioLevel) ? audioLevel.toFixed(1) + ' dB' : 'Silent'}</div>
            <div>Status:</div>
            <div>${isClipping ? 'CLIPPING!' : 'Normal'}</div>
            <div>Waveform:</div>
            <div>${this.selectedWaveform || 'sine'}</div>
        </div>
    </div>
    `;
    
    this.networkStateDisplay.innerHTML = stats;
};

// Start waveform animation
UIController.prototype.startWaveformAnimation = function() {
    if (this.isWaveformAnimating) return; // Already animating
    
    this.isWaveformAnimating = true;
    console.log("🌊 Starting waveform animation");
    
    const animate = () => {
        if (this.isWaveformAnimating) {
            this.drawWaveform();
            this.animationFrameId = requestAnimationFrame(animate);
        }
    };
    animate();
};

// Stop waveform animation
UIController.prototype.stopWaveformAnimation = function() {
    if (!this.isWaveformAnimating) return; // Already stopped
    
    this.isWaveformAnimating = false;
    console.log("🌊 Stopping waveform animation");
    
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

// Draw waveform visualization (like Euler)
UIController.prototype.drawWaveform = function() {
    if (!this.waveformCanvas) return;
    
    const ctx = this.waveformCanvas.getContext('2d');
    ctx.clearRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
    
    // Get audio data if available
    let data = null;
    if (this.marchingCubesScript && this.marchingCubesScript.analyser) {
        try {
            data = this.marchingCubesScript.analyser.getValue();
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
        // Synthetic waveform based on marching cubes parameters
        const time = performance.now() * 0.001;
        const speed = this.marchingCubesScript?.speed || 5;
        const numBlobs = this.marchingCubesScript?.blobs?.length || 1;
        for (let i = 0; i < this.waveformCanvas.width; i++) {
            const x = i;
            const frequency = 0.02 + (numBlobs / 100);
            const amplitude = 20 + (speed * 5);
            const y = this.waveformCanvas.height / 2 + Math.sin((x * frequency) + time * speed) * amplitude;
            ctx.lineTo(x, y);
        }
    }
    
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
};

// Start audio (like Euler)
UIController.prototype.startAudio = function() {
    console.log("🔊 Starting audio...");
    
    try {
        // Check if Tone.js is available
        if (typeof Tone !== 'undefined') {
            // Ensure audio context is running
            if (Tone.context && Tone.context.state === 'suspended') {
                console.log("🔄 Resuming suspended audio context...");
                Tone.context.resume().then(() => {
                    console.log("✅ Audio context resumed");
                    this.initializeMarchingCubesAudio();
                }).catch(error => {
                    console.error("❌ Failed to resume audio context:", error);
                });
            } else {
                // Context is ready, start audio
                this.initializeMarchingCubesAudio();
            }
        } else {
            console.error("❌ Tone.js not available");
        }
        
    } catch (error) {
        console.error("❌ Error starting audio:", error);
    }
};

// Helper function to initialize marching cubes audio
UIController.prototype.initializeMarchingCubesAudio = function() {
    if (this.marchingCubesScript) {
        console.log("🎵 Restarting marching cubes audio system...");
        
        try {
            // If audio was already initialized, just restart transport and synths
            if (this.marchingCubesScript.masterGain) {
                console.log("🔄 Audio system exists, restarting...");
                
                // Unmute master gain
                this.marchingCubesScript.masterGain.gain.value = this.marchingCubesScript.masterVolume || 0.8;
                
                // Start transport
                if (typeof Tone !== 'undefined' && Tone.Transport && Tone.Transport.state !== 'started') {
                    Tone.Transport.start();
                    console.log("🚀 Tone Transport restarted");
                }
                
            } else if (typeof this.marchingCubesScript.initializeAudio === 'function') {
                console.log("🆕 Initializing fresh audio system...");
                this.marchingCubesScript.initializeAudio();
                
                // Start transport
                if (typeof Tone !== 'undefined' && Tone.Transport && Tone.Transport.state !== 'started') {
                    Tone.Transport.start();
                    console.log("🚀 Tone Transport started");
                }
            }
            
            // Change button text to "Audio Running" and update style
            if (this.startButton) {
                this.startButton.textContent = 'Audio Running';
                this.startButton.style.background = '#ffffff';
                this.startButton.style.color = '#000000';
            }
            
            // Start waveform animation when audio starts
            this.startWaveformAnimation();
            
            console.log("✅ Audio started successfully");
            
        } catch (error) {
            console.error("❌ Error in audio initialization:", error);
        }
        
    } else {
        console.error("❌ Could not start audio - marching cubes script not found");
    }
};

// Stop audio (like Euler)
UIController.prototype.stopAudio = function() {
    console.log("🔊 Stopping audio...");
    
    try {
        // Stop Tone.js if available
        if (typeof Tone !== 'undefined') {
            // Stop transport
            if (Tone.Transport) {
                Tone.Transport.stop();
                console.log("📻 Tone Transport stopped");
            }
            
            // Cancel all scheduled events
            if (Tone.Transport.cancel) {
                Tone.Transport.cancel();
                console.log("🗑️ Scheduled events cancelled");
            }
            
            // Stop all synths in marching cubes script
            if (this.marchingCubesScript) {
                // Try multiple synth arrays that might exist
                const synthArrays = [
                    this.marchingCubesScript.synths,
                    this.marchingCubesScript.blobSynths,
                    this.marchingCubesScript.voices
                ];
                
                synthArrays.forEach((synthArray, index) => {
                    if (synthArray && Array.isArray(synthArray)) {
                        console.log(`🎵 Stopping synth array ${index} with ${synthArray.length} synths`);
                        synthArray.forEach((synth, synthIndex) => {
                            if (synth) {
                                try {
                                    if (typeof synth.triggerRelease === 'function') {
                                        synth.triggerRelease();
                                    }
                                    // Don't dispose - just release notes so we can restart
                                    console.log(`   - Released synth ${synthIndex}`);
                                } catch (error) {
                                    console.warn(`   - Error stopping synth ${synthIndex}:`, error);
                                }
                            }
                        });
                    }
                });
                
                // Also stop any individual synth properties
                ['fm', 'am', 'membrane', 'duo'].forEach(synthName => {
                    const synth = this.marchingCubesScript[synthName];
                    if (synth && typeof synth.triggerRelease === 'function') {
                        synth.triggerRelease();
                        console.log(`🎼 Released ${synthName} synth`);
                    }
                });
                
                // Stop any master gain
                if (this.marchingCubesScript.masterGain) {
                    this.marchingCubesScript.masterGain.gain.value = 0;
                    console.log("🔇 Muted master gain");
                }
            }
            
                    // Don't suspend context - just stop transport so we can restart easily
        console.log("⏸️ Audio transport stopped (context remains active for restart)");
    }
    
    // Stop waveform animation when audio stops
    this.stopWaveformAnimation();
    
    // Reset button text to "Start Audio" and restore normal style
    if (this.startButton) {
        this.startButton.textContent = 'Start Audio';
        this.startButton.style.background = 'transparent';
        this.startButton.style.color = '#ffffff';
    }
    
    console.log("✅ Audio stopped successfully");
        
    } catch (error) {
        console.error("❌ Error stopping audio:", error);
    }
};

// Add keyboard event listeners
UIController.prototype.addKeyboardListeners = function() {
    // Add keyboard event listener - removed since we're using sliders now
    // Keep the function for future keyboard controls if needed
};

// Complete cleanup method (called by AppManager on mode switch)
UIController.prototype.cleanup = function() {
    console.log("🧹 UIController cleanup started...");
    
    try {
        // Stop waveform animation
        this.stopWaveformAnimation();
        
        // Stop audio completely
        this.stopAudio();
        
        // Remove DOM elements
        if (this.titleElement && this.titleElement.parentNode) {
            this.titleElement.parentNode.removeChild(this.titleElement);
            console.log("🗑️ Removed title element");
        }
        
        if (this.guiContainer && this.guiContainer.parentNode) {
            this.guiContainer.parentNode.removeChild(this.guiContainer);
            console.log("🗑️ Removed GUI container");
        }
        
        if (this.waveformCanvas && this.waveformCanvas.parentNode) {
            this.waveformCanvas.parentNode.removeChild(this.waveformCanvas);
            console.log("🗑️ Removed waveform canvas");
        }
        
        if (this.networkStateDisplay && this.networkStateDisplay.parentNode) {
            this.networkStateDisplay.parentNode.removeChild(this.networkStateDisplay);
            console.log("🗑️ Removed network state display");
        }
        
        if (this.audioControls && this.audioControls.parentNode) {
            this.audioControls.parentNode.removeChild(this.audioControls);
            console.log("🗑️ Removed audio controls");
        }
        
        // Clear references
        this.titleElement = null;
        this.guiContainer = null;
        this.waveformCanvas = null;
        this.networkStateDisplay = null;
        this.audioControls = null;
        this.isWaveformAnimating = false;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        console.log("✅ UIController cleanup complete");
        
    } catch (error) {
        console.error("❌ Error during UIController cleanup:", error);
    }
};

// Update code called every frame
UIController.prototype.update = function(dt) {
    // Check if we should run (only when marching cubes mode is active)
    const appManager = this.app.root.findByName('AppManager');
    if (appManager && appManager.script && appManager.script.AppManager) {
        const currentMode = appManager.script.AppManager.currentMode;
        if (currentMode !== 'marchingCubes') {
            // Don't update when not in marching cubes mode
            return;
        }
    }
    
    // Update network state display every 30 frames (like Euler)
    if (this.frameCounter === undefined) this.frameCounter = 0;
    this.frameCounter++;
    
    if (this.frameCounter % 30 === 0) {
        this.updateNetworkStateDisplay();
    }
    
    // Update debug panel if it exists and is enabled
    if (this.showDebugPanel && this.debugPanel && this.marchingCubesScript) {
        let vertCount = 0;
        if (this.marchingCubesScript.meshEntity && 
            this.marchingCubesScript.meshEntity.render && 
            this.marchingCubesScript.meshEntity.render.meshInstances && 
            this.marchingCubesScript.meshEntity.render.meshInstances.length > 0) {
            const mesh = this.marchingCubesScript.meshEntity.render.meshInstances[0].mesh;
            if (mesh) {
                vertCount = mesh.vertexBuffer ? mesh.vertexBuffer.numVertices : 0;
            }
        }
        
        // Get audio level if meter exists
        let dbLevel = -Infinity;
        let isClipping = false;
        if (this.marchingCubesScript.meter) {
            const level = this.marchingCubesScript.meter.getValue();
            if (typeof Tone !== 'undefined') {
                dbLevel = Tone.gainToDb(level);
                if (!isFinite(dbLevel)) dbLevel = -Infinity;
                isClipping = dbLevel > -1;
            }
        }
        
        // Get shape info and create appropriate indicator color
        const currentShape = this.marchingCubesScript.shapeType || 'sphere';
        let shapeColor;
        let shapeIcon;
        
        switch (currentShape) {
            case 'square':
                shapeColor = '#FF6A00'; // Orange
                shapeIcon = '■'; // Square
                break;
            case 'triangle':
                shapeColor = '#ADFF2F'; // GreenYellow
                shapeIcon = '▲'; // Triangle
                break;
            case 'rhombus':
                shapeColor = '#BA55D3'; // MediumOrchid
                shapeIcon = '◆'; // Diamond
                break;
            case 'sphere':
            default:
                shapeColor = '#1E90FF'; // DodgerBlue
                shapeIcon = '●'; // Circle
                break;
        }
        
        // Update debug panel
        this.debugPanel.innerHTML = `
            <div style="text-align: center; margin-bottom: 10px;">
                <span style="font-size: 36px; color: ${shapeColor};">${shapeIcon}</span>
                <div style="font-weight: bold; color: ${shapeColor}; text-transform: uppercase;">${currentShape} MODE</div>
            </div>
            <b>Marching Cubes Debug</b><br>
            Vertices: ${vertCount}<br>
            Resolution: ${this.marchingCubesScript.resolution}<br>
            Blobs: ${this.marchingCubesScript.blobs.length}<br>
            Shape: ${this.marchingCubesScript.shapeType || 'unknown'}<br>
            ShapePower: ${this.marchingCubesScript.shapePower || 'unknown'}<br>
            ShapeScale: ${this.marchingCubesScript.shapeScale || 'unknown'}<br>
            ShapeOffset: ${this.marchingCubesScript.shapeOffset || 'unknown'}<br>
            LPF: ${this.lowpassCutoff || 20000} Hz<br>
            HPF: ${this.highpassCutoff || 20} Hz<br>
            Delay: ${(this.delayTime || 0).toFixed(2)}s / ${(this.delayFeedback || 0).toFixed(2)} / ${(this.delayWet || 0).toFixed(2)}<br>
            Waveform: ${this.selectedWaveform || 'sine'}<br>
            Audio Level: ${isFinite(dbLevel) ? dbLevel.toFixed(1) + ' dB' : 'Silent'}<br>
            ${isClipping ? '<span style="color: #f00; font-weight: bold;">CLIPPING!</span>' : ''}
            
            <div style="margin-top: 10px; display: flex; gap: 5px;">
                <button id="debugSphere" style="padding: 5px; background: #333; color: #1E90FF; border: 1px solid #1E90FF; border-radius: 4px; font-weight: ${currentShape === 'sphere' ? 'bold' : 'normal'};">● Sphere</button>
                <button id="debugCube" style="padding: 5px; background: #333; color: #FF6A00; border: 1px solid #FF6A00; border-radius: 4px; font-weight: ${currentShape === 'square' ? 'bold' : 'normal'};">■ Cube</button>
                <button id="debugTriangle" style="padding: 5px; background: #333; color: #ADFF2F; border: 1px solid #ADFF2F; border-radius: 4px; font-weight: ${currentShape === 'triangle' ? 'bold' : 'normal'};">▲ Triangle</button>
                <button id="debugDiamond" style="padding: 5px; background: #333; color: #BA55D3; border: 1px solid #BA55D3; border-radius: 4px; font-weight: ${currentShape === 'rhombus' ? 'bold' : 'normal'};">◆ Diamond</button>
            </div>
        `;
        
        // Add event listeners to the buttons
        setTimeout(() => {
            const debugSphere = document.getElementById('debugSphere');
            const debugCube = document.getElementById('debugCube');
            const debugTriangle = document.getElementById('debugTriangle');
            const debugDiamond = document.getElementById('debugDiamond');
            
            if (debugSphere) {
                debugSphere.addEventListener('click', () => {
                    console.log('[DEBUG] Forcing sphere shape');
                    this.marchingCubesScript.updateShape('sine');
                });
            }
            
            if (debugCube) {
                debugCube.addEventListener('click', () => {
                    console.log('[DEBUG] Forcing cube shape');
                    this.marchingCubesScript.updateShape('square');
                });
            }
            
            if (debugTriangle) {
                debugTriangle.addEventListener('click', () => {
                    console.log('[DEBUG] Forcing triangle shape');
                    this.marchingCubesScript.updateShape('triangle');
                });
            }
            
            if (debugDiamond) {
                debugDiamond.addEventListener('click', () => {
                    console.log('[DEBUG] Forcing diamond shape');
                    this.marchingCubesScript.updateShape('sawtooth');
                });
            }
        }, 10);
    }
    
    // Update waveform visualization
    if (this.vizCanvas && this.vizCtx && this.marchingCubesScript && this.marchingCubesScript.analyser) {
        try {
            const waveform = this.marchingCubesScript.analyser.getValue();
            
            // Clear canvas
            this.vizCtx.clearRect(0, 0, this.vizCanvas.width, this.vizCanvas.height);
            
            // Draw center line
            this.vizCtx.beginPath();
            this.vizCtx.strokeStyle = 'rgba(255,255,255,0.2)';
            this.vizCtx.lineWidth = 1;
            this.vizCtx.moveTo(0, this.vizCanvas.height / 2);
            this.vizCtx.lineTo(this.vizCanvas.width, this.vizCanvas.height / 2);
            this.vizCtx.stroke();
            
            // Draw waveform
            this.vizCtx.beginPath();
            this.vizCtx.strokeStyle = '#0f0';
            this.vizCtx.lineWidth = 2;
            
            for (let i = 0; i < waveform.length; i++) {
                const x = (i / waveform.length) * this.vizCanvas.width;
                const y = ((waveform[i] + 1) / 2) * this.vizCanvas.height;
                
                if (i === 0) {
                    this.vizCtx.moveTo(x, y);
                } else {
                    this.vizCtx.lineTo(x, y);
                }
            }
            
            this.vizCtx.stroke();
            
            // Add subtle gradient fill
            const gradient = this.vizCtx.createLinearGradient(0, 0, 0, this.vizCanvas.height);
            gradient.addColorStop(0, 'rgba(0,255,0,0.1)');
            gradient.addColorStop(1, 'rgba(0,255,0,0)');
            this.vizCtx.fillStyle = gradient;
            this.vizCtx.lineTo(this.vizCanvas.width, this.vizCanvas.height);
            this.vizCtx.lineTo(0, this.vizCanvas.height);
            this.vizCtx.closePath();
            this.vizCtx.fill();
        } catch (error) {
            console.warn('Error updating waveform visualization:', error);
        }
    }
};

// Setup fix for audio pausing when tab is not active
UIController.prototype.setupAudioTabFix = function() {
    // Store audio state
    this.audioWasPlaying = false;
    
    // Event handler for visibility change
    document.addEventListener('visibilitychange', () => {
        console.log('Visibility state changed:', document.visibilityState);
        
        if (!this.marchingCubesScript || !window.Tone) return;
        
        if (document.visibilityState === 'hidden') {
            // Tab is hidden - Pause audio
            if (Tone.Transport.state === "started") {
                this.audioWasPlaying = true;
                console.log('Pausing audio playback while tab is hidden');
                
                // Save current audio state before pausing
                if (this.marchingCubesScript.synths) {
                    this.marchingCubesScript.synths.forEach(synth => {
                        if (synth) {
                            synth.triggerRelease();
                        }
                    });
                }
                
                // Pause transport
                Tone.Transport.pause();
            }
        } else if (document.visibilityState === 'visible') {
            // Tab is visible again - Resume audio if it was playing
            if (this.audioWasPlaying && Tone.Transport.state !== "started") {
                console.log('Resuming audio playback');
                
                // Resume context and transport
                Tone.context.resume().then(() => {
                    Tone.Transport.start();
                    
                    // If we have the marching cubes script, restart if needed
                    if (this.marchingCubesScript && this.marchingCubesScript.restartAudio) {
                        this.marchingCubesScript.restartAudio();
                    }
                    
                    this.audioWasPlaying = false;
                });
            }
        }
    });
};

// Update UI elements after reset
UIController.prototype.updateUIAfterReset = function() {
    // Find and update all sliders to match reset values
    if (this.simPanelContent) {
        // Find all sliders and set them to default values
        const sliders = this.simPanelContent.querySelectorAll('input[type="range"]');
        sliders.forEach(slider => {
            // Determine which slider this is by its parent's text content
            const label = slider.parentElement.querySelector('span:first-child');
            if (!label) return;
            
            let valueToSet = null;
            if (label.textContent === 'Volume') {
                valueToSet = this.defaultValues.volume;
            } else if (label.textContent === 'Speed') {
                valueToSet = this.defaultValues.speed;
            } else if (label.textContent === 'Num Blobs') {
                valueToSet = this.defaultValues.numBlobs;
            } else if (label.textContent === 'Reverb Mix') {
                valueToSet = this.defaultValues.reverbMix;
            } else if (label.textContent === 'Delay Time') {
                valueToSet = this.defaultValues.delayTime;
            } else if (label.textContent === 'Delay Feedback') {
                valueToSet = this.defaultValues.delayFeedback;
            } else if (label.textContent === 'Delay Wet') {
                valueToSet = this.defaultValues.delayWet;
            } else if (label.textContent === 'Lowpass Filter') {
                valueToSet = this.defaultValues.lowpassFilter;
            } else if (label.textContent === 'Highpass Filter') {
                valueToSet = this.defaultValues.highpassFilter;
            }
            
            if (valueToSet !== null) {
                // Set the slider value
                slider.value = valueToSet;
                
                // Update the value display
                const valueDisplay = slider.parentElement.querySelector('span:last-child');
                if (valueDisplay) {
                    const unit = valueDisplay.textContent.includes('dB') ? ' dB' : 
                                valueDisplay.textContent.includes('Hz') ? ' Hz' : 
                                valueDisplay.textContent.includes('s') ? ' s' : '';
                    
                    const formattedValue = Number.isInteger(valueToSet) ? valueToSet.toString() : valueToSet.toFixed(2);
                    valueDisplay.textContent = formattedValue + unit;
                }
            }
        });
        
        // Update waveform select if it exists
        const waveformSelect = this.simPanelContent.querySelector('select');
        if (waveformSelect) {
            waveformSelect.value = this.defaultValues.waveform;
        }
    }
};

// Color control function to update blob colors based on parameters
UIController.prototype.updateBlobColors = function() {
    if (!this.marchingCubesScript) return;
    
    // Base color: white
    let r = 1.0, g = 1.0, b = 1.0;

    // Define filter base values
    const BASE_HIGHPASS = 20;    // Minimum value for highpass (fully open)
    const BASE_LOWPASS = 20000;  // Maximum value for lowpass (fully open)

    // Slider normalizations (0 = neutral/off, 1 = fully active)
    const reverbMixNorm     = Math.abs((this.marchingCubesScript.reverbMix ?? 0.5) - 0.5) * 2; // 0 at 0.5, 1 at 0 or 1
    const delayTimeNorm     = this.delayTime ?? 0;                                // 0 to 1
    const delayFeedbackNorm = this.delayFeedback ?? 0;                            // 0 to 0.9 (effectively 0-1)
    const delayWetNorm      = this.delayWet ?? 0;                                 // 0 to 1
    const hpNorm            = Math.max(0, ((this.highpassCutoff ?? BASE_HIGHPASS) - BASE_HIGHPASS)) / (5000 - BASE_HIGHPASS); // 0 if at base, up to 1
    const lpNormInv         = Math.max(0, (BASE_LOWPASS - (this.lowpassCutoff ?? BASE_LOWPASS))) / (BASE_LOWPASS - 200); // 0 if at base (open), up to 1 (closed)

    const effectStrength = 0.95; // How much a slider affects color (0 to 1)

    // --- Apply effects by reducing other channels ---
    // Reverb Mix (Magenta when != 0.5)
    if (reverbMixNorm > 0.05) {
        g *= (1 - reverbMixNorm * effectStrength);
    }
    // Delay Time (Red when > 0)
    if (delayTimeNorm > 0.05) {
        g *= (1 - delayTimeNorm * effectStrength);
        b *= (1 - delayTimeNorm * effectStrength);
    }
    // Delay Feedback (Green when > 0)
    if (delayFeedbackNorm > 0.05) {
        r *= (1 - delayFeedbackNorm * effectStrength);
        b *= (1 - delayFeedbackNorm * effectStrength);
    }
    // Delay Wet/Mix (Blue when > 0)
    if (delayWetNorm > 0.05) {
        r *= (1 - delayWetNorm * effectStrength);
        g *= (1 - delayWetNorm * effectStrength);
    }
    // High Pass Filter (Yellow when > base)
    if (hpNorm > 0.05) {
        b *= (1 - hpNorm * effectStrength);
    }
    // Low Pass Filter (Cyan when closed)
    if (lpNormInv > 0.05) {
        r *= (1 - lpNormInv * effectStrength);
    }

    // Ensure values are clamped (though direct multiplication from 1.0 should keep them in range)
    r = Math.min(1, Math.max(0, r));
    g = Math.min(1, Math.max(0, g));
    b = Math.min(1, Math.max(0, b));

    // Apply colors to the marching cubes if the function exists
    if (typeof this.marchingCubesScript.updateColors === 'function') {
        this.marchingCubesScript.updateColors(r, g, b);
    } else {
        // Try to update material directly if available
        try {
            if (this.marchingCubesScript.meshEntity && 
                this.marchingCubesScript.meshEntity.render && 
                this.marchingCubesScript.meshEntity.render.meshInstances &&
                this.marchingCubesScript.meshEntity.render.meshInstances.length > 0) {
                
                const meshInstance = this.marchingCubesScript.meshEntity.render.meshInstances[0];
                if (meshInstance.material) {
                    // Update emissive color for glowing effect
                    meshInstance.material.emissive.set(r * 0.5, g * 0.5, b * 0.5);
                    meshInstance.material.diffuse.set(r, g, b);
                    meshInstance.material.update();
                }
            }
        } catch (e) {
            console.warn('Could not update marching cubes color:', e);
        }
    }
};

// Function to update the blob shape based on waveform type
UIController.prototype.updateBlobShape = function(waveformType) {
    if (!this.marchingCubesScript) {
        console.warn('[UIController] Cannot update shape: marchingCubesScript not found');
        
        // Try to find MarchingCubes script directly as a fallback
        const marchingCubes = this.app.root.findByName('MarchingCubes');
        if (marchingCubes && marchingCubes.script && marchingCubes.script.marchingCubes) {
            console.log('[UIController] Found marchingCubes script via direct lookup');
            this.marchingCubesScript = marchingCubes.script.marchingCubes;
        } else {
            console.error('[UIController] MarchingCubes entity or script still not found');
            return;
        }
    }
    
    console.log('[UIController] Updating blob shape for waveform:', waveformType);
    
    // Use the direct updateShape method in the marchingCubes script
    if (typeof this.marchingCubesScript.updateShape === 'function') {
        console.log('[UIController] Calling marchingCubesScript.updateShape()');
        this.marchingCubesScript.updateShape(waveformType);
        console.log('[UIController] Shape updated through marchingCubes.updateShape()');
        
        // Verify the change was applied
        console.log('[UIController] Current shape is now:', 
            this.marchingCubesScript.shapeType, 
            'Power:', this.marchingCubesScript.shapePower);
    } else {
        console.error('[UIController] Cannot update shape: updateShape method not found');
        console.log('[UIController] Available methods:', 
            Object.keys(this.marchingCubesScript).filter(key => 
                typeof this.marchingCubesScript[key] === 'function'
            ).join(', '));
    }
}; 