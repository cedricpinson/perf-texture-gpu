import { Pane } from 'tweakpane';
import { createShader, createProgram, createTexture } from './webgl';
import { vertexShaderSource, fragmentShaderSource } from './shaders';
import { PerformanceMonitor } from './performance';
import { TextureUploader } from './texture-uploader';
import { Renderer } from './renderer';

// UI Controls
const PARAMS = {
    textureSize: 1024,
    uploadFrequency: 10,
    running: true,
};

const controlsContainer = document.getElementById('controls');
if (!controlsContainer) {
    throw new Error('Controls container not found');
}

const pane = new Pane({
    container: controlsContainer
});

pane.addBinding(PARAMS, 'textureSize', {
    min: 64,
    max: 8192,
    step: 64,
});
pane.addBinding(PARAMS, 'uploadFrequency', {
    min: 1,
    max: 120,
    step: 1,
});
pane.addBinding(PARAMS, 'running');

// WebGL setup
const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);

const gl = canvas.getContext('webgl2', { performance: 'high-performance' }) as WebGL2RenderingContext;
if (!gl) {
    throw new Error('WebGL2 not supported');
}

// Create shaders and program
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

// Create texture
const texture = createTexture(gl);

// Create geometry data
const positions = new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    1, 1,
]);

const texcoords = new Float32Array([
    0, 0,
    1, 0,
    0, 1,
    1, 1,
]);

// Initialize components
const performanceMonitor = new PerformanceMonitor();
const textureUploader = new TextureUploader(gl);
const renderer = new Renderer(gl, program, positions, texcoords, texture);

let lastDisplayUpdate = 0;
function render(time: number) {
    if (!PARAMS.running) {
        requestAnimationFrame(render);
        return;
    }

    performanceMonitor.beginFrame();

    // Upload texture based on frequency
    const startTime = performance.now();
    for (let i = 0; i < PARAMS.uploadFrequency; i++) {
        textureUploader.uploadTexture(PARAMS.textureSize);
    }
    const endTime = performance.now();
    performanceMonitor.recordUploadTime(startTime, endTime);

    // update display every second
    if (Math.floor(performance.now() / 1000) > Math.floor(lastDisplayUpdate / 1000)) {
        performanceMonitor.updateDisplay(PARAMS.uploadFrequency, PARAMS.textureSize);
        lastDisplayUpdate = performance.now();
    }

    renderer.render();

    performanceMonitor.endFrame();
    requestAnimationFrame(render);
}

requestAnimationFrame(render);
