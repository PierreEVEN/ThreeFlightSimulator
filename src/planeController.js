import {Euler, EventDispatcher, Vector3} from "../threejs/build/three.module.js";

export {PlaneController};


let PlaneController = function ( domElement, inPlane, inCamera ) {

    this.distance = 40;
    this.pitch = 0;
    this.yaw = 0;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.rotation = new Euler(0,0,0, 'XZY');

    if ( domElement === undefined ) {

        console.warn( 'THREE.FlyControls: The second parameter "domElement" is now mandatory.' );
        domElement = document;
    }

    this.domElement = domElement;

    if ( domElement ) this.domElement.setAttribute( 'tabindex', - 1 );

    this.plane = inPlane;
    this.camera = inCamera;

    this.keyup = function ( event ) {}
    this.keydown = function ( event ) {}
    this.mousedown = function ( event ) {}
    this.mouseup = function ( event ) {}
    this.mousemove = function ( event ) {
        this.pitch += (event.pageY - this.lastMouseY) / 100.0;
        this.yaw += (event.pageX - this.lastMouseX) / 100.0;

        this.rotation.set(this.pitch, this.yaw, 0, 'XZY');
        this.lastMouseX = event.pageX;
        this.lastMouseY = event.pageY;
    }
    this.mouseWheel = function (event) {

        this.distance += event.deltaY;

    }

    this.vector = new Vector3();
    this.update = function(deltaTime) {
        this.camera.setRotationFromEuler(this.rotation);
        this.camera.getWorldDirection(this.vector);
        this.camera.position.copy(this.plane.position);
        this.camera.position.addScaledVector(this.vector, -this.distance);

    }

    function bind( scope, fn ) {
        return function () {
            fn.apply( scope, arguments );
        };
    }
    function contextmenu( event ) {
        event.preventDefault();
    }

    let _keydown = bind( this, this.keydown );
    let _keyup = bind( this, this.keyup );
    let _mouseWheel = bind( this, this.mouseWheel );
    let _mousedown = bind( this, this.mousedown );
    let _mouseup = bind( this, this.mouseup );
    let _mousemove = bind( this, this.mousemove );

    this.domElement.addEventListener( 'contextmenu', contextmenu );

    this.domElement.addEventListener( 'mousemove', _mousemove );
    this.domElement.addEventListener( 'mousedown', _mousedown );
    this.domElement.addEventListener( 'mouseup', _mouseup );
    this.domElement.addEventListener( 'wheel', _mouseWheel );

    window.addEventListener( 'keydown', _keydown );
    window.addEventListener( 'keyup', _keyup );
}

PlaneController.prototype = Object.create( EventDispatcher.prototype );
PlaneController.prototype.constructor = PlaneController;