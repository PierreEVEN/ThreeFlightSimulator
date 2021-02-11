import {Euler, EventDispatcher, Matrix4, Quaternion, Vector3} from "../threejs/build/three.module.js";
import {MathUtils} from "../threejs/src/math/MathUtils.js";
import {RESOURCE_MANAGER} from "./resourceManager.js";
import {
    addInputPressAction,
    addKeyInput,
    addMouseAxisInput,
    getInputValue
} from "./io/inputManager.js";

export {PlaneController};


let PlaneController = function ( inPlane, inCamera, inLandscape) {

    this.distance = 40;
    this.pitch = 0;
    this.yaw = 0;
    this.eulerRotation = new Euler(0,0,0, 'ZYX');
    this.landscape = inLandscape;

    /*
    Inputs
     */
    this.gamepads = [];

    /*
    Camera settings
     */
    this.minPitch = -80;
    this.maxPitch = 80;

    this.minYaw = -180;
    this.maxYaw = 180;

    this.isFPS = false;
    this.mouseSensitivity = 0.5;


    this.plane = inPlane;
    this.camera = inCamera;

    addInputPressAction("Wireframe", () => {
        this.landscape.LandscapeMaterial.wireframe = !this.landscape.LandscapeMaterial.wireframe;
        RESOURCE_MANAGER.TreeImpostor.material.wireframe = this.landscape.LandscapeMaterial.wireframe;
    })
    addInputPressAction("Pause", () => { this.plane.pause = !this.plane.pause; })
    addInputPressAction("FpsView", () => { this.isFPS = !this.isFPS; })

    this.mousedown = function ( event ) {}
    this.mouseup = function ( event ) {}

    this.mousemove = function ( event ) {
    }

    this.updateMouse = function() {
        this.eulerRotation.set(MathUtils.degToRad(this.pitch + 90), 0, MathUtils.degToRad(this.yaw), 'ZYX');
    }
    this.updateMouse();

    this.forwardVector = new Vector3();
    this.internOffset = new Vector3();
    this.cameraRotation = new Quaternion();
    this.testMatrix = new Matrix4();
    this.identityVec = new Vector3(1,1,1);

    this.updateControlers = function() {

        this.plane.setRollInput(getInputValue("Roll"));
        this.plane.setPitchInput(getInputValue("Pitch"));
        this.plane.setYawInput(getInputValue("Yaw"));
        this.plane.setEngineInput(this.plane.engineInput - getInputValue("Throttle"));



        this.pitch += getInputValue("LookUp") * this.mouseSensitivity;
        this.yaw += getInputValue("LookRight") * this.mouseSensitivity;

        this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
        if (this.isFPS) this.yaw = Math.max(this.minYaw, Math.min(this.maxYaw, this.yaw + 90)) - 90;
        this.updateMouse();
    }

    this.update = function(deltaTime) {
        this.updateControlers();
        this.updateMouse();
        this.cameraRotation.setFromEuler(this.eulerRotation);
        if (this.isFPS) {

            this.testMatrix.identity();
            this.testMatrix.compose(this.plane.position, this.plane.rotation, this.identityVec);

            this.camera.position.set(3.3, 0, 0.9);
            this.camera.position.y += (this.yaw + 90) / 800;
            this.camera.quaternion.setFromEuler(this.eulerRotation);
            this.camera.applyMatrix4(this.testMatrix);
        }
        else {
            this.camera.quaternion.identity();
            this.camera.quaternion.multiply(this.cameraRotation);
            this.camera.getWorldDirection(this.forwardVector);
            this.camera.position.copy(this.plane.position);
            this.camera.position.addScaledVector(this.forwardVector, -this.distance);
        }
    }
}

PlaneController.prototype = Object.create( EventDispatcher.prototype );
PlaneController.prototype.constructor = PlaneController;