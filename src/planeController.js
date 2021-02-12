import * as THREE from "../threejs/build/three.module.js";
import {MathUtils} from "../threejs/src/math/MathUtils.js";
import {addInputPressAction, getInputValue} from "./io/inputManager.js";
import {getHeightAtLocation} from "./HeightGenerator.js";

export {PlaneController};


let PlaneController = function ( inPlane, inCamera, inLandscape) {

    /*
    Camera settings
     */
    this.minPitch = -80;
    this.maxPitch = 80;

    this.minYaw = -180;
    this.maxYaw = 180;

    this.mouseSensitivity = 0.5;

    this.maxDistance = 100;
    this.minDistance = 10;

    /*
    States
     */
    this.distance = 40;
    this.attached = true;
    this.acceleration = 10;
    this.isFPS = false;

    this.pitch = 0;
    this.yaw = 0;

    this.velocity = new THREE.Vector3(0,0,0);
    this.cameraForwardVector = new THREE.Vector3();
    this.cameraRotationEuler = new THREE.Euler(0,0,0, 'ZYX');
    this.cameraRotationQuaternion = new THREE.Quaternion();
    this.cameraMatrix = new THREE.Matrix4();
    this.cameraScale = new THREE.Vector3(1,1,1);
    this.upVector = new THREE.Vector3(0, 0, 1);
    this.rightVector = new THREE.Vector3();

    /*
    References
     */
    this.plane = inPlane;
    this.camera = inCamera;
    this.landscape = inLandscape;

    addInputPressAction("FpsView", () => { this.isFPS = !this.isFPS; });
    addInputPressAction("DetachCamera", () => { this.attached = !this.attached; });

    this.handleFpsMovements = () => {
        // Set camera position in local space
        this.camera.position.set(3.3, 0, 0.9);
        this.camera.position.y += (this.yaw + 90) / 800;
        this.camera.quaternion.setFromEuler(this.cameraRotationEuler);

        // Transform to plane space
        this.cameraMatrix.identity().compose(this.plane.position, this.plane.rotation, this.cameraScale);
        this.camera.applyMatrix4(this.cameraMatrix);
    }

    this.handleChaseMovements = () => {
        this.camera.quaternion.identity().multiply(this.cameraRotationQuaternion);
        this.camera.getWorldDirection(this.cameraForwardVector);
        this.camera.position.copy(this.plane.position);
        this.camera.position.addScaledVector(this.cameraForwardVector, -this.distance);
    }

    this.handleFreeMovements = (deltaTime) => {
        // X
        this.camera.quaternion.identity().multiply(this.cameraRotationQuaternion);
        this.camera.getWorldDirection(this.cameraForwardVector);
        this.velocity.addScaledVector(this.cameraForwardVector, getInputValue("MoveForward") * this.acceleration);

        // Y
        this.cameraForwardVector.z = 0;
        this.cameraForwardVector.normalize();
        this.cameraForwardVector.applyAxisAngle(this.upVector, Math.PI / 2);
        this.rightVector.clone(this.cameraForwardVector);
        this.velocity.addScaledVector(this.cameraForwardVector, getInputValue("MoveUp") * this.acceleration);

        // Z
        this.camera.getWorldDirection(this.upVector);
        this.upVector.z = 0;
        this.upVector.normalize();
        this.upVector.applyAxisAngle(this.cameraForwardVector, -Math.PI / 2);
        this.velocity.addScaledVector(this.upVector, getInputValue("MoveRight") * this.acceleration);

        this.camera.position.addScaledVector(this.velocity, deltaTime);
        this.velocity.multiplyScalar(1 - deltaTime * 3);
    }


    this.updateCameraLocation = (deltaTime) => {
        this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
        if (this.isFPS) this.yaw = Math.max(this.minYaw, Math.min(this.maxYaw, this.yaw + 90)) - 90;
        this.cameraRotationEuler.set(MathUtils.degToRad(this.pitch + 90), 0, MathUtils.degToRad(this.yaw), 'ZYX');
        this.cameraRotationQuaternion.setFromEuler(this.cameraRotationEuler);

        if (this.attached) {
            if (this.isFPS) this.handleFpsMovements();
            else this.handleChaseMovements();
        }
        else this.handleFreeMovements(deltaTime);
    };



    this.update = function(deltaTime) {

        this.plane.setRollInput(getInputValue("Roll"));
        this.plane.setYawInput(getInputValue("Yaw"));
        this.plane.setPitchInput(getInputValue("Pitch"));
        this.plane.setEngineInput(this.plane.engineInput - getInputValue("Throttle"));
        this.pitch += getInputValue("LookUp") * this.mouseSensitivity;
        this.yaw += getInputValue("LookRight") * this.mouseSensitivity;

        if (this.attached) {
            this.velocity.set(0,0,0);
        }
        else {
            this.acceleration = Math.max(2.0, this.acceleration + getInputValue("MoveSpeed") * -0.5);
        }

        this.updateCameraLocation(deltaTime);
        if (this.camera.position.z - 10 < getHeightAtLocation(this.camera.position.x, this.camera.position.y)) this.camera.position.z = getHeightAtLocation(this.camera.position.x, this.camera.position.y) + 10;
    }
}

PlaneController.prototype = Object.create( THREE.EventDispatcher.prototype );
PlaneController.prototype.constructor = PlaneController;