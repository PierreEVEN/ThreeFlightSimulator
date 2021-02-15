
varying vec3 pColor;
varying vec3 pPosition;
varying vec2 pUV;

uniform sampler2D colorTexture;
uniform sampler2D normalTexture;

uniform vec3 lightDir;

void main() {
	vec4 normal = texture2D(normalTexture, pUV);
	vec4 color = texture2D(colorTexture, pUV);
	if (color.a < 0.5) discard;

	gl_FragColor = (vec4(dot(normal.xyz, lightDir)) + 0.5) * color;
}