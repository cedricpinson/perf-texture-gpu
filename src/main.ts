import { Pane } from 'tweakpane';
import { createShader, createProgram, createTexture2D, Texture } from './webgl';
import { vertexShaderSource, fragmentShaderSourceNoTexture, fragmentShaderSourceScrollTexture } from './shaders';
import { PerformanceMonitor } from './performance';
import { TextureUploader } from './texture-uploader';
import { Renderer } from './renderer';

// UI Controls
const PARAMS = {
    textureSize: 1024,
    uploadFrequency: 10,
    program: 0,
    running: true,
    useMipmaps: true,
    textureSizes: [64, 128, 256, 512, 1024, 2048, 4096, 8192],
};

interface App {
    gl: WebGL2RenderingContext;
    texture: Texture;
    performanceMonitor: PerformanceMonitor;
    textureUploader: TextureUploader;
    renderer: Renderer;
    params: typeof PARAMS;
}

function initialize(): App {
    // Setup controls
    const controlsContainer = document.getElementById('controls');
    if (!controlsContainer) {
        throw new Error('Controls container not found');
    }

    const pane = new Pane({
        container: controlsContainer
    });

    // Setup canvas
    const canvas = document.createElement('canvas');
    const desiredWidth = 800;
    const desiredHeight = 600;
    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = desiredWidth * devicePixelRatio;
    canvas.height = desiredHeight * devicePixelRatio;
    canvas.style.width = `${desiredWidth}px`;
    canvas.style.height = `${desiredHeight}px`;
    document.body.appendChild(canvas);

    // Initialize WebGL
    const gl = canvas.getContext('webgl2', { performance: 'high-performance' }) as WebGL2RenderingContext;
    if (!gl) {
        throw new Error('WebGL2 not supported');
    }

    // Create shaders and programs
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShaderScrollTexture = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSourceScrollTexture);
    const fragmentShaderNoTexture = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSourceNoTexture);

    const programScrollTexture = createProgram(gl, vertexShader, fragmentShaderScrollTexture);
    const programNoTexture = createProgram(gl, vertexShader, fragmentShaderNoTexture);

    const programs = [
        { program: programScrollTexture, name: 'Scroll Texture', index: 0 },
        { program: programNoTexture, name: 'No Texture', index: 1 },
    ];

    // Setup UI controls
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
    pane.addBinding(PARAMS, 'running');
    pane.addBinding(PARAMS, 'program', {
        options: programs.reduce((obj, prg) => {
            obj[prg.name] = prg.index;
            return obj;
        }, {} as Record<string, number>)
    });

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

    const app: App = {
        gl,
        texture: createTexture2D(gl, PARAMS.textureSize, PARAMS.useMipmaps),
        performanceMonitor: new PerformanceMonitor(gl),
        textureUploader: new TextureUploader(gl, PARAMS.textureSize),
        renderer: new Renderer(gl, programs.map((program) => program.program), positions, texcoords),
        params: PARAMS
    };

    return app;
}

function render(app: App) {
    if (!app.params.running) {
        requestAnimationFrame(() => render(app));
        return;
    }

    app.performanceMonitor.checkQueryResults();
    app.performanceMonitor.beginFrame();

    // Upload textures
    for (let i = 0; i < app.params.uploadFrequency; i++) {
        app.texture = app.textureUploader.uploadTexture(
            app.texture,
            app.params.textureSize,
            app.params.useMipmaps
        );
    }
    app.performanceMonitor.saveMeasure('upload');

    app.renderer.render(app.params.program, app.texture);
    app.performanceMonitor.saveMeasure('render');

    if (app.performanceMonitor.shouldUpdateDisplay()) {
        app.performanceMonitor.updateDisplay(app.params.uploadFrequency, app.params.textureSize);
    }

    app.performanceMonitor.endFrame();
    requestAnimationFrame(() => render(app));
}

// Start the application
const app = initialize();
requestAnimationFrame(() => render(app));
