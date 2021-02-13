#include <packing>

varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform sampler2D tDepth;

/*
Camera informations
*/
uniform float cameraNear;
uniform float cameraFar;
uniform mat4 projectionInverseMatrix;
uniform mat4 cameraWorldInverseMatrix;


const int NumScatterPoints = 10;
const int NumOpticalDepthPoints = 10;


vec3 planetCenter = vec3(0, 0, 50.0);
float atmosphereRadius = 100.0;
float planetRadius = 25.0;
float atmosphereDensityFallof = 10.0;
vec3 waveLengths = vec3(700, 530, 440);
float scatteringStrength = 1.0;

struct RaySphereTraceResult {
    float atmosphereDistanceIn;
    float atmosphereDistanceOut;
};



float getlinearDepth(vec2 coord ) {
    float fragCoordZ = texture2D( tDepth, coord ).x;
    float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
    return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
}


float atmosphereDistanceIn;
float atmosphereDistanceOut;



float getAtmosphereDensityAtLocation(vec3 location) {
    float groundDistance = length(location - planetCenter) - planetRadius;
    float heightFactor = groundDistance / (atmosphereRadius - planetRadius);
    return exp(-heightFactor * atmosphereDensityFallof) * (1.0 - heightFactor);
}

float opticalDepth(vec3 rayOrigin, vec3 rayDir, float rayLength) {
    vec3 densitySamplePoint = rayOrigin;
    float stepSize = rayLength / (float(NumOpticalDepthPoints) - 1.0);
    float opticalDepthValue = 0.0;

    for (int i = 0; i < NumOpticalDepthPoints; ++i) {
        float localDensity = getAtmosphereDensityAtLocation(densitySamplePoint);
        opticalDepthValue += localDensity * stepSize;
        densitySamplePoint += rayDir * stepSize;
    }
    return opticalDepthValue;
}


RaySphereTraceResult raySphereIntersection(vec3 spherePosition, float sphereRadius, vec3 lineDirection, vec3 lineOrigin) {
    float AMdist = dot(lineDirection, spherePosition - lineOrigin);

    float AMdistAbs = abs(AMdist);

    vec3 M = lineOrigin + lineDirection * AMdist;
    float BMdist = length(spherePosition - M);
    float MCdist = sqrt(sphereRadius * sphereRadius - BMdist * BMdist);

    float ABdist = length(lineOrigin - spherePosition);

    RaySphereTraceResult res;

    if (ABdist <= sphereRadius) {
        res.atmosphereDistanceIn = 0.0;
        res.atmosphereDistanceOut = MCdist + AMdist;
    }
    else {
        res.atmosphereDistanceIn = abs(AMdist - MCdist);
        res.atmosphereDistanceOut = abs(AMdist + MCdist);
    }

    return res;
}

float computeLight(vec3 cameraPosition, vec3 cameraDirection, float raylength, vec3 dirToSun) {
    vec3 inScatterPoint = cameraPosition;
    float step = raylength / (float(NumScatterPoints) -1.0);

    float inScatteredLight = 0.0;

    for (int i = 0; i < NumScatterPoints; ++i) {

        RaySphereTraceResult rsResult = raySphereIntersection(planetCenter, atmosphereRadius, dirToSun, inScatterPoint);
        float sunRayLength = max(0.0, rsResult.atmosphereDistanceOut - rsResult.atmosphereDistanceIn);
        float sunRayOpticalDepth = opticalDepth(inScatterPoint, dirToSun, sunRayLength);
        float viewRayOpticalDepth = opticalDepth(inScatterPoint, -cameraDirection, step * float(i));
        float transmittance = exp(-(sunRayOpticalDepth + viewRayOpticalDepth));
        float localDensity = getAtmosphereDensityAtLocation(inScatterPoint);

        inScatteredLight += localDensity * transmittance * step;
        inScatterPoint += cameraDirection * step;
    }
    return inScatteredLight;
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


vec3 getSceneWorldDirection() {
    // compute clip space direction
    vec4 clipSpacePosition = vec4(vUv * 2.0 - 1.0, 1.0, 1.0);

    // Transform local space to view space
    vec4 viewSpacePosition = projectionInverseMatrix * clipSpacePosition;

    viewSpacePosition /= viewSpacePosition.w;

    // Transform view space to world space
    vec4 worldSpacePosition = cameraWorldInverseMatrix * viewSpacePosition;
    return normalize(worldSpacePosition.xyz);
}

void main() {
    float depth = getlinearDepth(vUv);
    vec4 color = texture2D(tDiffuse, vUv);


    vec3 cameraDirection = getSceneWorldDirection();
    vec3 dirToSun = normalize(vec3(1, 1, 1));


    RaySphereTraceResult hitInfo = raySphereIntersection(planetCenter, atmosphereRadius, cameraDirection, cameraPosition);
    float distanceThroughAtmosphere = hitInfo.atmosphereDistanceOut - hitInfo.atmosphereDistanceIn;


    if (distanceThroughAtmosphere <= 0.0) gl_FragColor = color;
    else {
        vec3 pointInAtmosphere = cameraPosition + cameraDirection * hitInfo.atmosphereDistanceIn;
        float light = computeLight(pointInAtmosphere, cameraDirection, distanceThroughAtmosphere, dirToSun);

        gl_FragColor = color * (1.0 - light) + light;
    }


}