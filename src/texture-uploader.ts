export class TextureUploader {
    data: Uint8Array | null;
    size = 0;

    constructor(private gl: WebGL2RenderingContext) {
        this.data = null;
        this.size = 0;
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
}