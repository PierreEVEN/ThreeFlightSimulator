varying vec3 pNormal;
varying vec3 pColor;
varying vec2 pUv;
varying vec3 pPosition;
varying float pDepth;

uniform sampler2D noise;

uniform sampler2D grass1;
uniform sampler2D grass2;

uniform sampler2D rock1;
uniform sampler2D rock2;

uniform sampler2D snow1;
uniform sampler2D sand1;

uniform sampler2D waterDisp;
uniform sampler2D waterNorm;

uniform float time;

void main() {
	float slope = dot(abs(pNormal), vec3(0,0,1));

	/*
	Plains texture
	*/

	//Randomize texture
	vec3 rockColor = mix(texture2D(rock1, pPosition.xy * 0.02).xyz, texture2D(rock2, pPosition.xy * 0.03).xyz, texture2D(noise, pPosition.xy * 0.001).x);
	vec3 grassColor = mix(texture2D(grass1, pPosition.xy * 0.02).xyz, texture2D(grass2, pPosition.xy * 0.03).xyz, texture2D(noise, pPosition.xy * 0.013).x) * vec3(1, 1.3, 1);

	//Merge rock and grass by normal
	vec3 plainColor = mix(rockColor, grassColor, pow(abs(slope), 20.0));

	/*
	Snow texture
	*/
	vec3 snowColor = texture2D(snow1, pPosition.xy * 0.001).xyz;

	/*
	Sand texture
	*/
	vec3 sandColor = texture2D(sand1, pPosition.xy * 0.01).xyz;

	/*
	Final merge
	*/
	//Merge snow
	vec3 finalColor = mix(plainColor, snowColor, max(0.0, min(1.0, (pPosition.z - 300.0 + texture2D(noise, pPosition.xy * 0.0003).x * 50.0) / 20.0)));
	// Merge sand
	finalColor = mix(sandColor, finalColor, max(0.0, min(1.0, (pPosition.z - 25.0 + texture2D(noise, pPosition.xy * 0.0003).x * 5.0) / 5.0)));

	float foam =
	texture2D(waterDisp, pPosition.xy * 0.02 + vec2(time, time) * 0.02).x *
	texture2D(waterDisp, pPosition.xy * 0.008 + vec2(time, -time) * 0.015).x *
	texture2D(waterDisp, pPosition.xy * 0.002 + vec2(-time, -time) * 0.01).x;

	vec3 oceanColor = mix(vec3(.25, .55, .8), vec3(.9, .9, 1), foam * max(0.0, (1.0 - pDepth / 20.0))) * max(0.2, (1.0 - pDepth / 50.0));

	/*
	Handle oceans
	*/
	finalColor = mix(finalColor, oceanColor, max(0.0, min(1.0, (pDepth))));


	gl_FragColor = vec4(finalColor, 1);
}