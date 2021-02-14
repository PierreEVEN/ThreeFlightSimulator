
varying vec2 pUV;



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

vec2 capturePointToUvCoordinates(float stageCaptureCount, float percentYaw) {
    if (percentYaw <= 0.25) return vec2(1.0, percentYaw * 8.0 - 1.0);
    else if (percentYaw <= 0.5) return vec2(-percentYaw * 8.0 + 3.0, 1.0);
    else if (percentYaw <= 0.75) return vec2(-1.0, -percentYaw * 8.0 + 5.0);
    else return vec2(percentYaw * 8.0 - 7.0, -1.0);
}

vec2 getTreeUVs(float r, float yawPercent) {
    float stageCaptureCount = (r * 8.0 - 4.0);

    vec2 uvPos = capturePointToUvCoordinates(stageCaptureCount, yawPercent) * (r - 0.5); // [-captureRadius + 0.5 -> captureRadius - 0.5]

    vec2 localUV = uv - 0.5; //[-0.5 -> 0.5]
    localUV /= (captureRadius * 2.0);

    localUV += uvPos / (captureRadius * 2.0);

    return localUV + 0.5;
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
    float pitchStep = max(1.0, round(pitch / HALF_PI * captureRadius)); // [1.0 -> captureRadius]
    pitch = pitchStep / captureRadius * HALF_PI; // [~1 step -> PI / 2.0]

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
    float yawStep = round((yaw / TWO_PI) * yawSteps + 0.5) - 0.5; // [0.0 -> yawSteps[

    yaw = yawStep / yawSteps * TWO_PI; // [0.0 -> TWO_PI[

    instanceTransform[0][0] =+ cos(yaw); instanceTransform[0][1] = -sin(yaw);
    instanceTransform[1][0] = sin(yaw); instanceTransform[1][1] = cos(yaw);

    // Combine rotations
    instanceTransform *= pitchRotationMatrix;

    // Send modified UVs
    pUV = getTreeUVs(pitchStep, mod(-yaw / TWO_PI + 1.0 / (yawSteps * 2.0), 1.0));

    // Apply vertex position
    gl_Position = projectionMatrix * modelViewMatrix * instanceTransform * vec4(position, 1.0);
}
