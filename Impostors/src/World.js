
export {World};
import * as THREE from '../threejs/build/three.module.js';
import {RESOURCE_MANAGER} from './resourceManager.js';

class World {
	constructor(renderer, camera) {
		this.renderer = renderer;
		// Create scene
		this.scene = new THREE.Scene();

		// Light
		this.directionalLight = new THREE.DirectionalLight(0xffffff, 2);
		this.directionalLight.position.set(0, 0, 0);
		this.scene.add(this.directionalLight);

		this.scene.add(camera);

		// create ground
		let base = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 1, 100, 100), new THREE.MeshBasicMaterial({map:RESOURCE_MANAGER.texture_forestGround}))
		base.position.z -= 1;
		this.scene.add(base);
	}

	tick(deltaTime) {}
}