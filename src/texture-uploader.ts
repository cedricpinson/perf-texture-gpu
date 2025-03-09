interface QueryInfo {
    query: WebGLQuery;
    active: boolean;
    frameId: number;
}

export class TextureUploader {
    data: Uint8Array | null;
    size = 0;
    timerQueryExt: any;
    queryPool: QueryInfo[] = [];
    currentFrame: number = 0;
    readonly POOL_SIZE = 4; // Adjust size based on your needs

    constructor(private gl: WebGL2RenderingContext) {
        this.data = null;
        this.size = 0;
        // Initialize timer query extension
        this.timerQueryExt = this.gl.getExtension('EXT_disjoint_timer_query_webgl2');
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

    generateTextureData(size: number): Uint8Array {
        const data = new Uint8Array(size * size * 4);
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.random() * 255;     // R
            data[i + 1] = Math.random() * 255; // G
            data[i + 2] = Math.random() * 255; // B
            data[i + 3] = 255;                 // A
        }
        return data;
    }

    uploadTexture(size: number): void {
        if (this.size !== size) {
            this.size = size;
            this.data = this.generateTextureData(size);
        }
        const textureData = this.data;
        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.RGBA,
            this.size,
            this.size,
            0,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            textureData
        );
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
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
        queryInfo.frameId = this.currentFrame;
        return true;
    }

    endMeasure(): void {
        if (!this.timerQueryExt) return;
        this.gl.endQuery(this.timerQueryExt.TIME_ELAPSED_EXT);
    }

    checkQueryResults(resultReady: (timeMs: number, frameId: number) => void): void {
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
                resultReady(milliseconds, queryInfo.frameId);

                // Mark query as available for reuse
                queryInfo.active = false;
            }
        }
    }

    nextFrame(): void {
        this.currentFrame++;
    }

    cleanup(): void {
        // Clean up queries when done
        for (const queryInfo of this.queryPool) {
            this.gl.deleteQuery(queryInfo.query);
        }
        this.queryPool = [];
    }
}