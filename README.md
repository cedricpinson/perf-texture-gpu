# WebGL Texture Upload Performance Test

This project measures the performance of texture uploads to the GPU using WebGL2. It provides a simple interface to control texture size and upload frequency, and displays real-time performance metrics.

## Features

- Real-time texture upload performance monitoring
- Adjustable texture size (64x64 to 4096x4096)
- Configurable upload frequency
- FPS counter
- Average upload time tracking

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

## Controls

- **Texture Size**: Adjust the size of the texture being uploaded (64x64 to 4096x4096 pixels)
- **Upload Frequency**: Control how often new textures are uploaded (1-120 times per second)
- **Running**: Toggle texture upload on/off

## Performance Metrics

The application displays the following metrics:
- Current FPS (top-left corner)
- Texture size
- Last upload time (ms)
- Average upload time (ms)
- Frame count

## Technologies Used

- Vite
- TypeScript
- WebGL2
- Tweakpane (for UI controls)
- Stats.js (for FPS monitoring)
