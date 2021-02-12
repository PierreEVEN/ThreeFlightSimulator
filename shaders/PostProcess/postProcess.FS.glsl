#include <packing>

varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform float cameraNear;
uniform float cameraFar;

uniform mat4 projectionInverseMatrix;
uniform mat4 cameraWorldInverseMatrix;

float getlinearDepth(vec2 coord ) {
    float fragCoordZ = texture2D( tDepth, coord ).x;
    float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
    return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
}

vec3 getSceneWorldPosition() {
    // Get z depth
    float zDepth = texture2D( tDepth, vUv ).x * 2.0 - 1.0;

    // compute clip space depth
    vec4 clipSpacePosition = vec4(vUv * 2.0 - 1.0, zDepth, 1.0);

    // Transform local space to view space
    vec4 viewSpacePosition = projectionInverseMatrix * clipSpacePosition;

    viewSpacePosition /= viewSpacePosition.w;

    // Transform view space to world space
    vec4 worldSpacePosition = cameraWorldInverseMatrix * viewSpacePosition;
    return worldSpacePosition.xyz;
}

void main() {
    float depth = getlinearDepth(vUv);


    vec4 color = texture2D(tDiffuse, vUv);

    vec3 worldPosition = getSceneWorldPosition();

    gl_FragColor = vec4(cameraPosition - worldPosition, 1);


    float z = length(worldPosition) / 100000.0;
    z = z > 1.0 ? 1.0 : z < 0.0 ? 0.0 : z;


    float consts = 0.5;
    //color = mix(color, vec4(consts), z );

    gl_FragColor = color;
}