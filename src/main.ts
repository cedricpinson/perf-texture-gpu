import { Pane } from 'tweakpane';
import { createShader, createProgram, createTexture } from './webgl';
import { vertexShaderSource, fragmentShaderSourceScrollNoTexture, fragmentShaderSourceScrollTexture, funFragmentShaderSource, heavyFragmentShaderSourceWarped } from './shaders';
import { PerformanceMonitor } from './performance';
import { TextureUploader } from './texture-uploader';
import { Renderer } from './renderer';



// UI Controls
const PARAMS = {
    textureSize: 1024,
    uploadFrequency: 10,
    uploadBackgroundTexture: false,
    program: 0,
    running: true,
    useMipmaps: true,
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
    min: 0,
    max: 20,
    step: 1,
});
pane.addBinding(PARAMS, 'useMipmaps');
pane.addBinding(PARAMS, 'uploadBackgroundTexture');
pane.addBinding(PARAMS, 'running');
// WebGL setup
const canvas = document.createElement('canvas');
const desiredWidth = 800;
const desiredHeight = 600;
const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
canvas.width = desiredWidth * devicePixelRatio;
canvas.height = desiredHeight * devicePixelRatio;
canvas.style.width = `${desiredWidth}px`;
canvas.style.height = `${desiredHeight}px`;
document.body.appendChild(canvas);

const gl = canvas.getContext('webgl2', { performance: 'high-performance' }) as WebGL2RenderingContext;
if (!gl) {
    throw new Error('WebGL2 not supported');
}

// Create shaders and program
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);

const fragmentShaderScrollTexture = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSourceScrollTexture);
const fragmentShaderScrollNoTexture = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSourceScrollNoTexture);
const fragmentShaderFun = createShader(gl, gl.FRAGMENT_SHADER, funFragmentShaderSource);
const fragmentShaderHeavy = createShader(gl, gl.FRAGMENT_SHADER, heavyFragmentShaderSourceWarped);

const programScrollTexture = createProgram(gl, vertexShader, fragmentShaderScrollTexture);
const programScrollNoTexture = createProgram(gl, vertexShader, fragmentShaderScrollNoTexture);
const programFun = createProgram(gl, vertexShader, fragmentShaderFun);
const programHeavy = createProgram(gl, vertexShader, fragmentShaderHeavy);

const programs = [
    {
        program: programScrollTexture,
        name: 'Scroll Texture',
        index: 0
    },
    {
        program: programScrollNoTexture,
        name: 'Scroll No Texture',
        index: 1
    },
    {
        program: programFun,
        name: 'Fun',
        index: 2
    },
    {
        program: programHeavy,
        name: 'Heavy',
        index: 3
    }
];

pane.addBinding(PARAMS, 'program', {
    options: programs.reduce((obj, prg) => {
        obj[prg.name] = prg.index;
        return obj;
    }, {} as Record<string, number>)
});

// Create texture
let texture = { texture: createTexture(gl), size: 0 };
let backgroundTexture = { texture: createTexture(gl), size: 0 };

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
const performanceMonitor = new PerformanceMonitor(gl);
const textureUploader = new TextureUploader(gl);
const renderer = new Renderer(gl, programs.map((program) => program.program), positions, texcoords);

// initialize textures
texture = textureUploader.uploadTexture(texture, PARAMS.textureSize, PARAMS.useMipmaps);
backgroundTexture = textureUploader.uploadTexture(backgroundTexture, PARAMS.textureSize, PARAMS.useMipmaps);

function render() {
    if (!PARAMS.running) {
        requestAnimationFrame(render);
        return;
    }

    performanceMonitor.checkQueryResults();

    performanceMonitor.beginFrame();

    const canMeasure = performanceMonitor.beginMeasure();
    // Upload textures
    for (let i = 0; i < PARAMS.uploadFrequency; i++) {
        if (PARAMS.uploadBackgroundTexture) {
            backgroundTexture = textureUploader.uploadTexture(backgroundTexture, PARAMS.textureSize, PARAMS.useMipmaps);
        } else {
            texture = textureUploader.uploadTexture(texture, PARAMS.textureSize, PARAMS.useMipmaps);
        }
    }
    if (canMeasure) {
        performanceMonitor.endMeasure();
    }

    //renderer.render(PARAMS.heavyFragmentShader, texture);
    renderer.render(PARAMS.program, texture);

    if (performanceMonitor.shouldUpdateDisplay()) {
        performanceMonitor.updateDisplay(PARAMS.uploadFrequency, PARAMS.textureSize);
    }

    performanceMonitor.endFrame();

    requestAnimationFrame(render);
}

requestAnimationFrame(render);
