varying vec3 pNormal;
varying vec3 pPosition;
varying vec2 pUV;

int spherical = 1;

void main() {
	#ifdef USE_INSTANCING
	mat4 modelView = modelViewMatrix * instanceMatrix;
	vec3 objPosition = (instanceMatrix * vec4(0, 0, 0,1.0)).xyz;
	#else
	mat4 modelView = modelViewMatrix;
	vec3 objPosition = vec3(modelViewMatrix[0][3], modelViewMatrix[1][3], modelViewMatrix[2][3]);
	#endif

	modelView[0][0] = 1.0;
	modelView[0][1] = 0.0;
	modelView[0][2] = 0.0;

	modelView[1][0] = 0.0;
	modelView[1][1] = 1.0;
	modelView[1][2] = 0.0;

	modelView[2][0] = 0.0;
	modelView[2][1] = 0.0;
	modelView[2][2] = 1.0;

	modelView = modelView;


	// Compute UV


	// Simplified impostor version
	float z = pow(max(0.0, dot (normalize(cameraPosition - objPosition), vec3(0,0,1))), 2.0);
	float intZ = round(z * 4.0);
	pUV = uv * vec2(1.0, 1.0/5.0) + vec2(0, 1.0 - 1.0/5.0 * (5.0 - intZ));


	// Compute vertex position
	gl_Position = projectionMatrix * modelView * vec4(position,1.0);
}