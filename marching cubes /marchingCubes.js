// Marching Cubes PlayCanvas Script
var MarchingCubes = pc.createScript('marchingCubes');

// Add script attributes for editor configuration
MarchingCubes.attributes.add('resolution', { type: 'number', default: 28, title: 'Resolution' });
MarchingCubes.attributes.add('size', { type: 'number', default: 3.0, title: 'Size' });
MarchingCubes.attributes.add('isolation', { type: 'number', default: 1.0, title: 'Isolation' });
MarchingCubes.attributes.add('numBlobs', { type: 'number', default: 1, title: 'Num Blobs' });
MarchingCubes.attributes.add('speed', { type: 'number', default: 5.0, title: 'Speed' });
MarchingCubes.attributes.add('enableAudio', { type: 'boolean', default: true, title: 'Enable Audio' });
MarchingCubes.attributes.add('reverbMix', { type: 'number', default: 0.5, title: 'Reverb Mix', min: 0, max: 1 });
// Shape parameters
MarchingCubes.attributes.add('shapeType', { type: 'string', default: 'sphere', title: 'Shape Type' });
MarchingCubes.attributes.add('shapePower', { type: 'number', default: 2.0, title: 'Shape Power' });
MarchingCubes.attributes.add('shapeScale', { type: 'number', default: 1.0, title: 'Shape Scale' });
MarchingCubes.attributes.add('shapeOffset', { type: 'number', default: 0.0, title: 'Shape Offset' });

// Initialize code called once per entity
MarchingCubes.prototype.initialize = function() {
    console.log("[MarchingCubes] script initialized");
    
    // Set default shape parameters
    this.shapeType = 'sphere'; // Default shape
    this.shapePower = 2.0;     // Default power
    this.shapeScale = 1.0;     // Default scale
    this.shapeOffset = 0.0;    // Default offset
    
    // Create wireframe material
    this.material = new pc.StandardMaterial();
    this.material.diffuse = new pc.Color(1, 1, 1);
    this.material.wireframe = true;  // Enable wireframe mode
    this.material.opacity = 1.0;     // Fully opaque for wireframe lines
    this.material.blendType = pc.BLEND_NONE;
    this.material.cull = pc.CULLFACE_NONE;  // Don't cull faces in wireframe mode
    this.material.emissive = new pc.Color(1, 1, 1);
    this.material.emissiveIntensity = 1.0;  // Bright emission for visibility
    this.material.shininess = 0;
    this.material.metalness = 0;
    this.material.roughness = 1;
    this.material.useLighting = false;  // Disable lighting for pure wireframe look
    this.material.update();
    
    // Create container for marching cubes mesh
    this.marchingCubesContainer = this.entity;
    
    // Create initial mesh entity
    this.meshEntity = new pc.Entity('marchingCubesMesh');
    this.meshEntity.addComponent('render', {
        material: this.material,
        castShadows: true,
        receiveShadows: true
    });
    this.marchingCubesContainer.addChild(this.meshEntity);
    // After adding meshEntity to container, ensure it starts disabled
    this.meshEntity.enabled = false; // Will be enabled only for non-sphere shapes
    
    // Define chord frequencies
    this.defineChords();
    
    // Initialize selected chord
    this.selectedChord = 'None';
    
    // Initialize material type
    this.materialType = 'plastic';
    
    // Initialize blob array with random properties
    this.blobs = [];
    this.debugSpheres = [];
    this.initializeBlobs();
    
    // Initialize audio if enabled
    if (this.enableAudio) {
        // Audio will be initialized by the start button
        console.log("Audio will be initialized when the start button is clicked");
    }
    
    // Initialize time
    this.time = 0;
    
    // Flag to track shape updates
    this._needsUpdate = false;
    
    // Initialize override color (white by default)
    this.overrideColor = new pc.Color(1,1,1);
    
    console.log("[MarchingCubes] Initialized with shape type:", this.shapeType);
};

// Define musical chord frequencies
MarchingCubes.prototype.defineChords = function() {
    // Define musical frequencies for chord mapping
    const C = 261.63; // C4
    const D = 293.66;
    const E = 329.63;
    const F = 349.23;
    const G = 392.00;
    const A = 440.00;
    const Bb = 466.16;
    const B = 493.88;
    const Eb = 311.13;
    const Ab = 415.30;
    const Gs = 415.30;
    const Df = 277.18;
    const Fsharp = 369.99;
    const Gb = 369.99;

    // Define available chords
    this.CHORDS = {
        'None': null,
        'Unison × 2': [C, C],
        'Unison × 3': [C, C, C],
        'Unison × 4': [C, C, C, C],
        'Fourth': [C, F],
        'Fifth': [C, G],
        'minor': [C, Eb, G],
        'm7': [C, Eb, G, Bb],
        'madd9': [C, Eb, G, D],
        'm6': [C, Eb, G, A],
        'mb5': [C, Eb, Gb],
        'm7b5': [C, Eb, Gb, Bb],
        'm7#5': [C, Eb, Gs, Bb],
        'mMaj7': [C, Eb, G, B],
        'mb6': [C, Eb, G, Ab],
        'm9no5': [C, Eb, Bb, D],
        'dim7': [C, Eb, Gb, A],
        'Major': [C, E, G],
        'M7': [C, E, G, B],
        '7sus4': [C, F, G, Bb],
        'sus4': [C, F, G],
        'sus2': [C, D, G],
        'Maj7': [C, E, G, B],
        'Madd9': [C, E, G, D],
        'M6': [C, E, G, A],
        'Mb5': [C, E, Gb],
        'M7b5': [C, E, Gb, B],
        'M#5': [C, E, Gs],
        'M7#5': [C, E, Gs, B],
        'M9no5': [C, E, B, D],
        'Madd9b5': [C, E, Gb, D],
        'Maj7b5': [C, E, Gb, B],
        'M7b9no5': [C, E, B, Df],
        'sus4#5b9': [C, F, Gs, Df],
        'sus4add#5': [C, F, Gs],
        'Maddb5': [C, E, Gb],
        'M6add4no5': [C, E, F, A],
        'Maj7/6no5': [C, E, A, B],
        'Maj9no5': [C, E, B, D]
    };
};

// Initialize blobs with random properties
MarchingCubes.prototype.initializeBlobs = function() {
    console.log("Initializing blobs");
    
    // Clear existing blobs
    this.blobs = [];
    
    // Create new blobs
    for (let i = 0; i < this.numBlobs; i++) {
        const blob = {
            px: 0, py: 0, pz: 0, // Position
            vy: 0, // Vertical velocity
            mode: "oscillate", // Movement mode (oscillate or fall)
            oscPhase: Math.random() * 2 * Math.PI, // Oscillation phase
            dx: Math.random() * 2 * Math.PI, // X movement phase
            dy: Math.random() * 2 * Math.PI, // Y movement phase
            dz: Math.random() * 2 * Math.PI, // Z movement phase
            phase: Math.random() * 2 * Math.PI, // Overall phase
            freq: 0.5 + Math.random(), // Movement frequency
            waveform: 'sine', // Default waveform
            synth: null, // Will be assigned if audio is enabled
            _playing: false // Track if synth is playing
        };
        this.blobs.push(blob);
    }
    
    console.log(`Created ${this.blobs.length} blobs`);
    
    // Create debug spheres
    this.createDebugSpheres();
};

// Update number of blobs
MarchingCubes.prototype.updateNumBlobs = function(newNumBlobs) {
    console.log(`Updating number of blobs from ${this.numBlobs} to ${newNumBlobs}`);
    this.numBlobs = newNumBlobs;
    
    // Clean up removed blob synths
    if (this.blobs.length > this.numBlobs) {
        for (let i = this.numBlobs; i < this.blobs.length; i++) {
            const b = this.blobs[i];
            if (b.synth) {
                if (b._playing) {
                    b.synth.triggerRelease && b.synth.triggerRelease();
                    b._playing = false;
                }
                // Fade out gains
                if (b.dryGain) b.dryGain.gain.rampTo(0, 0.3);
                if (b.wetGain) b.wetGain.gain.rampTo(0, 0.3);
                setTimeout(() => {
                    b.synth.volume.value = -Infinity;
                    b.synth.dispose();
                    b.synth = null;
                    if (b.dryGain) b.dryGain.dispose();
                    if (b.wetGain) b.wetGain.dispose();
                    b.dryGain = null;
                    b.wetGain = null;
                }, 350);
            }
        }
    }
    
    // Recreate blobs array
    const oldLength = this.blobs.length;
    const oldBlobs = [...this.blobs];
    this.blobs = [];
    
    // Keep existing blobs up to the new count
    for (let i = 0; i < Math.min(oldLength, this.numBlobs); i++) {
        this.blobs.push(oldBlobs[i]);
    }
    
    // Add new blobs if needed
    for (let i = oldLength; i < this.numBlobs; i++) {
        const blob = {
            px: 0, py: 0, pz: 0,
            vy: 0,
            mode: "oscillate",
            oscPhase: Math.random() * 2 * Math.PI,
            dx: Math.random() * 2 * Math.PI,
            dy: Math.random() * 2 * Math.PI,
            dz: Math.random() * 2 * Math.PI,
            phase: Math.random() * 2 * Math.PI,
            freq: 0.5 + Math.random(),
            waveform: this.blobs.length > 0 ? this.blobs[0].waveform : 'sine',
            synth: null,
            _playing: false
        };
        this.blobs.push(blob);
        
        // Create synth for new blob if audio is initialized
        if (this.enableAudio && this.analyser) {
            this.createBlobSynth(blob);
        }
    }
    
    // Recreate debug spheres
    this.createDebugSpheres();
};

// Update chord selection
MarchingCubes.prototype.updateChord = function(chordName) {
    console.log('Updating chord to:', chordName);
    this.selectedChord = chordName;
};

// Update material type
MarchingCubes.prototype.updateMaterial = function(materialType) {
    console.log('Updating material to:', materialType);
    this.materialType = materialType;
    
    // Create new material based on type
    let material;
    if (materialType === 'plastic') {
        material = this.createPlasticMaterial();
    } else {
        material = new pc.StandardMaterial();
        material.diffuse = new pc.Color(1, 1, 1);
        material.shininess = 80;
        material.metalness = 0.2;
        material.roughness = 0.2;
        material.useLighting = true;
        material.update();
    }
    
    // Update marching cubes mesh material
    if (this.meshEntity && this.meshEntity.render) {
        this.meshEntity.render.material = material;
    }
    
    // Update debug spheres materials
    for (const sphere of this.debugSpheres) {
        if (sphere.render) {
            sphere.render.material = material;
        }
    }
    
    this.material = material;
};

// Create wireframe material for blobs
MarchingCubes.prototype.createPlasticMaterial = function() {
    const mat = new pc.StandardMaterial();
    mat.diffuse = new pc.Color(1, 1, 1); // Bright white
    mat.wireframe = true; // Enable wireframe mode
    mat.opacity = 1.0;    // Fully opaque for wireframe lines
    mat.blendType = pc.BLEND_NONE;
    mat.cull = pc.CULLFACE_NONE; // Don't cull faces in wireframe mode
    mat.emissive = new pc.Color(1, 1, 1);
    mat.emissiveIntensity = 1.0;  // Bright emission for visibility
    mat.shininess = 0;
    mat.metalness = 0;
    mat.roughness = 1;
    mat.useLighting = false; // Disable lighting for pure wireframe look
    mat.update();
    return mat;
};

// Create debug spheres for blob visualization
MarchingCubes.prototype.createDebugSpheres = function() {
    // Remove existing debug spheres
    this.debugSpheres.forEach(sphere => {
        sphere.destroy();
    });
    this.debugSpheres = [];
    
    // Create new debug spheres with wireframe material
    for (let i = 0; i < this.blobs.length; i++) {
        const sphere = new pc.Entity();
        
        // Create wireframe material for debug sphere
        const debugMaterial = new pc.StandardMaterial();
        debugMaterial.diffuse = new pc.Color(1, 1, 1);
        debugMaterial.wireframe = true; // Enable wireframe mode
        debugMaterial.opacity = 1.0;    // Fully opaque for wireframe lines
        debugMaterial.blendType = pc.BLEND_NONE;
        debugMaterial.cull = pc.CULLFACE_NONE; // Don't cull faces in wireframe mode
        debugMaterial.emissive = new pc.Color(1, 1, 1);
        debugMaterial.emissiveIntensity = 1.0;  // Bright emission for visibility
        debugMaterial.shininess = 0;
        debugMaterial.metalness = 0;
        debugMaterial.roughness = 1;
        debugMaterial.useLighting = false; // Disable lighting for pure wireframe look
        debugMaterial.update();
        
        sphere.addComponent('render', {
            type: 'sphere',
            material: debugMaterial,
            castShadows: false,
            receiveShadows: false
        });
        sphere.setLocalScale(0.3, 0.3, 0.3);
        this.marchingCubesContainer.addChild(sphere);
        this.debugSpheres.push(sphere);
    }
    
    console.log(`Created ${this.debugSpheres.length} debug spheres`);
    
    // Hide them if current shape is not 'sphere'
    if (this.shapeType !== 'sphere') {
        this.debugSpheres.forEach(sphere => { sphere.enabled = false; });
    }
};

// Initialize audio system
MarchingCubes.prototype.initializeAudio = function() {
    // Check if Tone.js is available
    if (typeof Tone === 'undefined') {
        console.warn('Tone.js not found. Audio features disabled.');
        return;
    }
    
    console.log('Initializing audio system...');
    
    // Start Tone.js
    Tone.start().then(() => {
        console.log('Tone.js started successfully');
        
        // Create master gain for final output
        this.masterGain = new Tone.Gain(0.8).toDestination();
        
        // Create limiter to prevent clipping
        this.limiter = new Tone.Limiter(-1).connect(this.masterGain);
        
        // Create analyzer for visualization
        this.analyser = new Tone.Analyser("waveform", 256);
        this.analyser.connect(this.limiter);
        
        // Create meter for monitoring levels
        this.meter = new Tone.Meter();
        this.analyser.connect(this.meter);
        
        // Create reverb effect
        this.reverb = new Tone.Reverb({
            decay: 4,
            wet: this.reverbMix,
            preDelay: 0.1
        }).connect(this.analyser);
        
        // Create global delay effect
        this.delay = new Tone.FeedbackDelay(0.3, 0.4).connect(this.reverb);
        
        // Create global filters (fully open by default)
        this.lowpass = new Tone.Filter(20000, 'lowpass').connect(this.delay);
        this.highpass = new Tone.Filter(20, 'highpass').connect(this.lowpass);
        
        // Create synths for each blob
        for (let blob of this.blobs) {
            this.createBlobSynth(blob);
        }
        
        console.log('Audio system initialized with', this.blobs.length, 'synths');
    }).catch(error => {
        console.error('Error starting Tone.js:', error);
    });
};

// Update master volume (in dB)
MarchingCubes.prototype.updateMasterVolume = function(volumeDb) {
    if (this.masterGain) {
        // Convert dB to linear gain
        const gain = Math.pow(10, volumeDb / 20);
        this.masterGain.gain.rampTo(gain, 0.1);
        console.log('Master volume set to:', volumeDb, 'dB (', gain.toFixed(3), 'gain)');
    }
};

// Update reverb mix
MarchingCubes.prototype.updateReverbMix = function(mix) {
    this.reverbMix = mix;
    if (this.reverb) {
        this.reverb.wet.rampTo(mix, 0.1);
        console.log('Reverb mix set to:', mix);
    }
};

// Create a blob's synth and audio routing
MarchingCubes.prototype.createBlobSynth = function(blob) {
    console.log('Creating synth for blob with waveform:', blob.waveform);
    
    try {
        // Create dry and wet gain nodes for each blob
        blob.dryGain = new Tone.Gain(0).connect(this.highpass);
        blob.wetGain = new Tone.Gain(0).connect(this.delay);
        
        // Create synth with blob's waveform and adjusted envelope
        blob.synth = new Tone.Synth({
            oscillator: { type: blob.waveform },
            envelope: {
                attack: 0.005,
                decay: 0.1,
                sustain: 0.3,
                release: 0.1
            },
            volume: -10 // Reduced individual synth volume
        });
        blob.synth.connect(blob.dryGain);
        blob.synth.connect(blob.wetGain);
        blob.synth.volume.value = -Infinity;
        
        // Fade in gains
        blob.dryGain.gain.rampTo(1, 0.3);
        blob.wetGain.gain.rampTo(0, 0.3);
        
        console.log('Synth created successfully');
    } catch (error) {
        console.error('Error creating synth:', error);
    }
};

// Update synth waveform
MarchingCubes.prototype.updateWaveform = function(waveformType) {
    console.log('[MarchingCubes] Updating all synths to waveform:', waveformType);
    
    for (let blob of this.blobs) {
        blob.waveform = waveformType;
        
        if (blob.synth && blob.synth.oscillator) {
            try {
                blob.synth.oscillator.type = waveformType;
                console.log('[MarchingCubes] Updated synth oscillator type to', waveformType);
            } catch (error) {
                console.error('[MarchingCubes] Error updating synth oscillator:', error);
            }
        }
    }
    
    // Also update the shape based on waveform
    this.updateShape(waveformType);
};

// Calculate field value at point (x,y,z) for marching cubes
MarchingCubes.prototype.fieldValue = function(x, y, z, t) {
    // Debug logging (uncomment for testing)
    // if (x === 0 && y === 0 && z === 0) {
    //     console.log('Using shape:', this.shapeType, 'Power:', this.shapePower, 'Scale:', this.shapeScale);
    // }
    
    let sum = 0;
    const sphereRadius = 0.15;
    const floorY = -1.5;
    const minY = floorY + sphereRadius;
    
    // Always use sphere metaball approach
    for (let i = 0; i < this.blobs.length; i++) {
        const b = this.blobs[i];
        const dx = x - b.px;
        const dy = y - b.py;
        const dz = z - b.pz;
        const distSq = dx*dx + dy*dy + dz*dz;
        sum += 1.0 / (distSq + 0.2);
    }
    
    // Add floor contribution
    if (y < 0.1) {
        sum += 10.0 / ((y + 1.5) * (y + 1.5) + 0.1);
    }
    
    return sum;
};

// Update marching cubes mesh
MarchingCubes.prototype.updateMarchingCubes = function(t) {
    // If we have a pending shape update, log it
    if (this._needsUpdate) {
        console.log('[MarchingCubes] Processing mesh update with shape:', this.shapeType);
        this._needsUpdate = false; // Reset the flag
    }
    
    // Physics parameters - used for blob movement
    const gravity = -9.8;
    const bounce = 0.8;
    const dt = 1 / 60;
    const sphereRadius = 0.15;
    const floorY = -1.5;
    const minY = floorY + sphereRadius;
    
    // Update blob positions and physics
    for (let i = 0; i < this.blobs.length; i++) {
        const b = this.blobs[i];
        // Update x and z positions
        b.px = Math.sin(t * b.freq + b.dx + b.phase) * 1.2;
        b.pz = Math.sin(t * b.freq + b.dz + b.phase) * 1.2;
        
        // Handle y position based on mode
        if (b.mode === "oscillate") {
            const oscY = Math.cos(t * b.freq + b.dy + b.phase) * 1.2 + 0.5;
            if (oscY < minY + 0.05) {
                b.mode = "fall";
                b.py = oscY;
                b.vy = -Math.sin(t * b.freq + b.dy + b.phase) * 1.2 * b.freq;
                b.oscPhase = t * b.freq + b.dy + b.phase;
            } else {
                b.py = oscY;
            }
        } else if (b.mode === "fall") {
            // Apply gravity and handle bouncing
            b.vy += gravity * dt;
            b.py += b.vy * dt;
            if (b.py < minY) {
                b.py = minY;
                b.vy = -b.vy * bounce;
                if (Math.abs(b.vy) < 0.5) b.vy += Math.random() * 2;
            }
            if (b.py > minY + 0.05 && Math.abs(b.vy) < 0.2) {
                b.mode = "oscillate";
                b.phase = Math.acos((b.py - 0.5) / 1.2) - t * b.freq - b.dy;
                b.vy = 0;
            }
        }
        
        // Update synth parameters if audio is enabled
        if (this.enableAudio && b.synth) {
            let freq;
            
            // Map x position to frequency or chord notes
            if (this.selectedChord && this.selectedChord !== 'None' && this.CHORDS[this.selectedChord]) {
                // Map x position to chord notes
                const chordNotes = this.CHORDS[this.selectedChord];
                const minX = -1.5, maxX = 1.5;
                const normX = (b.px - minX) / (maxX - minX);
                const idx = normX * (chordNotes.length - 1);
                const lowIdx = Math.floor(idx);
                const highIdx = Math.ceil(idx);
                
                if (lowIdx === highIdx) {
                    freq = chordNotes[lowIdx];
                } else {
                    const frac = idx - lowIdx;
                    freq = chordNotes[lowIdx] * (1 - frac) + chordNotes[highIdx] * frac;
                }
            } else {
                // Linear frequency mapping (A2 to A5)
                const minX = -1.5, maxX = 1.5;
                const minFreq = 110, maxFreq = 880;
                const normX = (b.px - minX) / (maxX - minX);
                freq = minFreq + normX * (maxFreq - minFreq);
            }
            
            // Map y position to amplitude
            const minAmpY = -1.5, maxAmpY = 1.5;
            const normY = (b.py - minAmpY) / (maxAmpY - minAmpY);
            const amp = Math.max(0, Math.min(1, Math.pow(normY, 1.5)));
            
            try {
                // Update synth parameters with smoothing
                b.synth.set({ frequency: freq });
                b.synth.volume.rampTo(Tone.gainToDb(amp * 0.7), 0.05);
                
                // Update delay effect based on floor proximity
                const maxY = 1.5;
                const proximity = Math.max(0, 1 - (b.py - minY) / (maxY - minY));
                if (b.dryGain && b.wetGain) {
                    b.dryGain.gain.rampTo(1 - proximity, 0.05);
                    b.wetGain.gain.rampTo(proximity * 0.5, 0.05);
                }
                
                // Start synth if not playing
                if (!b._playing) {
                    b.synth.triggerAttack(freq);
                    b._playing = true;
                }
            } catch (error) {
                console.error('Error updating synth:', error);
            }
        }
        
        // Update debug sphere position
        if (this.debugSpheres[i]) {
            this.debugSpheres[i].setLocalPosition(b.px, b.py, b.pz);
            
            // Apply sphere styling to debug spheres
            const squash = b.py - minY < 0.05 ? 0.6 : 1.0;
            this.debugSpheres[i].setLocalScale(0.3, 0.3 * squash, 0.3);
            this.debugSpheres[i].setLocalEulerAngles(0, 0, 0);
            
            // Ensure it's a sphere type
            if (this.debugSpheres[i].render && this.debugSpheres[i].render.type !== 'sphere') {
                try {
                    this.debugSpheres[i].render.type = 'sphere';
                } catch (e) {
                    // Sphere type might not be supported
                }
            }
        }
    }
    
    // Generate marching cubes mesh for wireframe spheres
    let vertices = [];
    let indices = [];
    let normals = [];
    let vertCount = 0;
    
    // Use standard marching cubes algorithm for spheres
    for (let i = 0; i < this.resolution; i++) {
        for (let j = 0; j < this.resolution; j++) {
            for (let k = 0; k < this.resolution; k++) {
                const x = (i / (this.resolution - 1) - 0.5) * this.size;
                const y = (j / (this.resolution - 1) - 0.5) * this.size;
                const z = (k / (this.resolution - 1) - 0.5) * this.size;
                const f = this.fieldValue(x, y, z, t);
                
                // Add vertices for surface
                if (f > this.isolation) {
                    vertices.push(x, y, z);
                    
                    // Calculate simple normal (pointing outward from center)
                    const length = Math.sqrt(x*x + y*y + z*z);
                    if (length > 0.0001) {
                        normals.push(x/length, y/length, z/length);
                    } else {
                        normals.push(0, 1, 0); // Default up vector
                    }
                    
                    if (vertCount > 0) {
                        indices.push(vertCount - 1, vertCount);
                    }
                    vertCount++;
                }
            }
        }
    }
    
    // Update mesh if vertices exist
    if (vertices.length > 0) {
        // Clean up any existing mesh to prevent state persistence
        if (this.meshEntity.render && this.meshEntity.render.meshInstances && this.meshEntity.render.meshInstances.length > 0) {
            this.meshEntity.render.meshInstances.forEach(instance => {
                if (instance.mesh) {
                    instance.mesh.destroy();
                }
            });
        }
        
        const mesh = new pc.Mesh(this.app.graphicsDevice);
        
        // Set positions and normals
        mesh.setPositions(vertices);
        mesh.setNormals(normals);
        mesh.setIndices(indices);
        mesh.update();
        
        // Create wireframe material for spheres - use proper wireframe mode
        const material = new pc.StandardMaterial();
        material.diffuse = this.overrideColor ? this.overrideColor.clone() : new pc.Color(1,1,1);
        
        // Set up true wireframe rendering
        material.wireframe = true;  // Enable wireframe mode
        material.opacity = 1.0;     // Fully opaque for wireframe lines
        material.blendType = pc.BLEND_NONE;
        material.cull = pc.CULLFACE_NONE;  // Don't cull faces in wireframe mode
        
        // Make wireframe lines bright and visible
        material.emissive = this.overrideColor ? this.overrideColor.clone() : new pc.Color(1,1,1);
        material.emissiveIntensity = 1.0;  // Bright emission for visibility
        
        // Material properties optimized for wireframe
        material.shininess = 0;
        material.metalness = 0;
        material.roughness = 1;
        material.useLighting = false;  // Disable lighting for pure wireframe look
        
        if(this.overrideColor) {
            console.log('[Wireframe Sphere Material] overrideColor:', this.overrideColor.r.toFixed(2), this.overrideColor.g.toFixed(2), this.overrideColor.b.toFixed(2));
        } else {
            console.log('[Wireframe Sphere Material] overrideColor: undefined');
        }
        material.update();
        
        // Update mesh instance
        if (this.meshEntity.render && this.meshEntity.render.meshInstances && this.meshEntity.render.meshInstances.length > 0) {
            this.meshEntity.render.meshInstances[0].mesh = mesh;
            this.meshEntity.render.meshInstances[0].material = material;
        } else {
            // Create new mesh instance if needed
            const meshInstance = new pc.MeshInstance(mesh, material);
            this.meshEntity.render.meshInstances = [meshInstance];
        }

        // Always show mesh since we're always using wireframe spheres
        this.meshEntity.enabled = true;
    }
};

// Helper to add a cube mesh to the vertices/indices arrays
MarchingCubes.prototype.addCubeMesh = function(x, y, z, size, vertices, indices, normals, startIndex) {
    // Simple solid cube with no duplicated vertices
    const cubeSize = size * 0.8; // Reduced size for cleaner appearance
    
    // Half size for convenience
    const hs = cubeSize / 2;
    
    // Define the 8 unique vertices of the cube
    const cubeVertices = [
        [x-hs, y-hs, z-hs], // 0: bottom-left-back
        [x+hs, y-hs, z-hs], // 1: bottom-right-back
        [x+hs, y+hs, z-hs], // 2: top-right-back
        [x-hs, y+hs, z-hs], // 3: top-left-back
        [x-hs, y-hs, z+hs], // 4: bottom-left-front
        [x+hs, y-hs, z+hs], // 5: bottom-right-front
        [x+hs, y+hs, z+hs], // 6: top-right-front
        [x-hs, y+hs, z+hs]  // 7: top-left-front
    ];
    
    // Store the original vertex count
    const baseIndex = startIndex;
    
    // Add all 8 vertices
    for (let i = 0; i < cubeVertices.length; i++) {
        const v = cubeVertices[i];
        vertices.push(v[0], v[1], v[2]);
        
        // Add placeholder normal (will be set correctly below)
        normals.push(0, 0, 0);
        
        startIndex++;
    }
    
    // Define the 6 faces of the cube using the vertex indices
    const cubeFaces = [
        // Face, Normal
        [[0,1,2,3], [0,0,-1]], // back face (-z)
        [[4,7,6,5], [0,0,1]],  // front face (+z)
        [[0,3,7,4], [-1,0,0]], // left face (-x)
        [[1,5,6,2], [1,0,0]],  // right face (+x)
        [[3,2,6,7], [0,1,0]],  // top face (+y)
        [[0,4,5,1], [0,-1,0]]  // bottom face (-y)
    ];
    
    // For each face, add the triangles and set normals
    for (let i = 0; i < cubeFaces.length; i++) {
        const faceIndices = cubeFaces[i][0];
        const normal = cubeFaces[i][1];
        
        // Set the normal for each vertex used in this face
        for (let j = 0; j < faceIndices.length; j++) {
            const vertIndex = baseIndex + faceIndices[j];
            normals[vertIndex*3] = normal[0];
            normals[vertIndex*3+1] = normal[1];
            normals[vertIndex*3+2] = normal[2];
        }
        
        // First triangle (0,1,2)
        indices.push(
            baseIndex + faceIndices[0],
            baseIndex + faceIndices[1],
            baseIndex + faceIndices[2]
        );
        
        // Second triangle (0,2,3)
        indices.push(
            baseIndex + faceIndices[0],
            baseIndex + faceIndices[2],
            baseIndex + faceIndices[3]
        );
    }
    
    // Return the updated startIndex
    return startIndex;
};

// Helper to add a pyramid mesh to the vertices/indices arrays
MarchingCubes.prototype.addPyramidMesh = function(x, y, z, baseSize, height, vertices, indices, normals, startIndex) {
    // Simple pyramid with single apex and square base
    const baseHalf = baseSize * 0.5;
    const top = y + height * 0.8; // Apex
    const bottom = y - height * 0.2; // Base center
    
    // Define the 5 unique vertices
    const pyramidVertices = [
        [x, top, z],              // 0: apex
        [x-baseHalf, bottom, z-baseHalf], // 1: base SW
        [x+baseHalf, bottom, z-baseHalf], // 2: base SE 
        [x+baseHalf, bottom, z+baseHalf], // 3: base NE
        [x-baseHalf, bottom, z+baseHalf]  // 4: base NW
    ];
    
    // Store the base index
    const baseIndex = startIndex;
    
    // Add all 5 vertices
    for (let i = 0; i < pyramidVertices.length; i++) {
        const v = pyramidVertices[i];
        vertices.push(v[0], v[1], v[2]);
        
        // Add placeholder normal
        normals.push(0, 0, 0);
        
        startIndex++;
    }
    
    // Define triangular faces and their normals
    // Each face stores: [vertexIndices, normalVector]
    const faces = [
        // Base (facing down)
        [[1, 3, 2], [0, -1, 0]], // Base triangle 1
        [[1, 4, 3], [0, -1, 0]], // Base triangle 2
        
        // Side faces
        [[0, 1, 2], this.calculateNormal(pyramidVertices[0], pyramidVertices[1], pyramidVertices[2])], // Front face
        [[0, 2, 3], this.calculateNormal(pyramidVertices[0], pyramidVertices[2], pyramidVertices[3])], // Right face
        [[0, 3, 4], this.calculateNormal(pyramidVertices[0], pyramidVertices[3], pyramidVertices[4])], // Back face
        [[0, 4, 1], this.calculateNormal(pyramidVertices[0], pyramidVertices[4], pyramidVertices[1])]  // Left face
    ];
    
    // Add triangles and set normals
    for (const [faceIndices, normal] of faces) {
        // Set the normal for each vertex in this face
        for (let i = 0; i < faceIndices.length; i++) {
            const vertIndex = baseIndex + faceIndices[i];
            normals[vertIndex*3] = normal[0];
            normals[vertIndex*3+1] = normal[1];
            normals[vertIndex*3+2] = normal[2];
        }
        
        // Add the triangle
        indices.push(
            baseIndex + faceIndices[0],
            baseIndex + faceIndices[1],
            baseIndex + faceIndices[2]
        );
    }
    
    return startIndex;
};

// Helper function to calculate normal vector for a triangle
MarchingCubes.prototype.calculateNormal = function(p1, p2, p3) {
    // Calculate vectors from points
    const v1 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
    const v2 = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];
    
    // Cross product
    const nx = v1[1] * v2[2] - v1[2] * v2[1];
    const ny = v1[2] * v2[0] - v1[0] * v2[2];
    const nz = v1[0] * v2[1] - v1[1] * v2[0];
    
    // Normalize
    const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
    return [nx/len, ny/len, nz/len];
};

// Helper to add a diamond/rhombus mesh to the vertices/indices arrays
MarchingCubes.prototype.addDiamondMesh = function(x, y, z, size, vertices, indices, normals, startIndex) {
    // Create a solid octahedron (diamond)
    const diamondSize = size * 0.9; // Slightly smaller for cleaner appearance
    const hs = diamondSize / 2;
    
    // Define the 6 unique vertices of the octahedron
    const diamondVertices = [
        [x, y+hs, z],     // 0: top point
        [x, y-hs, z],     // 1: bottom point
        [x+hs, y, z],     // 2: right point
        [x-hs, y, z],     // 3: left point
        [x, y, z+hs],     // 4: front point
        [x, y, z-hs]      // 5: back point
    ];
    
    // Store the base index
    const baseIndex = startIndex;
    
    // Add all 6 vertices
    for (let i = 0; i < diamondVertices.length; i++) {
        const v = diamondVertices[i];
        vertices.push(v[0], v[1], v[2]);
        
        // Add placeholder normal
        normals.push(0, 0, 0);
        
        startIndex++;
    }
    
    // Define the 8 triangular faces of the octahedron with their normals
    const faces = [
        // Top pyramid faces
        [[0, 2, 4], this.calculateNormal(diamondVertices[0], diamondVertices[2], diamondVertices[4])],
        [[0, 4, 3], this.calculateNormal(diamondVertices[0], diamondVertices[4], diamondVertices[3])],
        [[0, 3, 5], this.calculateNormal(diamondVertices[0], diamondVertices[3], diamondVertices[5])],
        [[0, 5, 2], this.calculateNormal(diamondVertices[0], diamondVertices[5], diamondVertices[2])],
        
        // Bottom pyramid faces
        [[1, 4, 2], this.calculateNormal(diamondVertices[1], diamondVertices[4], diamondVertices[2])],
        [[1, 3, 4], this.calculateNormal(diamondVertices[1], diamondVertices[3], diamondVertices[4])],
        [[1, 5, 3], this.calculateNormal(diamondVertices[1], diamondVertices[5], diamondVertices[3])],
        [[1, 2, 5], this.calculateNormal(diamondVertices[1], diamondVertices[2], diamondVertices[5])]
    ];
    
    // Add triangles and set normals
    for (const [faceIndices, normal] of faces) {
        // Set the normal for each vertex in this face
        for (let i = 0; i < faceIndices.length; i++) {
            const vertIndex = baseIndex + faceIndices[i];
            normals[vertIndex*3] = normal[0];
            normals[vertIndex*3+1] = normal[1];
            normals[vertIndex*3+2] = normal[2];
        }
        
        // Add the triangle
        indices.push(
            baseIndex + faceIndices[0],
            baseIndex + faceIndices[1],
            baseIndex + faceIndices[2]
        );
    }
    
    return startIndex;
};

// Update code called every frame
MarchingCubes.prototype.update = function(dt) {
    // Update time
    this.time += dt * this.speed;
    
    // Update marching cubes
    this.updateMarchingCubes(this.time);
    
    // Rotate container
    this.marchingCubesContainer.setEulerAngles(0, this.time * 10, 0);
};

// Update shape based on waveform type
MarchingCubes.prototype.updateShape = function(waveformType) {
    console.log('[MarchingCubes] updateShape called with waveform:', waveformType);
    
    // Ensure this is a string to avoid errors
    if (typeof waveformType !== 'string') {
        console.warn('[MarchingCubes] updateShape received non-string waveform:', waveformType);
        waveformType = String(waveformType);
    }
    
    // Store the previous shape for comparison
    const previousShape = this.shapeType;
    
    // FORCE ALL SHAPES TO BE SPHERES - ignore waveform type
    const shapeType = 'sphere';
    const shapePower = 2.0;
    const shapeScale = 1.0;
    const shapeOffset = 0.0;
    
    console.log('[MarchingCubes] FORCING sphere shape regardless of waveform');
    
    // Store the original resolution if we don't have it yet
    if (!this._originalResolution) {
        this._originalResolution = this.resolution;
    }
    
    // Use original resolution for spheres
    this.resolution = this._originalResolution;
    
    // Set ALL the properties that could affect shapes
    this.shapeType = shapeType;
    this.shapePower = shapePower;
    this.shapeScale = shapeScale;
    this.shapeOffset = shapeOffset;
    
    // Show debug spheres for sphere shape
    const showDebug = true; // Always show since we're always spheres
    this.debugSpheres.forEach(s => { s.enabled = showDebug; });
    
    // Update each blob's waveform to match (for audio)
    for (let i = 0; i < this.blobs.length; i++) {
        this.blobs[i].waveform = waveformType;
    }
    
    // CRITICAL: Clean up any existing mesh to prevent shape inheritance
    if (this.meshEntity && this.meshEntity.render) {
        if (this.meshEntity.render.meshInstances && this.meshEntity.render.meshInstances.length > 0) {
            // Clear existing mesh
            this.meshEntity.render.meshInstances = [];
        }
    }
    
    // Force regenerate mesh
    this._needsUpdate = true;
    
    // Update color to ensure it's applied to the new shape
    if (this.overrideColor) {
        this.updateColors(this.overrideColor.r, this.overrideColor.g, this.overrideColor.b);
    }
    
    console.log(`[MarchingCubes] Shape forced to: ${shapeType} (power: ${shapePower}, scale: ${shapeScale}, offset: ${shapeOffset})`);
    console.log(`[MarchingCubes] Updated all ${this.blobs.length} blobs to waveform: ${waveformType} (for audio only)`);
    console.log(`[MarchingCubes] Resolution set to: ${this.resolution}`);
    
    // Force another update at the next frame
    if (previousShape !== shapeType) {
        // Queue up a force update after a short delay to ensure the changes take effect
        setTimeout(() => {
            this._needsUpdate = true; 
            console.log('[MarchingCubes] Forced refresh of shape after delay');
            
            // Force an immediate render update
            this.updateMarchingCubes(this.time);
        }, 100);
        
        // Also try immediate update now
        this.updateMarchingCubes(this.time);
    }
};

// Update material colours from UI
MarchingCubes.prototype.updateColors = function(r,g,b){
    // Store the new color 
    this.overrideColor = new pc.Color(r,g,b);
    
    // Apply to mesh material
    if(this.meshEntity && this.meshEntity.render && this.meshEntity.render.meshInstances) {
        for(let i=0; i < this.meshEntity.render.meshInstances.length; i++) {
            const instance = this.meshEntity.render.meshInstances[i];
            if(instance && instance.material) {
                // Use setDiffuse which properly updates
                instance.material.diffuse.copy(this.overrideColor);
                
                // Skip emissive
                // instance.material.emissive.set(r*0.3, g*0.3, b*0.3);
                
                instance.material.update();
            }
        }
    }
    
    console.log(`[MarchingCubes] Updated color: R=${r.toFixed(2)} G=${g.toFixed(2)} B=${b.toFixed(2)}`);
}; 