export class Renderer {
    positionBuffer: WebGLBuffer;
    texcoordBuffer: WebGLBuffer;
    frameLoc: WebGLUniformLocation;
    frameCount: number = 0;
    programs: { program: WebGLProgram, textureLoc: WebGLUniformLocation, frameLoc: WebGLUniformLocation, positionLoc: GLint, texcoordLoc: GLint }[];
    constructor(
        private gl: WebGL2RenderingContext,
        inputPrograms: WebGLProgram[],
        positions: Float32Array,
        texcoords: Float32Array,
    ) {
        this.positionBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        this.texcoordBuffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW);

        this.programs = [];
        for (const program of inputPrograms) {
            this.programs.push({
                program: program,
                textureLoc: gl.getUniformLocation(program, 'u_texture')!,
                frameLoc: gl.getUniformLocation(program, 'u_frame')!,
                positionLoc: gl.getAttribLocation(program, 'position'),
                texcoordLoc: gl.getAttribLocation(program, 'texcoord'),
            });
        }
    }

    render(programIndex: number, textureObject: { texture: WebGLTexture, size: number }): void {
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        const config = this.programs[programIndex];
        this.gl.useProgram(config.program);
        this.gl.uniform1ui(config.frameLoc, this.frameCount);

        this.gl.activeTexture(this.gl.TEXTURE0);  // Specify texture unit 0
        this.gl.bindTexture(this.gl.TEXTURE_2D, textureObject.texture);
        this.gl.uniform1i(config.textureLoc, 0);

        this.gl.enableVertexAttribArray(config.positionLoc);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.vertexAttribPointer(config.positionLoc, 2, this.gl.FLOAT, false, 0, 0);

        this.gl.enableVertexAttribArray(config.texcoordLoc);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texcoordBuffer);
        this.gl.vertexAttribPointer(config.texcoordLoc, 2, this.gl.FLOAT, false, 0, 0);

        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        this.frameCount++;
    }
}