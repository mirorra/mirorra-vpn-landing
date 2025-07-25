// WebGL Star Animation
class StarAnimation {
    constructor() {
        this.canvas = document.getElementById('starCanvas');
        if (!this.canvas) return;
        
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        if (!this.gl) {
            console.warn('WebGL not supported');
            return;
        }
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.time = 0;
        this.orbitRadius = 0.8;
        this.orbitSpeed = 0.4;
        this.orbitCenter = { x: 0, y: 0 };
        this.trail = [];
        this.maxTrailLength = 60;
        
        this.initShaders();
        this.initBuffers();
        this.animate();
    }
    
    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
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
        
        // Fragment shader for star with neon trail
        const fragmentShaderSource = `
            precision mediump float;
            uniform vec2 u_resolution;
            uniform float u_time;
            uniform vec2 u_starPos;
            uniform vec2 u_trail[60];
            uniform int u_trailLength;
            varying vec2 v_texCoord;
            
            void main() {
                vec2 uv = v_texCoord;
                vec2 center = vec2(0.5);
                vec2 pos = (uv - center) * 2.0;
                
                // Star head (tiny bright point)
                float starDist = distance(pos, u_starPos);
                float starGlow = 1.0 / (1.0 + starDist * 800.0);
                vec3 starColor = vec3(0.4, 0.7, 1.0) * starGlow * 0.8;
                
                // Star core (tiny bright center)
                float starCore = 1.0 - smoothstep(0.0, 0.008, starDist);
                starColor += vec3(1.0, 1.0, 1.0) * starCore * 0.4;
                
                // Neon trail effect
                vec3 trailColor = vec3(0.0);
                for (int i = 0; i < 60; i++) {
                    if (i >= u_trailLength) break;
                    vec2 trailPos = u_trail[i];
                    float trailDist = distance(pos, trailPos);
                    float trailAlpha = float(i) / float(u_trailLength);
                    float trailGlow = 1.0 / (1.0 + trailDist * 200.0) * trailAlpha * 0.3;
                    trailColor += vec3(0.2, 0.5, 0.8) * trailGlow;
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
    }
    
    updateStar() {
        // Calculate circular orbit position
        const angle = this.time * this.orbitSpeed;
        this.starPosition = {
            x: this.orbitCenter.x + Math.cos(angle) * this.orbitRadius,
            y: this.orbitCenter.y + Math.sin(angle) * this.orbitRadius
        };
        
        // Add current position to trail
        this.trail.push({ x: this.starPosition.x, y: this.starPosition.y });
        
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
        this.gl.uniform2f(this.starPosLocation, this.starPosition.x, this.starPosition.y);
        
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
        this.time += 0.016; // ~60fps
        this.updateStar();
        this.render();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize star animation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new StarAnimation();
}); 