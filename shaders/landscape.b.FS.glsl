
	float slope = dot(abs(worldNormal), vec3(0,0,1));

	/*
	Plains texture
	*/

	//Randomize texture
	vec3 rockColor = mix(texture2D(rock1, pPosition.xy * 0.1).xyz, texture2D(rock2, pPosition.xy * 0.03).xyz, texture2D(noise, pPosition.xy * 0.031).x);
	vec3 grassColor = mix(
		texture2D(grass1, pPosition.xy * 0.005).xyz,
		texture2D(grass2, pPosition.xy * 0.12).xyz,
		texture2D(noise, pPosition.xy * 0.013).x
	) * vec3(1, 1.3, 1);

	//Merge rock and grass by normal
	vec3 plainColor = mix(rockColor, grassColor, pow(abs(slope), 20.0));

	/*
	Snow texture
	*/
	vec3 snowColor = texture2D(snow1, pPosition.xy * 0.001).xyz;

	/*
	Sand texture
	*/
	vec3 sandColor = texture2D(sand1, pPosition.xy * 0.04).xyz;

	/*
	Final merge
	*/
	//Merge snow
	vec3 groundColor = mix(plainColor, snowColor, max(0.0, min(1.0, (pPosition.z - 2500.0 + texture2D(noise, pPosition.xy * 0.0001).x * 800.0) / 100.0)));
	// Merge sand
	groundColor = mix(sandColor, groundColor, max(0.0, min(1.0, (pPosition.z - 5.0 + texture2D(noise, pPosition.xy * 0.0003).x * 5.0) / 5.0)));

	float foam =
	texture2D(waterDisp, pPosition.xy * 0.02 + vec2(time, time) * 0.02).x *
	texture2D(waterDisp, pPosition.xy * 0.008 + vec2(time, -time) * 0.015).x *
	texture2D(waterDisp, pPosition.xy * 0.002 + vec2(-time, -time) * 0.01).x;

	vec3 oceanColor = mix(vec3(.25, .55, .8), vec3(.9, .9, 1), foam * max(0.0, (1.0 - pDepth / 20.0))) * max(0.2, (1.0 - pow(pDepth, 0.5) / 20.0));

	/*
	Handle oceans
	*/
	groundColor = pPosition.z < 0.1 ? oceanColor : groundColor;


	diffuseColor.xyz *= groundColor;