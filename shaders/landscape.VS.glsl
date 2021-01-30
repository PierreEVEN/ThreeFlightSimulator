varying vec3 pNormal;
varying vec3 pColor;
varying vec3 pPosition;
varying float pDepth;

void main() {
	pNormal = normal;
	pColor = color;
	pDepth = min(20.0, -position.z) + 20.0;

	vec3 finalPosition = vec3(position.x, position.y, max(20.0, position.z));

	gl_Position = projectionMatrix *
					modelViewMatrix *
					vec4(finalPosition,1.0);
	pPosition = finalPosition;
}