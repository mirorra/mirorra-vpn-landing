// Falling Star Animation
class FallingStarAnimation {
    constructor() {
        this.canvas = document.getElementById('starCanvas');
        if (!this.canvas) return;
        
        // Optimize for mobile devices
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        this.gl = this.canvas.getContext('webgl', {
            antialias: false,
            alpha: true,
            powerPreference: 'high-performance'
        }) || this.canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            console.warn('WebGL not supported');
            return;
        }
        
        // Mobile optimizations
        if (this.isMobile) {
            this.gl.getExtension('OES_standard_derivatives');
            this.gl.getExtension('OES_element_index_uint');
        }
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Handle orientation change on mobile
        if (this.isMobile) {
            window.addEventListener('orientationchange', () => {
                setTimeout(() => this.resizeCanvas(), 100);
            });
        }
        
        this.time = 0;
        this.star = {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            active: false
        };
        this.trail = [];
        this.maxTrailLength = this.isMobile ? 60 : 120;
        this.angle = 45 * Math.PI / 180; // 45 degrees (perfect diagonal)
        this.speed = 0.01; // Fixed speed for consistent timing across devices
        this.fadeOutTime = 0;
        this.fadeOutDuration = 1.0; // 1 second fade out
        this.isFadingOut = false;
        this.starCount = 0; // Counter for stars
        
        this.initShaders();
        this.initBuffers();
        this.spawnStar();
        this.animate();
    }
    
    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        // Limit resolution on mobile for better performance
        const pixelRatio = this.isMobile ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio;
        this.canvas.width = rect.width * pixelRatio;
        this.canvas.height = rect.height * pixelRatio;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    
    spawnStar() {
        this.starCount++;
        
        if (this.starCount === 1) {
            // First star: perfect diagonal from top-right to bottom-left
            this.star.x = 1.0; // Top-right corner
            this.star.y = 1.0;
            
            // Perfect 45-degree diagonal movement
            this.star.vx = -Math.cos(this.angle) * this.speed;
            this.star.vy = -Math.sin(this.angle) * this.speed;
        } else {
            // Subsequent stars: slight random variation
            const randomX = (Math.random() - 0.5) * 1.6; // Random X position from -0.8 to 0.8
            this.star.x = randomX;
            this.star.y = 1.0; // Top edge of visible area
            
            // Add small random variation to angle (±10 degrees)
            const randomAngleVariation = (Math.random() - 0.5) * 20 * Math.PI / 180; // ±10 degrees
            const currentAngle = this.angle + randomAngleVariation;
            
            this.star.vx = -Math.cos(currentAngle) * this.speed;
            this.star.vy = -Math.sin(currentAngle) * this.speed;
        }
        
        this.star.active = true;
        this.trail = [];
    }
    
    initShaders() {
        // Vertex shader
        const vertexShaderSource = `
            attribute vec2 a_position;
            attribute vec2 a_texCoord;
            uniform vec2 u_resolution;
            uniform float u_time;
            varying vec2 v_texCoord;
            
            void main() {
                vec2 position = a_position;
                gl_Position = vec4(position, 0.0, 1.0);
                v_texCoord = a_texCoord;
            }
        `;
        
        // Fragment shader for falling star
        const fragmentShaderSource = `
            precision mediump float;
            uniform vec2 u_resolution;
            uniform float u_time;
            uniform vec2 u_starPos;
            uniform vec2 u_trail[120];
            uniform int u_trailLength;
            uniform bool u_isMobile;
            varying vec2 v_texCoord;
            
            void main() {
                vec2 uv = v_texCoord;
                vec2 center = vec2(0.5);
                vec2 pos = (uv - center) * 2.0;
                
                // Star head (tiny bright point)
                float starDist = distance(pos, u_starPos);
                float starGlow = 1.0 / (1.0 + starDist * 2000.0);
                vec3 starColor = vec3(0.4, 0.7, 1.0) * starGlow * 0.28;
                
                // Star core (tiny bright center)
                float starCore = 1.0 - smoothstep(0.0, 0.005, starDist);
                starColor += vec3(1.0, 1.0, 1.0) * starCore * 0.18;
                
                // Falling trail effect
                vec3 trailColor = vec3(0.0);
                int maxIterations = u_isMobile ? 60 : 120;
                for (int i = 0; i < 120; i++) {
                    if (i >= u_trailLength || i >= maxIterations) break;
                    vec2 trailPos = u_trail[i];
                    float trailDist = distance(pos, trailPos);
                    float trailAlpha = float(i) / float(u_trailLength);
                    
                    // Falling trail with better blending
                    float trailGlow = 1.0 / (1.0 + trailDist * 600.0) * trailAlpha * 0.21;
                    trailColor += vec3(0.2, 0.5, 0.8) * trailGlow;
                    
                    // Add additional glow for smoother effect
                    float extraGlow = 1.0 / (1.0 + trailDist * 200.0) * trailAlpha * 0.205;
                    trailColor += vec3(0.1, 0.3, 0.6) * extraGlow;
                }
                
                // Combine star and trail
                vec3 finalColor = starColor + trailColor;
                
                // Subtle pulsing
                float pulse = sin(u_time * 2.0) * 0.05 + 0.95;
                finalColor *= pulse;
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;
        
        this.vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        this.fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.program = this.createProgram(this.vertexShader, this.fragmentShader);
        
        this.gl.useProgram(this.program);
    }
    
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }
    
    createProgram(vertexShader, fragmentShader) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);
        
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('Program linking error:', this.gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }
    
    initBuffers() {
        // Create a simple quad
        const positions = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]);
        
        const texCoords = new Float32Array([
            0, 0,
            1, 0,
            0, 1,
            1, 1
        ]);
        
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
        
        this.texCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.STATIC_DRAW);
        
        // Get attribute locations
        this.positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.texCoordLocation = this.gl.getAttribLocation(this.program, 'a_texCoord');
        
        // Get uniform locations
        this.resolutionLocation = this.gl.getUniformLocation(this.program, 'u_resolution');
        this.timeLocation = this.gl.getUniformLocation(this.program, 'u_time');
        this.starPosLocation = this.gl.getUniformLocation(this.program, 'u_starPos');
        this.trailLocation = this.gl.getUniformLocation(this.program, 'u_trail');
        this.trailLengthLocation = this.gl.getUniformLocation(this.program, 'u_trailLength');
        this.isMobileLocation = this.gl.getUniformLocation(this.program, 'u_isMobile');
    }
    
    updateStar() {
        if (this.isFadingOut) {
            // Fade out phase
            this.fadeOutTime += 0.016; // ~60fps
            
            // Gradually remove trail points
            if (this.trail.length > 0 && this.fadeOutTime > 0.1) {
                this.trail.shift();
                this.fadeOutTime = 0; // Reset timer
            }
            
            // Check if fade out is complete
            if (this.fadeOutTime >= this.fadeOutDuration) {
                this.isFadingOut = false;
                this.spawnStar();
            }
            return;
        }
        
        if (!this.star.active) {
            this.spawnStar();
            return;
        }
        
        // Update star position
        this.star.x += this.star.vx;
        this.star.y += this.star.vy;
        
        // Check if star is off screen (now can go off left or bottom)
        if (this.star.x < -1.5 || this.star.y < -1.5) {
            this.star.active = false;
            this.isFadingOut = true;
            this.fadeOutTime = 0;
            return;
        }
        
        // Add current position to trail
        this.trail.push({ x: this.star.x, y: this.star.y });
        
        // Limit trail length
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }
    
    render() {
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
        // Set uniforms
        this.gl.uniform2f(this.resolutionLocation, this.canvas.width, this.canvas.height);
        this.gl.uniform1f(this.timeLocation, this.time);
        this.gl.uniform2f(this.starPosLocation, this.star.x, this.star.y);
        this.gl.uniform1i(this.isMobileLocation, this.isMobile ? 1 : 0);
        
        // Set trail uniforms
        const trailArray = new Float32Array(this.maxTrailLength * 2);
        for (let i = 0; i < this.trail.length; i++) {
            trailArray[i * 2] = this.trail[i].x;
            trailArray[i * 2 + 1] = this.trail[i].y;
        }
        // Fill remaining positions with the last position to avoid shader issues
        for (let i = this.trail.length; i < this.maxTrailLength; i++) {
            trailArray[i * 2] = this.trail[this.trail.length - 1]?.x || 0;
            trailArray[i * 2 + 1] = this.trail[this.trail.length - 1]?.y || 0;
        }
        this.gl.uniform2fv(this.trailLocation, trailArray);
        this.gl.uniform1i(this.trailLengthLocation, this.trail.length);
        
        // Set up attributes
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.enableVertexAttribArray(this.positionLocation);
        this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
        this.gl.enableVertexAttribArray(this.texCoordLocation);
        this.gl.vertexAttribPointer(this.texCoordLocation, 2, this.gl.FLOAT, false, 0, 0);
        
        // Draw
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
    
    animate() {
        // Fixed frame rate for consistent timing across devices
        const targetFPS = 60;
        const frameTime = 1000 / targetFPS;
        
        this.time += frameTime / 1000;
        this.updateStar();
        this.render();
        
        // Consistent timing on all devices
        setTimeout(() => requestAnimationFrame(() => this.animate()), frameTime);
    }
}

// Initialize falling star animation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new FallingStarAnimation();
}); 