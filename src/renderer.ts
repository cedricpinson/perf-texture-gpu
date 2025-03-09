export class Renderer {
    positionBuffer: WebGLBuffer;
    texcoordBuffer: WebGLBuffer;
    positionLoc: number;
    texcoordLoc: number;
    frameLoc: WebGLUniformLocation;
    textureLoc: WebGLUniformLocation;
    frameCount: number = 0;
    texture: WebGLTexture;

    constructor(
        private gl: WebGL2RenderingContext,
        private program: WebGLProgram,
        positions: Float32Array,
        texcoords: Float32Array,
        texture: WebGLTexture,
    ) {
        this.texture = texture;
        this.positionBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        this.texcoordBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW);

        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        this.positionLoc = gl.getAttribLocation(program, 'position');
        this.texcoordLoc = gl.getAttribLocation(program, 'texcoord');
        this.frameLoc = gl.getUniformLocation(program, 'u_frame')!;
        this.textureLoc = gl.getUniformLocation(program, 'u_texture')!;
    }

    render(): void {
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.gl.useProgram(this.program);
        this.gl.uniform1ui(this.frameLoc, this.frameCount);
        this.frameCount++;

        this.gl.activeTexture(this.gl.TEXTURE0);  // Specify texture unit 0
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.uniform1i(this.textureLoc, 0);

        this.gl.enableVertexAttribArray(this.positionLoc);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.vertexAttribPointer(this.positionLoc, 2, this.gl.FLOAT, false, 0, 0);

        this.gl.enableVertexAttribArray(this.texcoordLoc);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texcoordBuffer);
        this.gl.vertexAttribPointer(this.texcoordLoc, 2, this.gl.FLOAT, false, 0, 0);

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
}