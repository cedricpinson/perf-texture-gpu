import Stats from 'stats.js';

interface QueryInfo {
    query: WebGLQuery;
    active: boolean;
    frameId: number;
}

export class PerformanceMonitor {
    stats: Stats;
    performanceDiv: HTMLDivElement;
    measurementTimes: number[] = [];
    readonly MEASUREMENT_BUFFER_SIZE = 100;
    lastDisplayUpdate = 0;
    readonly displayUpdateInterval = 1000; // 1 second

    // Query-related properties
    private timerQueryExt: any;
    private queryPool: QueryInfo[] = [];
    private frameCount: number = 0;
    private readonly POOL_SIZE = 8;

    constructor(private gl: WebGL2RenderingContext) {
        // Stats initialization
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

        // Query initialization
        this.timerQueryExt = this.gl.getExtension('EXT_disjoint_timer_query_webgl2')!;
        if (!this.timerQueryExt) {
            console.warn('EXT_disjoint_timer_query_webgl2 extension not available');
            return;
        }

        // Initialize query pool
        for (let i = 0; i < this.POOL_SIZE; i++) {
            const query = this.gl.createQuery()!;
            this.queryPool.push({
                query,
                active: false,
                frameId: -1
            });
        }
    }

    beginMeasure(): boolean {
        if (!this.timerQueryExt) return false;

        // Find an inactive query in the pool
        const queryInfo = this.queryPool.find(q => !q.active);
        if (!queryInfo) {
            console.warn('No available queries in pool');
            return false;
        }

        this.gl.beginQuery(this.timerQueryExt.TIME_ELAPSED_EXT, queryInfo.query);
        queryInfo.active = true;
        queryInfo.frameId = this.frameCount;
        return true;
    }

    endMeasure(): void {
        if (!this.timerQueryExt) return;
        this.gl.endQuery(this.timerQueryExt.TIME_ELAPSED_EXT);
    }

    checkQueryResults(): void {
        if (!this.timerQueryExt) return;
        this.gl.flush();

        // Check all active queries
        for (const queryInfo of this.queryPool) {
            if (!queryInfo.active) continue;

            const available = this.gl.getQueryParameter(
                queryInfo.query,
                this.gl.QUERY_RESULT_AVAILABLE
            );
            const disjoint = this.gl.getParameter(this.timerQueryExt.GPU_DISJOINT_EXT);

            if (available && !disjoint) {
                const timeElapsed = this.gl.getQueryParameter(
                    queryInfo.query,
                    this.gl.QUERY_RESULT
                );
                const milliseconds = timeElapsed / 1000000;
                this.addMeasurement(milliseconds);

                // Mark query as available for reuse
                queryInfo.active = false;
            }
        }
    }

    beginFrame() {
        this.stats.begin();
    }

    endFrame() {
        this.frameCount++;
        this.stats.end();
    }

    private addMeasurement(timeMs: number) {
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

    cleanup(): void {
        if (!this.timerQueryExt) return;
        this.queryPool.forEach(queryInfo => this.gl.deleteQuery(queryInfo.query));
        this.queryPool = [];
    }
}