import * as THREE from '../threejs/build/three.module.js';
import {Quaternion, Vector3} from "../threejs/build/three.module.js";
import { ArrowHelper } from "../threejs/src/helpers/ArrowHelper.js";

export { Plane }

const UpVector = new Vector3(0, 0, 1);

class Plane {

    constructor(inScene, inMesh, debug = false) {
        this.scene = inScene;
        this.position = new THREE.Vector3(0, 0, 100);
        this.velocity = new THREE.Vector3(200, 0, 0);
        this.rotation = new THREE.Quaternion().identity();
        this.debug = debug;
        if (debug) {
            this.debugDirectionArrow = new ArrowHelper(this.velocity, this.position, 100, 0xffff00);
            this.debugDirectionXArrow = new ArrowHelper(this.velocity, this.position, 100, 0xff0000);
            this.debugDirectionYArrow = new ArrowHelper(this.velocity, this.position, 100, 0x00ff00);
            this.debugDirectionZArrow = new ArrowHelper(this.velocity, this.position, 100, 0x0000ff);
            this.scene.add(this.debugDirectionArrow);
            this.scene.add(this.debugDirectionXArrow);
            this.scene.add(this.debugDirectionYArrow);
            this.scene.add(this.debugDirectionZArrow);
            this.normalizedDebugForward = new Vector3();
            this.forwardDebugVector = new Vector3();
            this.rightDebugVector = new Vector3();
            this.upDebugVector = new Vector3();
        }

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

        if (deltaTime > 1/30) deltaTime = 1/30;

        if (this.pause) return;

        const inputMult = 1;

        this.InputRotationVector.x = this.rollInput;
        this.InputRotationVector.y = this.pitchInput;
        this.InputRotationVector.z = this.yawInput;


        this.InputQuaternion.set(this.InputRotationVector.x * deltaTime * inputMult, this.InputRotationVector.y * deltaTime * inputMult, this.InputRotationVector.z * deltaTime * inputMult, 1).normalize();
        this.rotation.multiply(this.InputQuaternion);

        this.forwardVector.set(1,0,0).applyQuaternion(this.rotation);

        //this.velocity.set(0,0,0).addScaledVector(this.forwardVector, 200)

        let acceleration = 100;
        let drag = 0.0001;

        this.velocity.addScaledVector(this.forwardVector, acceleration * deltaTime);

        this.velocity.addScaledVector(this.velocity, -this.velocity.length() * this.velocity.length() * drag * deltaTime)

        this.velocity.addScaledVector(UpVector, -9.81 * deltaTime);

        // tp au centre en cas de soucis
        if (this.position.length() > 10000)  {
            this.position.set(0, 0, 50);
            this.velocity.set(200, 0, 0);
        }

        this.position.addScaledVector(this.velocity, deltaTime);
        this.mesh.position.copy(this.position);
        this.mesh.quaternion.copy(this.rotation);

        this.updateDebug();
    }

    updateDebug() {
        if (this.debug) {

            this.forwardDebugVector.set(1,0,0);
            this.rightDebugVector.set(0,1,0);
            this.upDebugVector.set(0,0,1);

            this.forwardDebugVector.applyQuaternion(this.rotation);
            this.rightDebugVector.applyQuaternion(this.rotation);
            this.upDebugVector.applyQuaternion(this.rotation);

            this.forwardDebugVector.normalize();
            this.rightDebugVector.normalize();
            this.upDebugVector.normalize();

            this.normalizedDebugForward.set(this.velocity.x, this.velocity.y, this.velocity.z);
            this.normalizedDebugForward.normalize();

            this.debugDirectionArrow.position.copy(this.position);
            this.debugDirectionXArrow.position.copy(this.position);
            this.debugDirectionYArrow.position.copy(this.position);
            this.debugDirectionZArrow.position.copy(this.position);

            this.debugDirectionArrow.setDirection(this.normalizedDebugForward);
            this.debugDirectionXArrow.setDirection(this.forwardDebugVector);
            this.debugDirectionYArrow.setDirection(this.rightDebugVector);
            this.debugDirectionZArrow.setDirection(this.upDebugVector);

            this.debugDirectionArrow.setLength(this.velocity.length());
            this.debugDirectionXArrow.setLength(10);
            this.debugDirectionYArrow.setLength(10);
            this.debugDirectionZArrow.setLength(10);
        }
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