import * as THREE from "../threejs/build/three.module.js";
import {OrbitControls} from "../threejs/examples/jsm/controls/OrbitControls.js";

export { DevGamemode }

class DevGamemode {

    constructor() {
        this.sunDirectionVector = new THREE.Vector3(0, 1, -1);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
        this.scene = new THREE.Scene();

        this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.MeshPhysicalMaterial()))


        this.scene.add(new THREE.Mesh(new THREE.TorusGeometry(20, 20), new THREE.MeshPhysicalMaterial()))

        this.controller = new OrbitControls(this.camera, document.getElementById('game'));

    }

    update(deltaTime) {
        this.controller.update();
    }
}
