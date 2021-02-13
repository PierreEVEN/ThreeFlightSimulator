import {Sphere} from "../threejs/build/three.module.js";

export {World};
import * as THREE from '../threejs/build/three.module.js';
import {Landscape} from './landscape.js'
import {Plane} from "./plane.js";
import {HeightGenerator} from "./HeightGenerator.js";
import {FoliageSystem} from "./foliageSystem.js";




class World {
	constructor(camera, sunDirectionVector) {
		this.camera = camera;
		// Create scene
		this.scene = new THREE.Scene();

		// Light
		const lightIntensity = 0.2;
		this.ambiantLight = new THREE.AmbientLight(new THREE.Color(lightIntensity, lightIntensity, lightIntensity));
		this.directionalLight = new THREE.DirectionalLight(0xffffff, 2);
		this.scene.add(this.ambiantLight);
		this.scene.add(this.directionalLight);

		// Create heightmap generator
		this.heightGenerator = new HeightGenerator();

		// Create foliage system
		this.foliageSystem = new FoliageSystem(this.scene, this.heightGenerator, null, camera);


		// Create landscape
		this.landscape = new Landscape(this.scene, camera, this.heightGenerator);
		this.scene.add(camera);

		this.planes = [];

		this.sunDirection = sunDirectionVector;
	}

	tick(deltaTime) {


		this.directionalLight.target.position.set(0, 0, 0);
		this.directionalLight.position.set(0,0, 0).addScaledVector(this.sunDirection, -10000)

		this.landscape.render(deltaTime);
		this.foliageSystem.update();
		for (let plane of this.planes) {
			plane.update(deltaTime);
			if (plane.position.z < this.heightGenerator.getHeightAtLocation(plane.position.x, plane.position.y)) {
				plane.position.set(0, 0, this.heightGenerator.getHeightAtLocation(0, 0) + 400);
				plane.velocity.set(0, 0, 0);
			}
		}
	}

	addPlane(mesh) {
		this.scene.add(mesh);
		const plane = new Plane(this.scene, mesh, true);
		this.planes.push(plane);
		return plane;
	}
}