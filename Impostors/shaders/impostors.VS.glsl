varying vec3 pNormal;
varying vec3 pPosition;
varying vec3 pCameraPos;
varying vec2 pUV;
uniform float captureRadius;

#define PI 3.1415926538

int spherical = 1;


vec2 discretizeUvs(vec2 uvs) {
	float diameter = captureRadius * 2.0;
	return trunc(uvs * (diameter + 0.01)) / diameter;
}

vec2 calcSimpleUV(vec2 baseUV, vec3 objPosition) {

	float diameter = captureRadius * 2.0;

	vec3 cameraDir3D = normalize(cameraPosition - objPosition);
	vec3 cameraDir2D = vec3(normalize(cameraDir3D.xy), 0);

	float atlasUnit = 1.0 / diameter;

	// Compute camera angle in radians
	float radAngle = atan(cameraDir2D.y, cameraDir2D.x);

	// Convert circle unit radius to square radius from angle
	float squareScalar = min(abs(1.0 / cos(radAngle)), abs(1.0 / sin(radAngle)));

	vec2 cameraDir3DTest = normalize(objPosition.xy - cameraPosition.xy) * -1.0;
	cameraDir2D.x *= -1.0;
	vec2 outUvs = baseUV + cameraDir2D.xy * squareScalar * (atlasUnit / 2.0 + atlasUnit * (captureRadius - 1.0) * (1.0 - max(0.0, cameraDir3D.z)));

	return discretizeUvs(outUvs);
}


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


	objPosition.z += 1.0;

	// Compute UV

	// Rescale and translate UV to image center
	float diameter = captureRadius * 2.0;
	vec2 uvs = vec2(uv.y, 1.0 - uv.x) / diameter; // rotate then move to bottom right
	uvs += 0.5 - 0.5 / diameter; // move to center

	// Generate UVs
	pUV = calcSimpleUV(uvs, objPosition);

	// Compute vertex position
	gl_Position = projectionMatrix * modelView * vec4(position, 1.0);
}