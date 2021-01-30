import * as THREE from '../threejs/build/three.module.js';
import {Landscape} from './landscape.js'
import Stats from '../threejs/examples/jsm/libs/stats.module.js'
import {GLTFLoader} from "../threejs/examples/jsm/loaders/GLTFLoader.js";
import {Plane} from "./plane.js";
import {PlaneController} from "./planeController.js";
import {OrbitControls} from "../threejs/examples/jsm/controls/OrbitControls.js";
import {GUI} from "../threejs/examples/jsm/libs/dat.gui.module.js";

let scene, camera, clock, light, renderer, controller, landscape, plane = null, stats, gui;
const gltfLoader = new GLTFLoader();


let planeInformations = {
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

function init() {
	stats = new Stats();
	document.body.appendChild( stats.dom );

	clock = new THREE.Clock(true);

	// Create scene
	scene = new THREE.Scene();

	// Create camera
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000);
	scene.add(camera);

	// Create renderer
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);
	window.addEventListener( 'resize', onWindowResize );

	// Ambient light
	scene.add(new THREE.AmbientLight(new THREE.Color(.3, .3, .3)));

	// Directional light
	light = new THREE.DirectionalLight( 0xffffff, 2);
	light.position.set( 0, 5, 0);
	scene.add(light);

	// Background color
	renderer.setClearColor(new THREE.Color(.6,.8,1),  1);

	// Create landscape
	landscape = new Landscape(scene, camera);

	// Create default plane
	loadPlane();

//WIP :: load tree instances :: TEST
	gltfLoader.load('./models/tree.glb', function (gltf) {

		const matrix = new THREE.Matrix4();
		gltf.scene.traverse(function(child) {
			if (child.isMesh) {
				let spacing = 20;
				let width = 100;
				let test = new THREE.InstancedMesh(child.geometry, child.material, width * width);
				test.instanceMatrix.setUsage(THREE.StaticDrawUsage);

				for (let x = 0; x < width; ++x) {
					for (let y = 0; y < width; ++y) {

						let posX = x * spacing + Math.random() * spacing - spacing / 2 - width * spacing / 2;
						let posY = y * spacing + Math.random() * spacing - spacing / 2 - width * spacing / 2;
						let posZ = landscape.getHeightAtLocation(posX, posY);
						if (posZ < 30 || posZ > 250) continue;

						matrix.makeRotationFromEuler(new THREE.Euler(Math.PI / 2, Math.random() * 100, 0));
						matrix.scale(new THREE.Vector3(0.01,0.01,0.01));
						matrix.setPosition(posX, posY, posZ);
						test.setMatrixAt(x + y * width, matrix);
					}
				}

				//scene.add(test);

			}
		});

	});
}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function getCookie(name) {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop().split(';').shift();
}

window.onbeforeunload = function (event) {
	let flags = ";Secure";
	document.cookie = "planePositionX=" + plane.position.x + flags;
	document.cookie = "planePositionY=" + plane.position.y + flags;
	document.cookie = "planePositionZ=" + plane.position.z + flags;
	document.cookie = "planeRotationX=" + plane.rotation.x + flags;
	document.cookie = "planeRotationY=" + plane.rotation.y + flags;
	document.cookie = "planeRotationZ=" + plane.rotation.z + flags;
	document.cookie = "planeRotationW=" + plane.rotation.w + flags;
	document.cookie = "planeVelocityX=" + plane.velocity.x + flags;
	document.cookie = "planeVelocityY=" + plane.velocity.y + flags;
	document.cookie = "planeVelocityZ=" + plane.velocity.z + flags;
	document.cookie = "cameraPitch=" + controller.pitch + flags;
	document.cookie = "cameraYaw=" + controller.yaw + flags;
	document.cookie = "isFps=" + controller.isFPS + flags;
}

function loadPlane() {
	gltfLoader.load('./models/F-16/F-16.glb', function (gltf) {

		let rootNode = null;

		gltf.scene.traverse(function(child) {
            if (child.isMesh) {
                if (rootNode === null) {
                    rootNode = new THREE.Mesh(child.geometry, child.material);
                }
                else {
                	rootNode.attach(new THREE.Mesh(child.geometry, child.material));
				}
            }
        });

		scene.add(rootNode);
		plane = new Plane(scene, rootNode, false);
		controller = new PlaneController(renderer.domElement, plane, camera, landscape);

		//if (getCookie('planePositionX')) plane.position.x = parseFloat(getCookie('planePositionX'));
		//if (getCookie('planePositionY')) plane.position.y = parseFloat(getCookie('planePositionY'));
		if (getCookie('planePositionZ')) plane.position.z = parseFloat(getCookie('planePositionZ'));

		if (getCookie('planeRotationX')) plane.rotation.x = parseFloat(getCookie('planeRotationX'));
		if (getCookie('planeRotationY')) plane.rotation.y = parseFloat(getCookie('planeRotationY'));
		if (getCookie('planeRotationZ')) plane.rotation.z = parseFloat(getCookie('planeRotationZ'));
		if (getCookie('planeRotationW')) plane.rotation.w = parseFloat(getCookie('planeRotationW'));

		if (getCookie('planeVelocityX')) plane.velocity.x = parseFloat(getCookie('planeVelocityX'));
		if (getCookie('planeVelocityY')) plane.velocity.y = parseFloat(getCookie('planeVelocityY'));
		if (getCookie('planeVelocityZ')) plane.velocity.z = parseFloat(getCookie('planeVelocityZ'));

		if (getCookie('cameraPitch')) controller.pitch = parseFloat(getCookie('cameraPitch'));
		if (getCookie('cameraYaw')) controller.yaw = parseFloat(getCookie('cameraYaw'));
		if (getCookie('isFps')) controller.isFPS = getCookie('isFps') === 'true';
		controller.updateMouse();


		gui = new GUI();
		var velocity = gui.addFolder('absolute velocity');
		velocity.add(planeInformations, 'velocity', 0, 300).name('speed').listen();
		velocity.add(planeInformations, 'velx', -300, 300).name('X').listen();
		velocity.add(planeInformations, 'vely', -300, 300).name('Y').listen();
		velocity.add(planeInformations, 'velz', -300, 300).name('Z').listen();
		velocity.open();
		var Relvelocity = gui.addFolder('relative velocity');
		Relvelocity.add(planeInformations, 'velrelx', -50, 300).name('X').listen();
		Relvelocity.add(planeInformations, 'velrely', -50, 300).name('Y').listen();
		Relvelocity.add(planeInformations, 'velrelz', -50, 300).name('Z').listen();
		Relvelocity.open();
		var inputs = gui.addFolder('Inputs');
		inputs.add(plane, 'rollInput', -1, 1).name('Roll').listen();
		inputs.add(plane, 'pitchInput', -1, 1).name('Pitch').listen();
		inputs.add(plane, 'yawInput', -1, 1).name('Yaw').listen();
		inputs.add(plane, 'engineInput', 0, 1.2).name('Throttle').listen();
		inputs.open();
		var flightState = gui.addFolder('Flight state');
		flightState.add(plane, 'rightLift', -10, 10).name('Lift Y').listen();
		flightState.add(plane, 'upLift', -50, 50).name('Lift Z').listen();
		flightState.open();
	});
}

function animate() {
	let delta = clock.getDelta();
	requestAnimationFrame(animate);
	stats.update();
	landscape.render(delta);
	renderer.render(scene, camera);
	if (plane) {
		plane.update(delta);

		planeInformations.velocity = plane.velocity.length();
		planeInformations.velx = plane.velocity.x;
		planeInformations.vely = plane.velocity.y;
		planeInformations.velz = plane.velocity.z;
		planeInformations.velrelx = plane.relativeVelocity.x;
		planeInformations.velrely = plane.relativeVelocity.y;
		planeInformations.velrelz = plane.relativeVelocity.z;
		planeInformations.inputx = plane.rollInput;
		planeInformations.inputy = plane.pitchInput;
		planeInformations.inputz = plane.yawInput;
		planeInformations.inputthrottle = plane.engineInput;
	}
	if (controller) controller.update(delta);

}

init();
animate();
