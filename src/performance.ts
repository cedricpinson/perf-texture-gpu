import Stats from 'stats.js';

export class PerformanceMonitor {
    stats: Stats;
    performanceDiv: HTMLDivElement;
    uploadTimes: number[] = [];
    readonly maxUploadTimes = 100;
    uploadTime = 0;
    frameCount = 0;

    constructor() {
        this.stats = new Stats();

        const statsContainer = document.getElementById('stats');
        if (!statsContainer) {
            throw new Error('Stats container not found');
        }

        // Scale up the stats canvas
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

    recordUploadTime(startTime: number, endTime: number) {
        this.uploadTime = endTime - startTime;
        this.uploadTimes.push(this.uploadTime);
        if (this.uploadTimes.length > this.maxUploadTimes) {
            this.uploadTimes.shift();
        }
    }

    updateDisplay(uploadFrequency: number, textureSize: number) {
        const avgUploadTime = this.uploadTimes.reduce((a, b) => a + b, 0) / this.uploadTimes.length;
        const uploadSize = textureSize * textureSize * 4;
        const uploadRate = (uploadFrequency * uploadSize);
        this.performanceDiv.textContent = `
    Texture Size: ${textureSize}x${textureSize}
    Last Upload Time: ${this.uploadTime.toFixed(2)}ms
    Avg Upload Time: ${avgUploadTime.toFixed(2)}ms
    Frame Count: ${this.frameCount}
    Upload Rate: ${(uploadRate / 1024 / 1024).toFixed(2)} MB/Frame
    `;
    }

    getFrameCount(): number {
        return this.frameCount;
    }
}