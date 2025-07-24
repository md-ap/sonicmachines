var EulerTopologySimulation = pc.createScript('eulerTopologySimulation');

// Add script attributes for editor configuration
EulerTopologySimulation.attributes.add('maxParticles', { type: 'number', default: 1000, title: 'Max Particles' });
EulerTopologySimulation.attributes.add('particleCount', { type: 'number', default: 500, title: 'Active Particles' });
EulerTopologySimulation.attributes.add('boxSize', { type: 'number', default: 16, title: 'Box Size' });
EulerTopologySimulation.attributes.add('minDistance', { type: 'number', default: 2.5, title: 'Connection Distance' });
EulerTopologySimulation.attributes.add('maxConnections', { type: 'number', default: 10, title: 'Max Connections' });
EulerTopologySimulation.attributes.add('showDots', { type: 'boolean', default: true, title: 'Show Particles' });
EulerTopologySimulation.attributes.add('showLines', { type: 'boolean', default: true, title: 'Show Connections' });

// Load Roboto font from Google Fonts
EulerTopologySimulation.prototype.loadRobotoFont = function() {
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

// Initialize code called once per entity
EulerTopologySimulation.prototype.initialize = function() {
    console.log("Euler Topology Simulation initialized");
    
    // Load Roboto font from Google Fonts
    this.loadRobotoFont();
    
    // Check if we should run (only when euler mode is active)
    const appManager = this.app.root.findByName('AppManager');
    if (appManager && appManager.script && appManager.script.AppManager) {
        const currentMode = appManager.script.AppManager.currentMode;
        if (currentMode !== 'euler') {
            console.log("Euler simulation disabled - not in euler mode");
            return;
        }
    }
    
    // Store device for rendering
    this.device = this.app.graphicsDevice;
    
    // System state
    this.frameCounter = 0;
    this.lastTime = performance.now();
    this.dt = 0;
    
    // Particle system parameters
    this.maxParticleCount = this.maxParticles;
    this.activeParticleCount = this.particleCount;
    this.boundingBoxSize = this.boxSize;
    this.connectionDistance = this.minDistance;
    this.maxConnectionsPerParticle = this.maxConnections;
    
    // Particle system data
    this.particles = [];
    this.positions = new Float32Array(this.maxParticleCount * 3);
    this.particleConnections = new Map();
    this.currentTriangles = new Set();
    this.previousTriangles = new Set();
    
    // Network analysis state
    this.networkState = {
        triangleDensity: 0,
        averageArea: 0,
        networkComplexity: 0,
        spatialDistribution: 0,
        particleVelocity: 0,
        connectionDensity: 0,
        spatialCoherence: 0
    };
    
    // Triangle detection
    this.triangleDetectionInterval = 5;
    this.maxTriangles = 1000;
    this.previousTriangleAreas = {};
    
    // Initialize particle system
    this.setupParticleSystem();
    
    // Create meshes for rendering
    this.createMeshes();
    
    // Create terminal for messages
    // this.createTerminalUI(); // Removed debug terminal
    
    // Create stats display
    this.createStatsDisplay();
    
    // Create title element
    this.createTitleElement();
    
    // Create bounding box wireframe
    this.createBoundingBox();
    
    console.log("Euler Topology setup complete with", this.maxParticleCount, "max particles");
};

// Setup particle system
EulerTopologySimulation.prototype.setupParticleSystem = function() {
    // Initialize particles
    for (let i = 0; i < this.maxParticleCount; i++) {
        const particle = {
            pos: new pc.Vec3(
                Math.random() * this.boundingBoxSize - this.boundingBoxSize / 2,
                Math.random() * this.boundingBoxSize - this.boundingBoxSize / 2,
                Math.random() * this.boundingBoxSize - this.boundingBoxSize / 2
            ),
            velocity: new pc.Vec3(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            ),
            connections: 0
        };
        this.particles.push(particle);
        
        // Initialize position buffer
        this.positions[i * 3] = particle.pos.x;
        this.positions[i * 3 + 1] = particle.pos.y;
        this.positions[i * 3 + 2] = particle.pos.z;
    }
    
    console.log("Particle system initialized with", this.maxParticleCount, "particles");
};

// Create meshes for rendering
EulerTopologySimulation.prototype.createMeshes = function() {
    try {
        // Create particle mesh (points)
        this.createParticleMesh();
        
        // Create connection mesh (lines)
        this.createConnectionMesh();
        
        console.log("Meshes created successfully");
    } catch (error) {
        console.error("Error creating meshes:", error);
        throw error;
    }
};

// Create particle mesh for rendering points
EulerTopologySimulation.prototype.createParticleMesh = function() {
    // Create entity for particles
    this.particleEntity = new pc.Entity('ParticleSystem');
    this.entity.addChild(this.particleEntity);
    
    // Add render component
    this.particleEntity.addComponent('render', {
        type: 'asset',
        castShadows: false,
        receiveShadows: false
    });
    
    // Create vertex format for particles
    const particleVertexFormat = new pc.VertexFormat(this.device, [
        { semantic: pc.SEMANTIC_POSITION, components: 3, type: pc.TYPE_FLOAT32 },
        { semantic: pc.SEMANTIC_NORMAL, components: 3, type: pc.TYPE_FLOAT32 },
        { semantic: pc.SEMANTIC_TEXCOORD0, components: 2, type: pc.TYPE_FLOAT32 }
    ]);
    
    // Create initial vertex data for particles
    const particleVertexData = new Float32Array(this.maxParticleCount * 8); // 3 pos + 3 normal + 2 uv
    for (let i = 0; i < this.maxParticleCount; i++) {
        const vertexIndex = i * 8;
        const posIndex = i * 3;
        
        // Position
        particleVertexData[vertexIndex] = this.positions[posIndex];
        particleVertexData[vertexIndex + 1] = this.positions[posIndex + 1];
        particleVertexData[vertexIndex + 2] = this.positions[posIndex + 2];
        
        // Normal (pointing up)
        particleVertexData[vertexIndex + 3] = 0;
        particleVertexData[vertexIndex + 4] = 1;
        particleVertexData[vertexIndex + 5] = 0;
        
        // UV
        particleVertexData[vertexIndex + 6] = (i % 100) / 99;
        particleVertexData[vertexIndex + 7] = Math.floor(i / 100) / 99;
    }
    
    // Create vertex buffer
    this.particleVertexBuffer = new pc.VertexBuffer(this.device, particleVertexFormat, this.maxParticleCount);
    this.particleVertexBuffer.setData(particleVertexData);
    
    // Create mesh
    this.particleMesh = new pc.Mesh(this.device);
    this.particleMesh.primitive[0].type = pc.PRIMITIVE_POINTS;
    this.particleMesh.primitive[0].base = 0;
    this.particleMesh.primitive[0].count = this.activeParticleCount;
    this.particleMesh.vertexBuffer = this.particleVertexBuffer;
    
    // Create material
    this.particleMaterial = new pc.StandardMaterial();
    this.particleMaterial.diffuse = new pc.Color(1, 1, 1);
    this.particleMaterial.emissive = new pc.Color(1, 1, 1);
    this.particleMaterial.emissiveIntensity = 1.0;
    this.particleMaterial.blendType = pc.BLEND_ADDITIVE;
    this.particleMaterial.depthWrite = false;
    this.particleMaterial.update();
    
    // Create mesh instance
    this.particleMeshInstance = new pc.MeshInstance(this.particleMesh, this.particleMaterial);
    this.particleEntity.render.meshInstances = [this.particleMeshInstance];
};

// Create connection mesh for rendering lines
EulerTopologySimulation.prototype.createConnectionMesh = function() {
    // Create entity for connections
    this.connectionEntity = new pc.Entity('ConnectionSystem');
    this.entity.addChild(this.connectionEntity);
    
    // Create vertex format for lines (position + normal for StandardMaterial)
    const lineVertexFormat = new pc.VertexFormat(this.device, [
        { semantic: pc.SEMANTIC_POSITION, components: 3, type: pc.TYPE_FLOAT32 },
        { semantic: pc.SEMANTIC_NORMAL, components: 3, type: pc.TYPE_FLOAT32 }
    ]);
    
    // Calculate max possible connections more accurately
    // Each particle can have maxConnections, but connections are bidirectional
    // So max unique connections = (particles * maxConnections) / 2
    const maxConnections = Math.floor((this.maxParticleCount * this.maxConnectionsPerParticle) / 2);
    const maxLineVertices = maxConnections * 2; // 2 vertices per line
    
    // Store max values for buffer management
    this.maxLineVertices = maxLineVertices;
    this.maxConnections = maxConnections;
    
    // Create vertex buffer with exact calculated size
    this.lineVertexBuffer = new pc.VertexBuffer(this.device, lineVertexFormat, maxLineVertices);
    
    // Create mesh
    this.lineMesh = new pc.Mesh(this.device);
    this.lineMesh.vertexBuffer = this.lineVertexBuffer;
    this.lineMesh.primitive[0] = { 
        type: pc.PRIMITIVE_LINES, 
        base: 0, 
        count: 0, 
        indexed: false 
    };
    
    // Create material (standard material configured for lines)
    this.lineMaterial = new pc.StandardMaterial();
    this.lineMaterial.diffuse = new pc.Color(0.7, 0.7, 1);
    this.lineMaterial.emissive = new pc.Color(0.7, 0.7, 1);
    this.lineMaterial.emissiveIntensity = 0.7;
    this.lineMaterial.blendType = pc.BLEND_ADDITIVE;
    this.lineMaterial.opacity = 0.7;
    this.lineMaterial.depthWrite = false;
    this.lineMaterial.useLighting = false; // Disable lighting for lines
    this.lineMaterial.update();
    
    // Create mesh instance
    this.lineMeshInstance = new pc.MeshInstance(this.lineMesh, this.lineMaterial);
    
    // Add render component
    this.connectionEntity.addComponent('render', {
        meshInstances: [this.lineMeshInstance],
        castShadows: false,
        receiveShadows: false
    });
    
    // Initialize line positions array with exact size (position + normal = 6 floats per vertex)
    this.linePositions = new Float32Array(maxLineVertices * 6);
    
    console.log(`Line rendering setup: ${maxConnections} max connections, ${maxLineVertices} max vertices, ${maxLineVertices * 6 * 4} bytes`);
};

// Update particle positions and physics
EulerTopologySimulation.prototype.updateParticles = function(dt) {
    // Move particles and apply boundary reflection
    for (let i = 0; i < this.activeParticleCount; i++) {
        const particle = this.particles[i];
        
        // Update position
        particle.pos.x += particle.velocity.x * dt * 2;
        particle.pos.y += particle.velocity.y * dt * 2;
        particle.pos.z += particle.velocity.z * dt * 2;
        
        // Boundary reflection
        const halfBox = this.boundingBoxSize / 2;
        if (particle.pos.x < -halfBox || particle.pos.x > halfBox) {
            particle.velocity.x *= -1;
            particle.pos.x = Math.max(Math.min(particle.pos.x, halfBox), -halfBox);
        }
        if (particle.pos.y < -halfBox || particle.pos.y > halfBox) {
            particle.velocity.y *= -1;
            particle.pos.y = Math.max(Math.min(particle.pos.y, halfBox), -halfBox);
        }
        if (particle.pos.z < -halfBox || particle.pos.z > halfBox) {
            particle.velocity.z *= -1;
            particle.pos.z = Math.max(Math.min(particle.pos.z, halfBox), -halfBox);
        }
        
        // Update position buffer
        this.positions[i * 3] = particle.pos.x;
        this.positions[i * 3 + 1] = particle.pos.y;
        this.positions[i * 3 + 2] = particle.pos.z;
        
        // Reset connections count
        particle.connections = 0;
    }
};

// Update connections between particles
EulerTopologySimulation.prototype.updateConnections = function() {
    let lineCount = 0;
    this.particleConnections.clear();
    
    // Find connections between particles
    for (let i = 0; i < this.activeParticleCount; i++) {
        const particleA = this.particles[i];
        if (particleA.connections >= this.maxConnectionsPerParticle) continue;
        
        for (let j = i + 1; j < this.activeParticleCount; j++) {
            const particleB = this.particles[j];
            if (particleB.connections >= this.maxConnectionsPerParticle) continue;
            
            // Check if we've reached max connections limit
            if (lineCount >= this.maxConnections) break;
            
            // Calculate distance
            const dx = particleA.pos.x - particleB.pos.x;
            const dy = particleA.pos.y - particleB.pos.y;
            const dz = particleA.pos.z - particleB.pos.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            if (distance < this.connectionDistance) {
                // Add connection
                particleA.connections++;
                particleB.connections++;
                
                // Store connection for triangle detection
                if (!this.particleConnections.has(i)) {
                    this.particleConnections.set(i, new Set());
                }
                this.particleConnections.get(i).add(j);
                
                // Add line segment to buffer - ensure we don't exceed buffer size
                const lineIndex = lineCount * 12; // 2 vertices * 6 floats each (position + normal)
                
                if (lineIndex + 11 < this.linePositions.length) {
                    // Calculate line direction for normal
                    const dx = particleB.pos.x - particleA.pos.x;
                    const dy = particleB.pos.y - particleA.pos.y;
                    const dz = particleB.pos.z - particleA.pos.z;
                    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    const nx = length > 0 ? dx / length : 0;
                    const ny = length > 0 ? dy / length : 0;
                    const nz = length > 0 ? dz / length : 0;
                    
                    // First vertex (particleA) - position + normal
                    this.linePositions[lineIndex] = particleA.pos.x;
                    this.linePositions[lineIndex + 1] = particleA.pos.y;
                    this.linePositions[lineIndex + 2] = particleA.pos.z;
                    this.linePositions[lineIndex + 3] = nx;
                    this.linePositions[lineIndex + 4] = ny;
                    this.linePositions[lineIndex + 5] = nz;
                    
                    // Second vertex (particleB) - position + normal
                    this.linePositions[lineIndex + 6] = particleB.pos.x;
                    this.linePositions[lineIndex + 7] = particleB.pos.y;
                    this.linePositions[lineIndex + 8] = particleB.pos.z;
                    this.linePositions[lineIndex + 9] = nx;
                    this.linePositions[lineIndex + 10] = ny;
                    this.linePositions[lineIndex + 11] = nz;
                    
                    lineCount++;
                } else {
                    // Buffer full, stop adding connections
                    console.warn("Line buffer full, stopping connection creation");
                    break;
                }
                
                if (particleA.connections >= this.maxConnectionsPerParticle) break;
            }
        }
        
        // Break outer loop if we've reached max connections
        if (lineCount >= this.maxConnections) break;
    }
    
    return lineCount;
};

// Find triangles in the particle network
EulerTopologySimulation.prototype.findTriangles = function() {
    const triangles = new Set();
    
    // Only process if we have enough particles
    if (this.activeParticleCount < 3) return triangles;
    
    // Find triangles between connected particles
    for (const [i, connections] of this.particleConnections) {
        const connectedParticles = Array.from(connections);
        
        for (let j = 0; j < connectedParticles.length - 1; j++) {
            const p2Index = connectedParticles[j];
            const p2Connections = this.particleConnections.get(p2Index);
            if (!p2Connections) continue;
            
            for (let k = j + 1; k < connectedParticles.length; k++) {
                const p3Index = connectedParticles[k];
                if (!p2Connections.has(p3Index)) continue;
                
                const area = this.calculateTriangleArea(i, p2Index, p3Index);
                if (isNaN(area) || area < 0.01) continue;
                
                const center = this.calculateTriangleCenter(i, p2Index, p3Index);
                triangles.add({
                    id: this.getTriangleId(i, p2Index, p3Index),
                    particles: [i, p2Index, p3Index],
                    center: center,
                    area: area,
                    timestamp: Date.now()
                });
            }
        }
    }
    
    return triangles;
};

// Calculate triangle area
EulerTopologySimulation.prototype.calculateTriangleArea = function(p1Index, p2Index, p3Index) {
    const p1 = this.particles[p1Index].pos;
    const p2 = this.particles[p2Index].pos;
    const p3 = this.particles[p3Index].pos;
    
    // Using cross product to calculate area
    const v1 = new pc.Vec3(p2.x - p1.x, p2.y - p1.y, p2.z - p1.z);
    const v2 = new pc.Vec3(p3.x - p1.x, p3.y - p1.y, p3.z - p1.z);
    
    const cross = new pc.Vec3();
    cross.cross(v1, v2);
    
    return cross.length() * 0.5;
};

// Calculate triangle center
EulerTopologySimulation.prototype.calculateTriangleCenter = function(p1Index, p2Index, p3Index) {
    const p1 = this.particles[p1Index].pos;
    const p2 = this.particles[p2Index].pos;
    const p3 = this.particles[p3Index].pos;
    
    return new pc.Vec3(
        (p1.x + p2.x + p3.x) / 3,
        (p1.y + p2.y + p3.y) / 3,
        (p1.z + p2.z + p3.z) / 3
    );
};

// Get unique triangle ID
EulerTopologySimulation.prototype.getTriangleId = function(p1Index, p2Index, p3Index) {
    const sorted = [p1Index, p2Index, p3Index].sort((a, b) => a - b);
    return `${sorted[0]}-${sorted[1]}-${sorted[2]}`;
};

// Calculate network analysis metrics
EulerTopologySimulation.prototype.calculateNetworkMetrics = function() {
    // Triangle density
    const triangleDensity = this.currentTriangles.size / Math.max(1, this.activeParticleCount);
    
    // Average triangle area
    let totalArea = 0;
    for (const triangle of this.currentTriangles) {
        totalArea += triangle.area;
    }
    const averageArea = this.currentTriangles.size > 0 ? totalArea / this.currentTriangles.size : 0;
    
    // Network complexity (connections per particle)
    let totalConnections = 0;
    for (let i = 0; i < this.activeParticleCount; i++) {
        totalConnections += this.particles[i].connections;
    }
    const networkComplexity = totalConnections / Math.max(1, this.activeParticleCount * this.maxConnectionsPerParticle);
    
    // Spatial distribution (spread of particles)
    let centerX = 0, centerY = 0, centerZ = 0;
    for (let i = 0; i < this.activeParticleCount; i++) {
        centerX += this.particles[i].pos.x;
        centerY += this.particles[i].pos.y;
        centerZ += this.particles[i].pos.z;
    }
    centerX /= this.activeParticleCount;
    centerY /= this.activeParticleCount;
    centerZ /= this.activeParticleCount;
    
    let totalDistance = 0;
    for (let i = 0; i < this.activeParticleCount; i++) {
        const particle = this.particles[i];
        const dx = particle.pos.x - centerX;
        const dy = particle.pos.y - centerY;
        const dz = particle.pos.z - centerZ;
        totalDistance += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    const spatialDistribution = totalDistance / Math.max(1, this.activeParticleCount * this.boundingBoxSize);
    
    // Average particle velocity
    let totalVelocity = 0;
    for (let i = 0; i < this.activeParticleCount; i++) {
        const vel = this.particles[i].velocity;
        totalVelocity += Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
    }
    const particleVelocity = totalVelocity / Math.max(1, this.activeParticleCount);
    
    // Connection density
    const connectionDensity = totalConnections / Math.max(1, this.activeParticleCount * (this.activeParticleCount - 1) / 2);
    
    // Spatial coherence (how clustered the connections are)
    let coherenceSum = 0;
    let coherenceCount = 0;
    for (const [i, connections] of this.particleConnections) {
        for (const j of connections) {
            const distance = this.particles[i].pos.distance(this.particles[j].pos);
            coherenceSum += 1 / (1 + distance);
            coherenceCount++;
        }
    }
    const spatialCoherence = coherenceCount > 0 ? coherenceSum / coherenceCount : 0;
    
    // Update network state
    this.networkState = {
        triangleDensity: triangleDensity,
        averageArea: averageArea,
        networkComplexity: networkComplexity,
        spatialDistribution: spatialDistribution,
        particleVelocity: particleVelocity,
        connectionDensity: connectionDensity,
        spatialCoherence: spatialCoherence
    };
};

// Update vertex buffers
EulerTopologySimulation.prototype.updateVertexBuffers = function(lineCount) {
    // Update particle vertex buffer
    if (this.particleVertexBuffer) {
        const particleVertexData = new Float32Array(this.maxParticleCount * 8);
        for (let i = 0; i < this.activeParticleCount; i++) {
            const vertexIndex = i * 8;
            const posIndex = i * 3;
            
            // Position
            particleVertexData[vertexIndex] = this.positions[posIndex];
            particleVertexData[vertexIndex + 1] = this.positions[posIndex + 1];
            particleVertexData[vertexIndex + 2] = this.positions[posIndex + 2];
            
            // Normal
            particleVertexData[vertexIndex + 3] = 0;
            particleVertexData[vertexIndex + 4] = 1;
            particleVertexData[vertexIndex + 5] = 0;
            
            // UV
            particleVertexData[vertexIndex + 6] = (i % 100) / 99;
            particleVertexData[vertexIndex + 7] = Math.floor(i / 100) / 99;
        }
        
        this.particleVertexBuffer.setData(particleVertexData);
        this.particleMesh.primitive[0].count = this.activeParticleCount;
    }
    
    // Update line vertex buffer with proper size checking
    if (this.lineVertexBuffer && lineCount > 0) {
        const lineVertexCount = lineCount * 2; // 2 vertices per line
        const dataSize = lineCount * 12; // 2 vertices * 6 floats each (position + normal)
        const expectedBufferSize = this.maxLineVertices * 6 * 4; // bytes
        const actualDataSize = dataSize * 4; // bytes
        
        // Ensure we don't exceed buffer capacity
        if (lineVertexCount <= this.maxLineVertices && dataSize <= this.linePositions.length) {
            try {
                // Create properly sized data array
                const lineData = new Float32Array(this.maxLineVertices * 6);
                lineData.set(this.linePositions.subarray(0, dataSize));
                
                this.lineVertexBuffer.setData(lineData);
                this.lineMesh.primitive[0].count = lineVertexCount;
            } catch (error) {
                console.error("Error updating line vertex buffer:", error);
                this.lineMesh.primitive[0].count = 0;
            }
        } else {
            console.warn(`Line buffer overflow: ${lineVertexCount} vertices > ${this.maxLineVertices} max`);
            this.lineMesh.primitive[0].count = 0;
        }
    } else if (this.lineMesh) {
        this.lineMesh.primitive[0].count = 0;
    }
};

// Create terminal UI for messages
EulerTopologySimulation.prototype.createTerminalUI = function() {
    this.terminal = document.createElement('div');
    this.terminal.style.position = 'fixed';
    this.terminal.style.left = '20px';
    this.terminal.style.bottom = '20px';
    this.terminal.style.width = '400px';
    this.terminal.style.height = '120px';
    this.terminal.style.background = 'rgba(0, 0, 0, 0.8)';
    this.terminal.style.color = '#0f0';
    this.terminal.style.fontFamily = "'Roboto', sans-serif";
    this.terminal.style.fontSize = '12px';
    this.terminal.style.padding = '10px';
    this.terminal.style.borderRadius = '5px';
    this.terminal.style.overflow = 'auto';
    this.terminal.style.zIndex = '1000';
    document.body.appendChild(this.terminal);
};

// Update terminal with messages
EulerTopologySimulation.prototype.updateTerminal = function(message) {
    if (this.terminal) {
        const timestamp = new Date().toLocaleTimeString();
        this.terminal.innerHTML += `[${timestamp}] ${message}<br>`;
        this.terminal.scrollTop = this.terminal.scrollHeight;
    }
};

// Create stats display
EulerTopologySimulation.prototype.createStatsDisplay = function() {
    this.statsDisplay = document.createElement('div');
    this.statsDisplay.style.position = 'fixed';
    this.statsDisplay.style.left = '20px';
    this.statsDisplay.style.bottom = '10px';
    this.statsDisplay.style.width = '300px';
    this.statsDisplay.style.background = 'rgba(0,0,0,0.7)';
    this.statsDisplay.style.color = '#ffffff';
    this.statsDisplay.style.font = "12px 'Roboto', sans-serif";
    this.statsDisplay.style.padding = '10px';
    this.statsDisplay.style.borderRadius = '5px';
    this.statsDisplay.style.zIndex = '1000';
    this.statsDisplay.style.textShadow = '1px 1px 1px rgba(0,0,0,0.5)';
    document.body.appendChild(this.statsDisplay);
};

// Update stats display
EulerTopologySimulation.prototype.updateStatsDisplay = function() {
    if (this.statsDisplay) {
        const lineCount = Array.from(this.particleConnections.values()).reduce((sum, set) => sum + set.size, 0);
        const bufferUsage = ((lineCount * 2) / this.maxLineVertices * 100).toFixed(1);
        
        const stats = `
        <div style="margin-bottom: 10px;">
            <h3 style="margin: 0 0 5px 0; color: #ffffff;">Network State</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                <div>Triangle Density:</div>
                <div>${(this.networkState.triangleDensity * 100).toFixed(1)}%</div>
                <div>Average Area:</div>
                <div>${this.networkState.averageArea.toFixed(2)}</div>
                <div>Network Complexity:</div>
                <div>${(this.networkState.networkComplexity * 100).toFixed(1)}%</div>
                <div>Spatial Distribution:</div>
                <div>${this.networkState.spatialDistribution.toFixed(2)}</div>
                <div>Particle Velocity:</div>
                <div>${this.networkState.particleVelocity.toFixed(2)}</div>
                <div>Connection Density:</div>
                <div>${(this.networkState.connectionDensity * 100).toFixed(1)}%</div>
                <div>Spatial Coherence:</div>
                <div>${this.networkState.spatialCoherence.toFixed(2)}</div>
            </div>
        </div>
        <div style="margin-top: 10px;">
            <h3 style="margin: 0 0 5px 0; color: #ffffff;">System Stats</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                <div>Particles:</div>
                <div>${this.activeParticleCount}</div>
                <div>Min Distance:</div>
                <div>${this.connectionDistance.toFixed(1)}</div>
                <div>Max Connections:</div>
                <div>${this.maxConnectionsPerParticle}</div>
                <div>Active Connections:</div>
                <div>${lineCount}</div>
                <div>Buffer Usage:</div>
                <div>${bufferUsage}%</div>
                <div>Active Triangles:</div>
                <div>${this.currentTriangles.size}/${this.maxTriangles}</div>
                <div>FPS:</div>
                <div>${Math.round(1/this.dt)}</div>
            </div>
        </div>
        `;
        this.statsDisplay.innerHTML = stats;
    }
};

// Main update function called every frame
EulerTopologySimulation.prototype.update = function(dt) {
    // Skip update if not properly initialized
    if (!this.particles || !this.device || !this.connectionEntity) {
        return;
    }
    
    this.frameCounter++;
    
    // Update particles
    this.updateParticles(dt);
    
    // Update connections
    const lineCount = this.updateConnections();
    
    // Find triangles (every few frames for performance)
    if (this.frameCounter % this.triangleDetectionInterval === 0) {
        this.previousTriangles = new Set(this.currentTriangles);
        this.currentTriangles = this.findTriangles();
    }
    
    // Calculate network metrics
    this.calculateNetworkMetrics();
    
    // Update vertex buffers
    this.updateVertexBuffers(lineCount);
    
    // Update stats display
    if (this.frameCounter % 30 === 0) { // Update every 30 frames
        this.updateStatsDisplay();
    }
    
    // Send network state to audio manager
    const audioEntity = this.app.root.findByName('AudioEntity');
    if (audioEntity && audioEntity.script.eulerAudioManager) {
        audioEntity.script.eulerAudioManager.updateFromNetwork(this.networkState);
    }
};

// Clean up when script is destroyed
EulerTopologySimulation.prototype.destroy = function() {
    // Clean up UI elements
    if (this.terminal && this.terminal.parentNode) {
        document.body.removeChild(this.terminal);
    }
    if (this.statsDisplay && this.statsDisplay.parentNode) {
        document.body.removeChild(this.statsDisplay);
    }
    if (this.titleElement && this.titleElement.parentNode) {
        document.body.removeChild(this.titleElement);
    }
    
    // Clean up rendering resources
    if (this.lineVertexBuffer) {
        this.lineVertexBuffer.destroy();
        this.lineVertexBuffer = null;
    }
    if (this.lineMesh) {
        this.lineMesh.destroy();
        this.lineMesh = null;
    }
    if (this.particleVertexBuffer) {
        this.particleVertexBuffer.destroy();
        this.particleVertexBuffer = null;
    }
    if (this.particleMesh) {
        this.particleMesh.destroy();
        this.particleMesh = null;
    }
    if (this.boxVertexBuffer) {
        this.boxVertexBuffer.destroy();
        this.boxVertexBuffer = null;
    }
    if (this.boxMesh) {
        this.boxMesh.destroy();
        this.boxMesh = null;
    }
    
    // Clear references
    this.lineMeshInstance = null;
    this.particleMeshInstance = null;
    this.boxMeshInstance = null;
    this.particles = null;
    this.lineVertexData = null;
    this.positions = null;
};

// Create title element
EulerTopologySimulation.prototype.createTitleElement = function() {
    this.titleElement = document.createElement('div');
    this.titleElement.style.position = 'fixed';
    this.titleElement.style.left = '20px';
    this.titleElement.style.top = '20px';
    this.titleElement.style.color = '#ffffff';
    this.titleElement.style.fontFamily = "'Roboto', sans-serif";
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
EULER TOPOLOGICAL SYNTH_`;
    document.body.appendChild(this.titleElement);
};

// Create bounding box wireframe
EulerTopologySimulation.prototype.createBoundingBox = function() {
    // Create entity for bounding box
    this.boundingBoxEntity = new pc.Entity('BoundingBox');
    this.entity.addChild(this.boundingBoxEntity);
    
    // Create vertex format for box lines
    const boxVertexFormat = new pc.VertexFormat(this.device, [
        { semantic: pc.SEMANTIC_POSITION, components: 3, type: pc.TYPE_FLOAT32 },
        { semantic: pc.SEMANTIC_NORMAL, components: 3, type: pc.TYPE_FLOAT32 }
    ]);
    
    // Create box wireframe vertices (12 edges of a cube)
    const halfSize = this.boundingBoxSize / 2;
    const boxVertices = new Float32Array([
        // Bottom face edges
        -halfSize, -halfSize, -halfSize,  0, 1, 0,  // 0
         halfSize, -halfSize, -halfSize,  0, 1, 0,  // 1
         halfSize, -halfSize, -halfSize,  0, 1, 0,  // 1
         halfSize, -halfSize,  halfSize,  0, 1, 0,  // 2
         halfSize, -halfSize,  halfSize,  0, 1, 0,  // 2
        -halfSize, -halfSize,  halfSize,  0, 1, 0,  // 3
        -halfSize, -halfSize,  halfSize,  0, 1, 0,  // 3
        -halfSize, -halfSize, -halfSize,  0, 1, 0,  // 0
        
        // Top face edges
        -halfSize,  halfSize, -halfSize,  0, 1, 0,  // 4
         halfSize,  halfSize, -halfSize,  0, 1, 0,  // 5
         halfSize,  halfSize, -halfSize,  0, 1, 0,  // 5
         halfSize,  halfSize,  halfSize,  0, 1, 0,  // 6
         halfSize,  halfSize,  halfSize,  0, 1, 0,  // 6
        -halfSize,  halfSize,  halfSize,  0, 1, 0,  // 7
        -halfSize,  halfSize,  halfSize,  0, 1, 0,  // 7
        -halfSize,  halfSize, -halfSize,  0, 1, 0,  // 4
        
        // Vertical edges
        -halfSize, -halfSize, -halfSize,  0, 1, 0,  // 0
        -halfSize,  halfSize, -halfSize,  0, 1, 0,  // 4
         halfSize, -halfSize, -halfSize,  0, 1, 0,  // 1
         halfSize,  halfSize, -halfSize,  0, 1, 0,  // 5
         halfSize, -halfSize,  halfSize,  0, 1, 0,  // 2
         halfSize,  halfSize,  halfSize,  0, 1, 0,  // 6
        -halfSize, -halfSize,  halfSize,  0, 1, 0,  // 3
        -halfSize,  halfSize,  halfSize,  0, 1, 0   // 7
    ]);
    
    // Create vertex buffer
    this.boxVertexBuffer = new pc.VertexBuffer(this.device, boxVertexFormat, 24);
    this.boxVertexBuffer.setData(boxVertices);
    
    // Create mesh
    this.boxMesh = new pc.Mesh(this.device);
    this.boxMesh.vertexBuffer = this.boxVertexBuffer;
    this.boxMesh.primitive[0] = { 
        type: pc.PRIMITIVE_LINES, 
        base: 0, 
        count: 24, 
        indexed: false 
    };
    
    // Create material
    this.boxMaterial = new pc.StandardMaterial();
    this.boxMaterial.diffuse = new pc.Color(0.3, 0.3, 0.3);
    this.boxMaterial.emissive = new pc.Color(0.3, 0.3, 0.3);
    this.boxMaterial.emissiveIntensity = 0.5;
    this.boxMaterial.blendType = pc.BLEND_NORMAL;
    this.boxMaterial.opacity = 0.5;
    this.boxMaterial.depthWrite = false;
    this.boxMaterial.useLighting = false;
    this.boxMaterial.update();
    
    // Create mesh instance
    this.boxMeshInstance = new pc.MeshInstance(this.boxMesh, this.boxMaterial);
    
    // Add render component
    this.boundingBoxEntity.addComponent('render', {
        meshInstances: [this.boxMeshInstance],
        castShadows: false,
        receiveShadows: false
    });
}; 