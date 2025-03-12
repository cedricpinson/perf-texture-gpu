import { createTexture2D, Texture } from './webgl';

export class TextureUploader {
    private data: Uint8Array | null;

    constructor(private gl: WebGL2RenderingContext, size: number) {
        this.data = this.generateTextureData(size);
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

    uploadTexture(textureObject: Texture, size: number, useMipmaps: boolean = true): Texture {
        let textureToUse = textureObject;
        if (textureObject.size !== size || textureObject.mipmap !== useMipmaps) {
            this.data = this.generateTextureData(size);
            console.log('generating new texture', size);
            this.gl.deleteTexture(textureToUse.texture);
            textureToUse = createTexture2D(this.gl, size, useMipmaps);
        } else {
            this.gl.bindTexture(this.gl.TEXTURE_2D, textureToUse.texture);
        }

        const textureData = this.data;
        this.gl.texSubImage2D(
            this.gl.TEXTURE_2D,
            0,
            0,
            0,
            size,
            size,
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