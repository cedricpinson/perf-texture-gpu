import Stats from 'stats.js';

interface QueryInfo {
    query: WebGLQuery;
    active: boolean;
    name: string;
    frameId: number;
}

interface TimingResult {
    name: string;
    startTime: number;
    endTime: number;
}

interface NamedMeasurements {
    [key: string]: number[]; // Just store the array of measurements
}

export class PerformanceMonitor {
    stats: Stats;
    performanceDiv: HTMLDivElement;
    measurementTimes: NamedMeasurements = {};
    readonly MEASUREMENT_BUFFER_SIZE = 100;
    lastDisplayUpdate = 0;
    readonly displayUpdateInterval = 1000; // 1 second

    // Query-related properties
    private timerQueryExt: any;
    private queryPool: QueryInfo[] = [];
    private frameCount: number = 0;
    private readonly POOL_SIZE = 16;

    currentFrameTimings: TimingResult[] = [];

    activeQuery: QueryInfo | null = null;
    gl: WebGL2RenderingContext;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.stats = new Stats();

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

        this.timerQueryExt = this.gl.getExtension('EXT_disjoint_timer_query_webgl2')!;
        if (!this.timerQueryExt) {
            console.warn('EXT_disjoint_timer_query_webgl2 extension not available');
            return;
        }

        for (let i = 0; i < this.POOL_SIZE; i++) {
            const query = this.gl.createQuery()!;
            this.queryPool.push({
                query,
                active: false,
                name: '',
                frameId: -1
            });
        }
    }

    getQueryFromPool(): QueryInfo | null {
        const query = this.queryPool.find(q => !q.active);
        if (query) {
            query.active = true;
            query.frameId = this.frameCount;
        }
        return query || null;
    }

    beginFrame(): void {
        this.stats.begin();
        this.currentFrameTimings = [];

        // Start first query without a name
        const newQuery = this.getQueryFromPool();
        if (newQuery) {
            this.gl.beginQuery(this.timerQueryExt.TIME_ELAPSED_EXT, newQuery.query);
            this.activeQuery = newQuery;
        }
    }

    saveMeasure(name: string): void {
        if (!this.timerQueryExt) return;

        // Name the previous query if it exists
        if (this.activeQuery) {
            this.activeQuery.name = name;
            this.gl.endQuery(this.timerQueryExt.TIME_ELAPSED_EXT);
        }

        // Start new query (without name yet)
        const newQuery = this.getQueryFromPool();
        if (!newQuery) {
            console.warn('No available queries in pool');
            return;
        }

        this.gl.beginQuery(this.timerQueryExt.TIME_ELAPSED_EXT, newQuery.query);
        this.activeQuery = newQuery;
    }

    endFrame(): void {
        // End and name the last measurement as 'frameEnd'
        if (this.activeQuery) {
            this.activeQuery.name = 'frameEnd';
            this.gl.endQuery(this.timerQueryExt.TIME_ELAPSED_EXT);
            this.activeQuery = null;
        }

        this.frameCount++;
        this.stats.end();
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
                this.addMeasurement(queryInfo.name, milliseconds);

                // Mark query as available for reuse
                queryInfo.active = false;
            }
        }
    }

    private addMeasurement(name: string, timeMs: number) {
        // Initialize array for this name if it doesn't exist
        if (!this.measurementTimes[name]) {
            this.measurementTimes[name] = new Array(this.MEASUREMENT_BUFFER_SIZE).fill(0);
        }

        const index = this.frameCount % this.MEASUREMENT_BUFFER_SIZE;
        this.measurementTimes[name][index] = timeMs;
    }

    shouldUpdateDisplay(): boolean {
        return performance.now() - this.lastDisplayUpdate >= this.displayUpdateInterval;
    }

    updateDisplay(uploadFrequency: number, textureSize: number) {
        // Calculate averages for each named measurement
        const averages = Object.entries(this.measurementTimes).map(([name, times]) => {
            const sum = times.reduce((a, b) => a + b, 0);
            const avg = sum / this.MEASUREMENT_BUFFER_SIZE;
            return `${name}: ${avg.toFixed(2)}ms`;
        });

        const uploadSize = textureSize * textureSize * 4;
        const uploadRate = (uploadFrequency * uploadSize);

        this.performanceDiv.innerHTML = [
            `Texture Size: ${textureSize}x${textureSize}`,
            ...averages,
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