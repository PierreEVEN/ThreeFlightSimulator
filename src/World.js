import * as THREE from '../threejs/build/three.module.js';
import {Landscape} from './landscape.js'
import {GLTFLoader} from "../threejs/examples/jsm/loaders/GLTFLoader.js";
import {Plane} from "./plane.js";
import {PlaneController} from "./planeController.js";
import {GUI} from "../threejs/examples/jsm/libs/dat.gui.module.js";
import {HeightGenerator} from "./HeightGenerator.js";
import {FoliageSystem} from "./FoliageSystem.js";
export {World};

const gltfLoader = new GLTFLoader();

let planeModel, isPlaneModelLoaded;

class World {
	constructor(renderer) {
		this.renderer = renderer;
		// Create scene
		this.scene = new THREE.Scene();

		// Create camera
		this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000);
		this.scene.add(this.camera);

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
		this.landscape = new Landscape(this.scene, this.camera, this.heightGenerator);

		// Create default plane
		gltfLoader.load('./models/F-16/F-16.glb', function (gltf) { planeModel = gltf; });


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
	}

	tick(deltaTime) {
		if (!this.tryLoadPlane()) return;
		this.landscape.render(deltaTime);
		if (this.planeActor) {
			this.planeActor.update(deltaTime);

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
		if (this.controller) this.controller.update(deltaTime);

		if (this.planeActor.position.z < this.heightGenerator.getHeightAtLocation(this.planeActor.position.x, this.planeActor.position.y)) {
			this.planeActor.position.set(0, 0, 100);
			this.planeActor.velocity.set(100, 0, 0);
		}

	}





	tryLoadPlane() {
		if (isPlaneModelLoaded) return true;
		if (!planeModel) return false;
		isPlaneModelLoaded = true;

		let rootNode = null;
		planeModel.scene.traverse(function (child) {
			if (child.isMesh) {
				if (rootNode === null) {
					rootNode = new THREE.Mesh(child.geometry, child.material);
				} else {
					rootNode.attach(new THREE.Mesh(child.geometry, child.material));
				}
			}
		});

		this.scene.add(rootNode);
		this.planeActor = new Plane(this.scene, rootNode, true);
		this.controller = new PlaneController(this.renderer.domElement, this.planeActor, this.camera, this.landscape);
		/*
                if (getCookie('planePositionX')) planeActor.position.x = parseFloat(getCookie('planePositionX'));
                if (getCookie('planePositionY')) planeActor.position.y = parseFloat(getCookie('planePositionY'));
                if (getCookie('planePositionZ')) planeActor.position.z = parseFloat(getCookie('planePositionZ'));

                if (getCookie('planeRotationX')) planeActor.rotation.x = parseFloat(getCookie('planeRotationX'));
                if (getCookie('planeRotationY')) planeActor.rotation.y = parseFloat(getCookie('planeRotationY'));
                if (getCookie('planeRotationZ')) planeActor.rotation.z = parseFloat(getCookie('planeRotationZ'));
                if (getCookie('planeRotationW')) planeActor.rotation.w = parseFloat(getCookie('planeRotationW'));

                if (getCookie('planeVelocityX')) planeActor.velocity.x = parseFloat(getCookie('planeVelocityX'));
                if (getCookie('planeVelocityY')) planeActor.velocity.y = parseFloat(getCookie('planeVelocityY'));
                if (getCookie('planeVelocityZ')) planeActor.velocity.z = parseFloat(getCookie('planeVelocityZ'));

                if (getCookie('cameraPitch')) controller.pitch = parseFloat(getCookie('cameraPitch'));
                if (getCookie('cameraYaw')) controller.yaw = parseFloat(getCookie('cameraYaw'));
                if (getCookie('isFps')) controller.isFPS = getCookie('isFps') === 'true';
                controller.updateMouse();

         */


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
}





function getCookie(name) {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop().split(';').shift();
}

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