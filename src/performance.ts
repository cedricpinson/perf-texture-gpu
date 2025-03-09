import Stats from 'stats.js';

export class PerformanceMonitor {
    stats: Stats;
    performanceDiv: HTMLDivElement;
    measurementTimes: number[] = [];
    readonly MEASUREMENT_BUFFER_SIZE = 100;
    lastDisplayUpdate = 0;
    readonly displayUpdateInterval = 1000; // 1 second
    frameCount = 0;

    constructor() {
        this.stats = new Stats();
        this.measurementTimes = new Array(this.MEASUREMENT_BUFFER_SIZE).fill(0.0);
        const statsContainer = document.getElementById('stats');
        if (!statsContainer) {
            throw new Error('Stats container not found');
        }

        statsContainer.appendChild(this.stats.dom);
        this.stats.showPanel(0);

        this.performanceDiv = document.getElementById('log') as HTMLDivElement;
        if (!this.performanceDiv) {
            throw new Error('Element with id "log" not found');
        }
    }

    beginFrame() {
        this.stats.begin();
    }

    endFrame() {
        this.frameCount++;
        this.stats.end();
    }

    addMeasurement(timeMs: number) {
        const index = this.frameCount % this.MEASUREMENT_BUFFER_SIZE;
        this.measurementTimes[index] = timeMs;
    }

    shouldUpdateDisplay(): boolean {
        return performance.now() - this.lastDisplayUpdate >= this.displayUpdateInterval;
    }

    updateDisplay(uploadFrequency: number, textureSize: number) {
        const avgTime = this.measurementTimes.length > 0
            ? this.measurementTimes.reduce((a, b) => a + b, 0) / this.measurementTimes.length
            : 0;

        const uploadSize = textureSize * textureSize * 4;
        const uploadRate = (uploadFrequency * uploadSize);

        this.performanceDiv.innerHTML = [
            `Texture Size: ${textureSize}x${textureSize}`,
            `Avg Upload Time: ${avgTime.toFixed(2)}ms`,
            `Frame Count: ${this.frameCount}`,
            `Upload Rate: ${(uploadRate / 1024 / 1024).toFixed(2)} MB/Frame`
        ].join('<br>');

        this.lastDisplayUpdate = performance.now();
    }
}