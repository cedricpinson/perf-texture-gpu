import { createTexture } from './webgl';

export class TextureUploader {
    private data: Uint8Array | null;

    constructor(private gl: WebGL2RenderingContext) {
        this.data = null;
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

    uploadTexture(textureObject: { texture: WebGLTexture, size: number }, size: number, useMipmaps: boolean = true): { texture: WebGLTexture, size: number } {
        let textureToUse = textureObject;
        if (textureObject.size !== size) {
            textureObject.size = size;
            this.data = this.generateTextureData(size);
            console.log('generating new texture', size);
            this.gl.deleteTexture(textureToUse.texture);
            textureToUse = { texture: createTexture(this.gl), size };
        }
        this.gl.bindTexture(this.gl.TEXTURE_2D, textureToUse.texture);

        const textureData = this.data;
        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.RGBA,
            size,
            size,
            0,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            textureData
        );

        if (useMipmaps) {
            this.gl.generateMipmap(this.gl.TEXTURE_2D);
        }
        return textureToUse;
    }
}