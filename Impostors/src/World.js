import {Matrix3} from "../threejs/build/three.module.js";

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
		this.directionalLight.position.set(0, 1, 1);
		this.scene.add(this.ambiantLight);
		this.scene.add(this.directionalLight);

		this.scene.add(camera);
		let uniforms = {
			captureRadius: { value: RESOURCE_MANAGER.captureRadius},
			testImpostor: {type: 't', value: RESOURCE_MANAGER.TEST.texture},
			testImpostorSimplified: {type: 't', value: RESOURCE_MANAGER.TEST.texture},
		}

		let base = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 1, 100, 100), new THREE.MeshPhysicalMaterial({map:RESOURCE_MANAGER.texture_forestGround}))
		base.position.z -= 1;
		this.scene.add(base);



		let impostorMat_Instancing = new THREE.ShaderMaterial( {
			uniforms: uniforms,
			//wireframe:true,
			//vertexColors: true,
			vertexShader: RESOURCE_MANAGER.vertexShader_impostors,
			fragmentShader: RESOURCE_MANAGER.fragmentShader_impostors,
		});
		impostorMat_Instancing.captureRadius = RESOURCE_MANAGER.captureRadius;
		impostorMat_Instancing.testImpostor = RESOURCE_MANAGER.TEST.texture;
		impostorMat_Instancing.testImpostorSimplified = RESOURCE_MANAGER.TEST.texture;

		const instCount = 1000;
		const spacing = 0.6;
		const matrix = new THREE.Matrix4();
		let instMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(), impostorMat_Instancing, instCount * instCount);
		instMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);


		for (let x = 0; x < instCount; ++x) {
			for (let y = 0; y < instCount; ++y) {
				matrix.identity();
				matrix.setPosition((x - instCount / 2) * spacing + Math.random() * spacing, (y - instCount / 2) * spacing + Math.random() * spacing, 0);
				instMesh.setMatrixAt(x + y * instCount, matrix);
			}
		}
		this.scene.add(instMesh);

	}

	tick(deltaTime) {
	}
}