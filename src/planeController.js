import {Euler, EventDispatcher, Matrix4, Quaternion, Vector3} from "../threejs/build/three.module.js";
import {MathUtils} from "../threejs/src/math/MathUtils.js";
import {RESOURCE_MANAGER} from "./resourceManager.js";

export {PlaneController};


let PlaneController = function ( domElement, inPlane, inCamera, inLandscape) {

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
    let test = document.getElementById('game');
    if ( domElement === undefined ) {

        console.warn( 'THREE.FlyControls: The second parameter "domElement" is now mandatory.' );
        domElement = document;
    }

    this.domElement = domElement;

    if ( domElement ) this.domElement.setAttribute( 'tabindex', - 1 );

    this.plane = inPlane;
    this.camera = inCamera;

    this.keyup = function ( event ) {
        switch (event.code) {
            case 'KeyW':
                this.plane.setPitchInput(0);
                break;
            case 'KeyS':
                this.plane.setPitchInput(0);
                break;
            case 'KeyA':
                this.plane.setYawInput(0);
                break;
            case 'KeyD':
                this.plane.setYawInput(0);
                break;
            case 'KeyQ':
                this.plane.setRollInput(0);
                break;
            case 'KeyE':
                this.plane.setRollInput(0);
                break;
        }
    }

    this.keydown = function ( event ) {
        switch (event.code) {
            case 'F1':
                this.landscape.LandscapeMaterial.wireframe = !this.landscape.LandscapeMaterial.wireframe;
                RESOURCE_MANAGER.TreeImpostor.material.wireframe = this.landscape.LandscapeMaterial.wireframe;
                break;
            case 'KeyV':
                this.isFPS = !this.isFPS;
                break;
            case 'KeyP':
                this.plane.pause = !this.plane.pause;
                break;
            case 'KeyW':
                this.plane.setPitchInput(1);
                break;
            case 'KeyS':
                this.plane.setPitchInput(-1);
                break;
            case 'KeyA':
                this.plane.setYawInput(1);
                break;
            case 'KeyD':
                this.plane.setYawInput(-1);
                break;
            case 'KeyQ':
                this.plane.setRollInput(-1);
                break;
            case 'KeyE':
                this.plane.setRollInput(1);
                break;
        }
    }

    this.mousedown = function ( event ) {}
    this.mouseup = function ( event ) {}

    this.mousemove = function ( event ) {
        this.pitch += -event.movementY * this.mouseSensitivity;
        this.yaw += -event.movementX * this.mouseSensitivity;

        this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
        if (this.isFPS) this.yaw = Math.max(this.minYaw, Math.min(this.maxYaw, this.yaw + 90)) - 90;
        this.updateMouse();
    }

    this.updateMouse = function() {
        // Update camera rotation
        this.eulerRotation.set(MathUtils.degToRad(this.pitch + 90), 0, MathUtils.degToRad(this.yaw), 'ZYX');
    }
    this.updateMouse();

    this.mouseWheel = function (event) {
        if (this.isFPS || true) {
            this.plane.setEngineInput(this.plane.engineInput - event.deltaY * 0.02);
        }
        else {
            this.distance += event.deltaY;
        }
    }

    this.forwardVector = new Vector3();
    this.internOffset = new Vector3();
    this.cameraRotation = new Quaternion();
    this.testMatrix = new Matrix4();
    this.identityVec = new Vector3(1,1,1);

    this.updateControlers = function() {

        for (let j = 0; j < this.gamepads.length; ++j) {
            let controller = this.gamepads[j].gamepad;
            if (!controller || !controller.buttons) continue;
            for (var i = 0; i < controller.axes.length; i++) {
                //var b = buttons[i];
                let val = controller.axes[i];
                //console.log(val);//'axe : ' + i + ' value = ' + val.value);
                if (j == 0) {
                    switch (i) {
                        case 0:
                            this.plane.setRollInput(val);
                            break;
                        case 1:
                            this.plane.setEngineInput(1.2 - (val / 2 + 0.5) * 1.2);
                            break;
                        case 6:
                            this.plane.setPitchInput(val * -1);
                            break;
                        case 5:
                            this.plane.setYawInput(val * -1);
                            break;
                    }
                }
                else {
                    switch(i) {
                        case 1: this.pitch = val * 500;
                        case 3: this.yaw = -val * 500 - 90;
                    }
                }
                // 2: yaw;
                //4 : roll;
            }
        }
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



    domElement.addEventListener('click', function () {
        domElement.requestPointerLock();
    });

    this.addGamepad = function ( gamepad ) {
        this.gamepads.push(gamepad);
        console.log('connected controller ');
    }

    this.removeGamepad = function ( gamepad ) {
        for (let i = this.gamepads.length - 1; i >= 0; --i) {
            this.gamepads.splice(i, 1);
        }
        console.log('disconnected controller');
    }

    let _keydown = bind( this, this.keydown );
    let _keyup = bind( this, this.keyup );
    let _mouseWheel = bind( this, this.mouseWheel );
    let _mousedown = bind( this, this.mousedown );
    let _mouseup = bind( this, this.mouseup );
    let _mousemove = bind( this, this.mousemove );
    let _gamepadConnected = bind( this, this.addGamepad );
    let _gamepadDisconnected = bind( this, this.removeGamepad );

    this.lock = function() {
        domElement.requestPointerLock();
    }

    this.unlock = function() {
        domElement.exitPointerLock();
    }

    function bind( scope, fn ) {
        return function () {
            fn.apply( scope, arguments );
        };
    }
    function contextmenu( event ) {
        event.preventDefault();
    }

    document.addEventListener('pointerlockchange', function() {
        if (document.pointerLockElement === domElement) {
            document.addEventListener( 'contextmenu', contextmenu );
            document.addEventListener( 'mousemove', _mousemove );
            document.addEventListener( 'mousedown', _mousedown );
            document.addEventListener( 'mouseup', _mouseup );
            document.addEventListener( 'wheel', _mouseWheel );
        }
        else {
            document.removeEventListener( 'contextmenu', contextmenu );
            document.removeEventListener( 'mousemove', _mousemove );
            document.removeEventListener( 'mousedown', _mousedown );
            document.removeEventListener( 'mouseup', _mouseup );
            document.removeEventListener( 'wheel', _mouseWheel );
        }
    });

    window.addEventListener( 'keydown', _keydown );
    window.addEventListener( 'keyup', _keyup );

    window.addEventListener("gamepadconnected", _gamepadConnected);
    window.addEventListener("gamepaddisconnected", _gamepadDisconnected);
}


PlaneController.prototype = Object.create( EventDispatcher.prototype );
PlaneController.prototype.constructor = PlaneController;