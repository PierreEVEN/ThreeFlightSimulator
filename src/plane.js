import * as THREE from '../threejs/build/three.module.js';

export { Plane }


class Plane {

    constructor(inScene, inMesh) {
        this.scene = inScene;
        this.position = new THREE.Vector3(0, 0, 100);
        this.velocity = new THREE.Vector3(200, 0, 0);
        this.rotation = new THREE.Quaternion().identity();

        this.mesh = inMesh;

        this.update(0);
    }



    update(deltaTime) {
        this.position.addScaledVector(this.velocity, deltaTime);
        this.mesh.position.copy(this.position);
        this.mesh.rotation.setFromQuaternion(this.rotation);
    }
}