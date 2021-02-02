varying vec3 pNormal;

void main() {
	gl_FragColor = vec4(pNormal, 1);
}