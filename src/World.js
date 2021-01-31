export {World};
import * as THREE from '../threejs/build/three.module.js';
import {Landscape} from './landscape.js'
import {Plane} from "./plane.js";
import {GUI} from "../threejs/examples/jsm/libs/dat.gui.module.js";
import {HeightGenerator} from "./HeightGenerator.js";
import {FoliageSystem} from "./FoliageSystem.js";

class World {
	constructor(renderer, camera) {
		this.renderer = renderer;
		// Create scene
		this.scene = new THREE.Scene();

		// Light
		this.ambiantLight = new THREE.AmbientLight(new THREE.Color(.3, .3, .3));
		this.directionalLight = new THREE.DirectionalLight(0xffffff, 2);
		this.directionalLight.position.set(0, 5, 0);
		this.scene.add(this.ambiantLight);
		this.scene.add(this.directionalLight);

		// Create heightmap generator
		this.heightGenerator = new HeightGenerator();

		// Create foliage system
		this.foliageSystem = new FoliageSystem(this.scene, this.heightGenerator);

		// Create landscape
		this.landscape = new Landscape(this.scene, camera, this.heightGenerator);

		this.scene.add(camera);

		this.planes = [];
	}


	tick(deltaTime) {
		this.landscape.render(deltaTime);
		for (let plane of this.planes) {
			plane.update(deltaTime);
			if (plane.position.z < this.heightGenerator.getHeightAtLocation(plane.position.x, plane.position.y)) {
				plane.position.set(0, 0, 100);
				plane.velocity.set(100, 0, 0);
			}
		}
	}


	addPlane(mesh) {
		this.scene.add(mesh);
		const plane = new Plane(this.scene, mesh, true);
		this.planes.push(plane);
		return plane;
	}

}


function getCookie(name) {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop().split(';').shift();
}


function tryLoadPlane() {
	this.gui = new GUI();
	let velocity = this.gui.addFolder('absolute velocity');
	velocity.add(this.planeInformations, 'velocity', 0, 300).name('speed').listen();
	velocity.add(this.planeInformations, 'velx', -300, 300).name('X').listen();
	velocity.add(this.planeInformations, 'vely', -300, 300).name('Y').listen();
	velocity.add(this.planeInformations, 'velz', -300, 300).name('Z').listen();
	velocity.open();
	let Relvelocity = this.gui.addFolder('relative velocity');
	Relvelocity.add(this.planeInformations, 'velrelx', -50, 300).name('X').listen();
	Relvelocity.add(this.planeInformations, 'velrely', -50, 300).name('Y').listen();
	Relvelocity.add(this.planeInformations, 'velrelz', -50, 300).name('Z').listen();
	Relvelocity.open();
	let inputs = this.gui.addFolder('Inputs');
	inputs.add(this.planeActor, 'rollInput', -1.0, 1.0).name('Roll').listen();
	inputs.add(this.planeActor, 'pitchInput', -1.0, 1.0).name('Pitch').listen();
	inputs.add(this.planeActor, 'yawInput', -1.0, 1.0).name('Yaw').listen();
	inputs.add(this.planeActor, 'engineInput', 0.0, 1.2).name('Throttle').listen();
	inputs.open();
	let flightState = this.gui.addFolder('Flight state');
	flightState.add(this.planeActor, 'rightLift', -10.0, 10.0).name('Lift Y').listen();
	flightState.add(this.planeActor, 'upLift', -50.0, 50.0).name('Lift Z').listen();
	flightState.open();
	return false;
}
/*
this.planeInformations = {
    velocity: 0,
    velx: 0,
    vely: 0,
    velz: 0,
    velrelx: 0,
    velrely: 0,
    velrelz: 0,
    inputx: 0,
    inputy: 0,
    inputz: 0,
    inputthrottle: 0,
};
 */
window.onbeforeunload = function (event) {
	/*
	let flags = ";Secure";
	document.cookie = "planePositionX=" + this.planeActor.position.x + flags;
	document.cookie = "planePositionY=" + this.planeActor.position.y + flags;
	document.cookie = "planePositionZ=" + this.planeActor.position.z + flags;
	document.cookie = "planeRotationX=" + this.planeActor.rotation.x + flags;
	document.cookie = "planeRotationY=" + this.planeActor.rotation.y + flags;
	document.cookie = "planeRotationZ=" + this.planeActor.rotation.z + flags;
	document.cookie = "planeRotationW=" + this.planeActor.rotation.w + flags;
	document.cookie = "planeVelocityX=" + this.planeActor.velocity.x + flags;
	document.cookie = "planeVelocityY=" + this.planeActor.velocity.y + flags;
	document.cookie = "planeVelocityZ=" + this.planeActor.velocity.z + flags;
	document.cookie = "cameraPitch=" + this.controller.pitch + flags;
	document.cookie = "cameraYaw=" + this.controller.yaw + flags;
	document.cookie = "isFps=" + this.controller.isFPS + flags;

	 */
}
/*
if (this.planeActor) {

    this.planeInformations.velocity = this.planeActor.velocity.length();
    this.planeInformations.velx = this.planeActor.velocity.x;
    this.planeInformations.vely = this.planeActor.velocity.y;
    this.planeInformations.velz = this.planeActor.velocity.z;
    this.planeInformations.velrelx = this.planeActor.relativeVelocity.x;
    this.planeInformations.velrely = this.planeActor.relativeVelocity.y;
    this.planeInformations.velrelz = this.planeActor.relativeVelocity.z;
    this.planeInformations.inputx = this.planeActor.rollInput;
    this.planeInformations.inputy = this.planeActor.pitchInput;
    this.planeInformations.inputz = this.planeActor.yawInput;
    this.planeInformations.inputthrottle = this.planeActor.engineInput;
}
 */