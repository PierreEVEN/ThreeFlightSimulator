varying vec3 pNormal;
varying vec3 pColor;
varying vec3 pPosition;
varying vec2 pUV;

uniform sampler2D testImpostor;
uniform sampler2D testImpostorSimplified;

void main() {

	vec4 color = texture2D(testImpostorSimplified, pUV);
	if (color.a < 0.95) discard;

	gl_FragColor = color * 2.0;
}