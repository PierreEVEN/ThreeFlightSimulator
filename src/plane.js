import * as THREE from '../threejs/build/three.module.js';
import {Quaternion, Vector3} from "../threejs/build/three.module.js";

export { Plane }


class Plane {

    constructor(inScene, inMesh) {
        this.scene = inScene;
        this.position = new THREE.Vector3(0, 0, 100);
        this.velocity = new THREE.Vector3(200, 0, 0);
        this.rotation = new THREE.Quaternion().identity();

        this.pause = true;
        this.mesh = inMesh;

        this.engineInput = 0;
        this.rollInput = 0;
        this.pitchInput = 0;
        this.yawInput = 0;

        this.InputRotationVector = new Vector3();
        this.InputQuaternion = new Quaternion().identity();
        this.forwardVector = new Vector3();


        this.update(0);
    }

    update(deltaTime) {

        if (this.pause) return;

        const inputMult = 0.5;

        this.InputRotationVector.x = this.rollInput;
        this.InputRotationVector.y = this.pitchInput;
        this.InputRotationVector.z = this.yawInput;


        this.InputQuaternion.set(this.InputRotationVector.x * deltaTime * inputMult, this.InputRotationVector.y * deltaTime * inputMult, this.InputRotationVector.z * deltaTime * inputMult, 1).normalize();
        this.rotation.multiply(this.InputQuaternion);

        this.forwardVector.set(1,0,0).applyQuaternion(this.rotation);

        this.velocity.set(0,0,0).addScaledVector(this.forwardVector, 200)


        this.position.addScaledVector(this.velocity, deltaTime);
        this.mesh.position.copy(this.position);
        this.mesh.quaternion.copy(this.rotation);
    }

    setEngineInput(value) {
        this.engineInput = value;
    }

    setRollInput(value) {
        this.rollInput = value;
    }

    setPitchInput(value) {
        this.pitchInput = value;
    }

    setYawInput(value) {
        this.yawInput = value;
    }

}