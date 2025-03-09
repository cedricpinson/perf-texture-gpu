export const vertexShaderSource = `#version 300 es
in vec4 position;
in vec2 texcoord;
out vec2 v_texcoord;
void main() {
    gl_Position = position;
    v_texcoord = texcoord;
}`;

export const fragmentShaderSource = `#version 300 es
precision highp float;
uniform sampler2D u_texture;
uniform uint u_frame;
in vec2 v_texcoord;
out vec4 outColor;
void main() {
    vec2 scrolledCoord = v_texcoord;

    // Get texture size using textureSize() built-in function
    float scrollOffset = float(u_frame)/1024.0;
    scrolledCoord.y = scrolledCoord.y + scrollOffset; // Smooth vertical scrolling with wrap-around using GLSL mod function

    outColor = texture(u_texture, scrolledCoord);
}`;