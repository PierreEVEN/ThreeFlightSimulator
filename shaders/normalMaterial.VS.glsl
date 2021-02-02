varying vec3 pNormal;

void main() {

	pNormal = normal;

	// Compute vertex position
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}