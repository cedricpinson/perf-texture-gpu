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
    textureSizes: [64, 128, 256, 512, 1024, 2048, 4096, 8192],
};

const controlsContainer = document.getElementById('controls');
if (!controlsContainer) {
    throw new Error('Controls container not found');
}

const pane = new Pane({
    container: controlsContainer
});

pane.addBinding(PARAMS, 'textureSize', {
    options: PARAMS.textureSizes.reduce((obj, size) => {
        obj[`${size}x${size}`] = size;
        return obj;
    }, {} as Record<string, number>)
});
pane.addBinding(PARAMS, 'uploadFrequency', {
    min: 1,
    max: 20,
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

function render() {
    if (!PARAMS.running) {
        requestAnimationFrame(render);
        return;
    }

    performanceMonitor.beginFrame();

    // Check results from previous frames
    textureUploader.checkQueryResults((timeMs, _frameId) => {
        performanceMonitor.addMeasurement(timeMs);
    });


    // Start new measurement if query extension is available
    const canMeasure = textureUploader.beginMeasure();

    // Upload textures
    for (let i = 0; i < PARAMS.uploadFrequency; i++) {
        textureUploader.uploadTexture(PARAMS.textureSize);
    }


    textureUploader.nextFrame();
    renderer.render();

    if (canMeasure) {
        textureUploader.endMeasure();
    }

    performanceMonitor.endFrame();

    // Update display once per second
    if (performanceMonitor.shouldUpdateDisplay()) {
        performanceMonitor.updateDisplay(PARAMS.uploadFrequency, PARAMS.textureSize);
    }


    requestAnimationFrame(render);
}

requestAnimationFrame(render);
