export {World};
import * as THREE from '../threejs/build/three.module.js';
import {Landscape} from './landscape.js'
import {Plane} from "./plane.js";
import {HeightGenerator} from "./HeightGenerator.js";
import {FoliageSystem} from "./FoliageSystem.js";

class World {
	constructor(renderer, camera) {
		this.renderer = renderer;
		// Create scene
		this.scene = new THREE.Scene();

		// Light
		this.ambiantLight = new THREE.AmbientLight(new THREE.Color(.3, .3, .3));
		this.directionalLight = new THREE.DirectionalLight(0xffffff, 2);
		this.directionalLight.position.set(0, 5, 0);
		this.scene.add(this.ambiantLight);
		this.scene.add(this.directionalLight);

		// Create heightmap generator
		this.heightGenerator = new HeightGenerator();

		// Create foliage system
		this.foliageSystem = new FoliageSystem(this.scene, this.heightGenerator);

		// Create landscape
		this.landscape = new Landscape(this.scene, camera, this.heightGenerator);
		this.scene.add(camera);

		this.planes = [];
	}

	tick(deltaTime) {
		this.landscape.render(deltaTime);
		for (let plane of this.planes) {
			plane.update(deltaTime);
			if (plane.position.z < this.heightGenerator.getHeightAtLocation(plane.position.x, plane.position.y)) {
				plane.position.set(0, 0, 100);
				plane.velocity.set(100, 0, 0);
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