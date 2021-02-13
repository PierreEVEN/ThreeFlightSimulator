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


uniform int NumScatterPoints;
uniform int NumOpticalDepthPoints;


uniform vec3 planetCenter;
uniform float atmosphereRadius;
uniform float planetRadius;
uniform float atmosphereDensityFalloff;
uniform vec3 scatterCoefficients;
uniform vec3 sunDirection;

struct RaySphereTraceResult {
    float atmosphereDistanceIn;
    float atmosphereDistanceOut;
};




float atmosphereDistanceIn;
float atmosphereDistanceOut;



float getAtmosphereDensityAtLocation(vec3 location) {
    float groundDistance = length(location - planetCenter) - planetRadius;
    float heightFactor = groundDistance / (atmosphereRadius - planetRadius);
    return exp(-heightFactor * atmosphereDensityFalloff) * (1.0 - heightFactor);
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

vec3 computeLight(vec3 cameraPosition, vec3 cameraDirection, float raylength, vec3 dirToSun, vec3 originalColor) {
    vec3 inScatterPoint = cameraPosition;
    float step = raylength / (float(NumScatterPoints) -1.0);
    vec3 inScatteredLight = vec3(0.0);
    float viewRayOpticalDepth = 0.0;

    for (int i = 0; i < NumScatterPoints; ++i) {

        RaySphereTraceResult rsResult = raySphereIntersection(planetCenter, atmosphereRadius, dirToSun, inScatterPoint);
        float sunRayLength = max(0.0, rsResult.atmosphereDistanceOut - rsResult.atmosphereDistanceIn);
        float sunRayOpticalDepth = opticalDepth(inScatterPoint, dirToSun, sunRayLength);
        float viewRayOpticalDepth = opticalDepth(inScatterPoint, -cameraDirection, step * float(i));
        vec3 transmittance = exp(-(sunRayOpticalDepth + viewRayOpticalDepth) * scatterCoefficients);
        float localDensity = getAtmosphereDensityAtLocation(inScatterPoint);

        inScatteredLight += localDensity * transmittance * scatterCoefficients * step;
        inScatterPoint += cameraDirection * step;
    }

    float colorTransmittance = exp(-viewRayOpticalDepth);

    return originalColor * colorTransmittance + inScatteredLight;
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


float getlinearDepth(vec2 coord ) {
    float fragCoordZ = texture2D( tDepth, coord ).x;
    float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
    return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
}

void main() {
    float depth = getlinearDepth(vUv ) * (cameraFar - cameraNear) + cameraNear;
    vec4 color = texture2D(tDiffuse, vUv);


    vec3 cameraDirection = getSceneWorldDirection();
    vec3 dirToSun = sunDirection;


    RaySphereTraceResult hitInfo = raySphereIntersection(planetCenter, atmosphereRadius, cameraDirection, cameraPosition);

    vec3 sunPosition = dirToSun * 1000000.0;
    RaySphereTraceResult sunInfos = raySphereIntersection(sunPosition, 50000.0, cameraDirection, cameraPosition);
    float distanceThroughSun = max(0.0, sunInfos.atmosphereDistanceOut - sunInfos.atmosphereDistanceIn);


    float outMax = min(hitInfo.atmosphereDistanceOut, depth);
    float distanceThroughAtmosphere = outMax - hitInfo.atmosphereDistanceIn;


    if (distanceThroughAtmosphere > 0.0) {
        vec3 pointInAtmosphere = cameraPosition + cameraDirection * hitInfo.atmosphereDistanceIn;
        vec3 light = computeLight(pointInAtmosphere, cameraDirection, distanceThroughAtmosphere, dirToSun, color.xyz);

        gl_FragColor = vec4(light, 0.0);
    }
    else {
        gl_FragColor = color;
    }

    if (depth > 50000.0) gl_FragColor += vec4(1.0, .5, .2, 1.0) * min(distanceThroughSun, 1.0);

}