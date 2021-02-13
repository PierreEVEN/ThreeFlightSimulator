
varying vec2 pUV;


varying vec3 test;

uniform float captureRadius;

#define HALF_PI (3.1415926538 / 2.0)
#define PI 3.1415926538
#define TWO_PI (3.1415926538 * 2.0)





vec3 getTranslation(mat4 matrix) {
    return vec3(matrix[3][0], matrix[3][1], matrix[3][2]);
}

float getYawFromDirection(vec3 direction) {
    vec2 d2Dir = normalize(direction.xy);
    if (d2Dir.y > 0.0) return acos(d2Dir.x);
    return -acos(d2Dir.x) + 2.0 * PI;
}

float getPitchFromDirection(vec3 direction) {
    return acos(-direction.z);
}

vec2 computeUVsFromStepPoint(float stepPitch, float pitchStepCount, float stepYaw, float yawStepCount) {

    float stepSize = 1.0 / (captureRadius * 2.0);


    vec2 scaledUvs = (uv) * stepSize + stepSize * (captureRadius - 0.5);



    //test.x = stepPitch + 0.5;


    float offsety = (stepPitch) / pitchStepCount / 2.0;

    scaledUvs.x += stepSize / 2.0;
    scaledUvs.y += stepSize / 2.0;

    return scaledUvs;
}



// Only compatible with instanced meshes
void main() {
    vec3 instancePosition = getTranslation(instanceMatrix);
    vec3 objDirection = normalize(instancePosition - cameraPosition);

    // Create raw instance transform matrix
    mat4 instanceTransform = mat4(
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    instancePosition.x, instancePosition.y, instancePosition.z, 1
    );

    float pitch = getPitchFromDirection(objDirection);
    pitch = min(PI / 2.0, pitch); // We only use the top hemisphere

    // Round pitch to closest camera shot
    float pitchStep = round((pitch / HALF_PI) * captureRadius);
    pitch = pitchStep / captureRadius * HALF_PI;


    // Compute yaw steps from pitch current step
    float yawSteps = pitchStep * 8.0 - 4.0;

    // Create a rotation matrix from pitch angle
    mat4 pitchRotationMatrix = mat4(
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
    );
    pitchRotationMatrix[0][0] = cos(pitch); pitchRotationMatrix[0][2] = sin(pitch);
    pitchRotationMatrix[2][0] = -sin(pitch); pitchRotationMatrix[2][2] = cos(pitch);

    // Rotate object matrix according to yaw angle
    float yaw = -getYawFromDirection(objDirection);

    // Round yaw to closest camera shot
    float yawStep = round((yaw / TWO_PI) * yawSteps);
    yaw = yawStep / yawSteps * TWO_PI;



    instanceTransform[0][0] =+ cos(yaw); instanceTransform[0][1] = -sin(yaw);
    instanceTransform[1][0] = sin(yaw); instanceTransform[1][1] = cos(yaw);

    // Combine rotations
    instanceTransform *= pitchRotationMatrix;

    // Send modified UVs
    pUV = computeUVsFromStepPoint(pitchStep, captureRadius, yawStep, yawSteps);

    // Apply vertex position
    gl_Position = projectionMatrix * modelViewMatrix * instanceTransform * vec4(position, 1.0);
}
