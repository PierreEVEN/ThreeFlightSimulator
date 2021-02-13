import * as THREE from "../threejs/build/three.module.js";
import {OrbitControls} from "../threejs/examples/jsm/controls/OrbitControls.js";
import {RESOURCE_MANAGER} from "./io/resourceManager.js";

export { DevGamemode }

class DevGamemode {

    constructor() {
        this.sunDirectionVector = new THREE.Vector3(0, 1, -1);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
        this.camera.up = new THREE.Vector3(0, 0, 1);
        this.scene = new THREE.Scene();

        this.scene.add(new THREE.AmbientLight())

        this.controller = new OrbitControls(this.camera, document.getElementById('game'));

        this.camera.position.x = 2;
    }

    update(deltaTime) {
        if (!this.bg) {
            this.bg = true;
            this.createBG();
        }

        this.controller.update();
    }



    createBG() {
        this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshPhysicalMaterial({map: RESOURCE_MANAGER.TreeImpostor.colorTarget.texture})));

        const instCount = 20;
        const spacing = 2;

        let mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), RESOURCE_MANAGER.TreeImpostor.material, instCount * instCount);
        mesh.position.z += 0.5;
        mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
        let Mat = new THREE.Matrix4();

        for (let x = 0; x < instCount; ++x) {
            for (let y = 0; y < instCount; ++y) {
                Mat.identity();
                Mat.compose(new THREE.Vector3(x * spacing, y * spacing), new THREE.Quaternion().identity(), new THREE.Vector3(1, 1, 1));
                mesh.setMatrixAt(x + y * instCount, Mat);
            }
        }

        this.scene.add(mesh);
    }
}
