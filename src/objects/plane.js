import * as THREE from '../../threejs/build/three.module.js';
import {Quaternion, Vector3, Matrix4} from "../../threejs/build/three.module.js";
import { ArrowHelper } from "../../threejs/src/helpers/ArrowHelper.js";
import {addInputPressAction} from "../io/inputManager.js";

export { Plane }

const UpVector = new Vector3(0, 0, 1);

class Plane {

    constructor(inScene, inMesh, debug = false) {
        this.scene = inScene;
        this.position = new THREE.Vector3(0, 0, 400);
        this.rotation = new THREE.Quaternion().identity();
        this.inverseRotation = new Quaternion();
        this.pause = false;
        this.mesh = inMesh;

        /*
        Debug
         */
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
        }
        this.relativeVelocity = new Vector3();
        this.upLift = 0;
        this.rightLift = 0;

        /*
        Relative axis
         */
        this.forwardVector = new Vector3();
        this.rightVector = new Vector3();
        this.upVector = new Vector3();

        /*
        Inputs
         */
        this.desiredEngineInput = 0.5;
        this.desiredRollInput = 0.0;
        this.desiredPitchInput = 0.0;
        this.desiredYawInput = 0.0;
        this.engineInput = 0.5;
        this.rollInput = 0.0;
        this.pitchInput = 0.0;
        this.yawInput = 0.0;

        /*
        Maths
         */
        this.rollRotationRate = 0;
        this.pitchRotationRate = 0;
        this.yawRotationRate = 0;
        this.rotationVelocity = new Quaternion().identity();
        this.velocity = new THREE.Vector3(200, 0, 0);

        this.tempVectorA = new Vector3();

        // Constants
        this.dragCoefficient = 0.000001;
        this.upLiftCoefficient = 0.02;
        this.rightLiftCoefficient = 0.002;

        addInputPressAction("Pause", () => { this.pause = !this.pause; });

        this.update(0);
    }

    updateRotations(deltaTime) {

        this.rollRotationRate += this.rollInput * deltaTime * 10;
        this.pitchRotationRate += this.pitchInput * deltaTime * 2;
        this.yawRotationRate += this.yawInput * deltaTime * 1;

        this.rollRotationRate -= this.rollRotationRate * 4 * deltaTime;
        this.pitchRotationRate -= this.pitchRotationRate * 4 * deltaTime;
        this.yawRotationRate -= this.yawRotationRate * 5 * deltaTime;

        // Apply rotation
        this.rotationVelocity.set(this.rollRotationRate * deltaTime, this.pitchRotationRate * deltaTime, this.yawRotationRate * deltaTime, 1).normalize();
        this.rotation.multiply(this.rotationVelocity);
    }

    FlerpConstant(current, desired, speed, delta) {
        let movement = speed * delta;
        if (desired > current) return Math.min(desired, current + movement);
        else return Math.max(desired, current - movement);
    }

    updateInputs(deltaTime) {
        this.rollInput = this.FlerpConstant(this.rollInput, this.desiredRollInput, 5, deltaTime);
        this.pitchInput = this.FlerpConstant(this.pitchInput, this.desiredPitchInput, 5, deltaTime);
        this.yawInput = this.FlerpConstant(this.yawInput, this.desiredYawInput, 5, deltaTime);
        this.engineInput = this.FlerpConstant(this.engineInput, this.desiredEngineInput, 5, deltaTime);
    }

    updateVelocity(deltaTime) {

        // Gravity
        this.velocity.addScaledVector(UpVector, -9.81 * deltaTime);

        // Compute lifts with normalized velocity
        this.tempVectorA.copy(this.velocity).normalize();
        this.upLift = (this.upVector.dot(this.tempVectorA)) * this.upLiftCoefficient * this.velocity.length() * this.velocity.length() * -1;
        this.tempVectorA.copy(this.velocity).normalize();
        this.rightLift = (this.rightVector.dot(this.tempVectorA)) * this.rightLiftCoefficient * this.velocity.length() * this.velocity.length() * -1;

        // Switch to relative velocity
        this.inverseRotation.copy(this.rotation); // compute inverse rotation
        this.inverseRotation.invert();
        this.velocity.applyQuaternion(this.inverseRotation); // apply inverse rotation
        {
            // Add thrust
            let acceleration = 13 * this.engineInput;
            this.velocity.x += acceleration * deltaTime;

            // Add lifts
            this.velocity.y += this.rightLift * deltaTime;
            this.velocity.z += this.upLift * deltaTime;

            // Save relative velocity for debug purposes
            this.relativeVelocity.copy(this.velocity);
        }
        // Switch to absolute velocity
        this.velocity.applyQuaternion(this.rotation);

        // Add drag
        this.velocity.addScaledVector(this.velocity, -this.velocity.length() * this.velocity.length() * this.dragCoefficient * deltaTime);
    }


    applyPosition() {

        // Move mesh
        this.mesh.position.copy(this.position);
        this.mesh.quaternion.copy(this.rotation);

        // Update debug draws
        this.updateDebug();

        // Teleport plane to zero in case of physic bug
        if (this.position.length() > 5000000)  {
            this.position.set(0, 0, 400);
            this.velocity.set(0, 0, 0);
        }
    }

    update(deltaTime) {
        if (this.pause) {
            this.applyPosition();
            return;
        }
        if (deltaTime > 1/30) deltaTime = 1/30;

        // /!\ Compute rotation BEFORE velocity, then apply to position.
        this.updateRotations(deltaTime);

        // Compute local unit vectors
        this.forwardVector.set(1,0,0).applyQuaternion(this.rotation);
        this.rightVector.set(0,1,0).applyQuaternion(this.rotation);
        this.upVector.set(0,0,1).applyQuaternion(this.rotation);

        // Update inputs
        this.updateInputs(deltaTime);

        // Compute velocity
        this.updateVelocity(deltaTime);

        // Apply velocity to position
        this.position.addScaledVector(this.velocity, deltaTime);

        // Apply position
        this.applyPosition();
    }

    updateDebug() {
        if (this.debug) {

            this.forwardVector.normalize();
            this.rightVector.normalize();
            this.upVector.normalize();

            this.normalizedDebugForward.set(this.velocity.x, this.velocity.y, this.velocity.z);
            this.normalizedDebugForward.normalize();

            this.debugDirectionArrow.position.copy(this.position);
            this.debugDirectionXArrow.position.copy(this.position);
            this.debugDirectionYArrow.position.copy(this.position);
            this.debugDirectionZArrow.position.copy(this.position);

            this.debugDirectionArrow.setDirection(this.normalizedDebugForward);
            this.debugDirectionXArrow.setDirection(this.forwardVector);
            this.debugDirectionYArrow.setDirection(this.rightVector);
            this.debugDirectionZArrow.setDirection(this.upVector);

            this.debugDirectionArrow.setLength(this.velocity.length());
            this.debugDirectionXArrow.setLength(this.relativeVelocity.x);
            this.debugDirectionYArrow.setLength(this.relativeVelocity.y);
            this.debugDirectionZArrow.setLength(this.relativeVelocity.z);
        }
    }

    setEngineInput(value) {
        if (value < 0) value = 0;
        else if (value > 1.2) value = 1.2;
        this.desiredEngineInput = value;
    }

    setRollInput(value) {
        if (value < -1) value = -1;
        else if (value > 1) value = 1;
        this.desiredRollInput = value;
    }

    setPitchInput(value) {
        if (value < -1) value = -1;
        else if (value > 1) value = 1;
        this.desiredPitchInput = value;
    }

    setYawInput(value) {
        if (value < -1) value = -1;
        else if (value > 1) value = 1;
        this.desiredYawInput = value;
    }

}