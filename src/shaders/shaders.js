const visibleVertex = `#version 300 es

// Define attributes and their locations
layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec3 aNormal;
layout (location = 2) in vec2 aTexCoord;


// Define uniforms (constants)
uniform mat4 uViewModel;
uniform mat4 uProjection;
uniform vec3 uLightPosition;
uniform vec3 uLightAttenuation;

// Define varyings (outputs of vertex shader)
out vec2 vTexCoord;

out vec3 vEye;
out vec3 vLight;
out vec3 vNormal;

out float vAttenuation;

void main() {
    // Calculate vertex and light position based on camera coordinates
    vec3 vertexPosition = (uViewModel * vec4(aPosition, 1)).xyz;
    vec3 lightPosition  = (uViewModel * vec4(uLightPosition, 1)).xyz;

    vEye = -vertexPosition;
    vLight = lightPosition - vertexPosition;
    vNormal = (uViewModel * vec4(aNormal, 0)).xyz;

    float d = distance(vertexPosition, lightPosition);

    vAttenuation = 1.0 / dot(uLightAttenuation, vec3(1, d, d * d));

    // Move texture coords to a varying
    vTexCoord = aTexCoord;

    // Move homogenized vertex to position based on projection matrix
    gl_Position = uProjection * vec4(vertexPosition, 1);
}
`;

const visibleFragment = `#version 300 es

precision mediump float;

// Define uniforms (constants)
uniform mediump sampler2D uTexture;

uniform vec3 uAmbientColor;
uniform vec3 uDiffuseColor;
uniform vec3 uSpecularColor;

uniform float uShininess;

// Define needed varyings (inputs of fragment shader)
in vec3 vEye;
in vec3 vLight;
in vec3 vNormal;

in vec2 vTexCoord;

in float vAttenuation;

// Define fragment shader output
out vec4 oColor;

void main() {
    // Normalize vectors
    vec3 N = normalize(vNormal);
    vec3 L = normalize(vLight);
    vec3 E = normalize(vEye);
    vec3 R = normalize(reflect(L, N));

    // Calculate lambert and phong values
    float lambertReflect = max(0.0, dot(L, N));
    float phongReflect = pow(max(0.0, dot(E, R)), uShininess);

    // Calculate light color
    vec3 light = (uAmbientColor + (uDiffuseColor * lambertReflect) + (uSpecularColor * phongReflect)) * vAttenuation;

    // Calculate texture color based on texture and light
    oColor = texture(uTexture, vTexCoord) * vec4(light, 1);
}
`;

export const shaders = {
    visible: {
        vertex: visibleVertex,
        fragment: visibleFragment,
    },
};
