
varying vec2 pUV;

uniform sampler2D colorTexture;
uniform sampler2D normalTexture;

uniform vec3 lightDir;

void main() {

    vec4 normal = texture2D(normalTexture, pUV);
    vec4 color = texture2D(colorTexture, pUV);
    if (color.a < 0.2) discard;

    gl_FragColor = (vec4(1.0 - dot(normal.xyz, lightDir))) * color * pow(dot(lightDir, vec3(0.0, 0.0, -1.0)), 1.0);
}
