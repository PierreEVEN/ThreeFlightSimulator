import * as THREE from '../threejs/build/three.module.js';
import {Landscape} from './landscape.js'
import Stats from '../threejs/examples/jsm/libs/stats.module.js'
import {GLTFLoader} from "../threejs/examples/jsm/loaders/GLTFLoader.js";
import {Plane} from "./plane.js";
import {PlaneController} from "./planeController.js";
import {OrbitControls} from "../threejs/examples/jsm/controls/OrbitControls.js";
import {GUI} from "../threejs/examples/jsm/libs/dat.gui.module.js";

let W = document.body.scrollWidth;
let H = document.body.scrollHeight;

let container = document.querySelector('#threejsContainer');

let scene, camera, clock, light, renderer, controller, landscape, plane = null, stats, gui;
const gltfLoader = new GLTFLoader();


let planeInformations = {
	velx: 0,
	vely: 0,
	velz: 0,
	velocity: 0
};

function init() {
	stats = new Stats();
	container.appendChild( stats.dom );

	clock = new THREE.Clock(true);

	scene = new THREE.Scene();
	renderer = new THREE.WebGLRenderer({
			antialias: true,
			depth:true,
			logarithmicDepthBuffer: false,
		});
	renderer.setSize(W, H);

	camera = new THREE.PerspectiveCamera(75, W / H, 0.1, 5000);
	camera.position.set(0, 10, 10);
	camera.lookAt(scene.position);
	camera.up.set(0,0,1);
	scene.add(camera);

	container.appendChild(renderer.domElement);

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

	// Create water plane
	let waterPlane = new THREE.Mesh(new THREE.PlaneGeometry(10000, 10000, 50, 50), new THREE.MeshPhysicalMaterial({
			color: new THREE.Color(0.5, 0.8, 1),
			reflectivity: 1
		}
		));
	waterPlane.position.z = 20;
	scene.add(waterPlane);

	gui = new GUI();
	var velocity = gui.addFolder('Velocity absolute');
	velocity.add(planeInformations, 'velx', -400, 400).name('X').listen();
	velocity.add(planeInformations, 'vely', -400, 400).name('X').listen();
	velocity.add(planeInformations, 'velz', -400, 400).name('X').listen();
	velocity.open();

//WIP :: load tree instances :: TEST
	gltfLoader.load('./models/tree.glb', function (gltf) {

		const matrix = new THREE.Matrix4();
		gltf.scene.traverse(function(child) {
			if (child.isMesh) {
				let spacing = 20;
				let width = 300;
				let test = new THREE.InstancedMesh(child.geometry, child.material, width * width);
				test.instanceMatrix.setUsage(THREE.StaticDrawUsage);

				for (let x = 0; x < width; ++x) {
					for (let y = 0; y < width; ++y) {

						let posX = x * spacing + Math.random() * spacing - spacing / 2;
						let posY = y * spacing + Math.random() * spacing - spacing / 2;
						let posZ = landscape.getHeightAtLocation(posX, posY);
						if (posZ < 30 || posZ > 250) continue;

						matrix.makeRotationFromEuler(new THREE.Euler(Math.PI / 2, Math.random() * 100, 0));
						matrix.scale(new THREE.Vector3(0.01,0.01,0.01));
						matrix.setPosition(posX, posY, posZ);
						test.setMatrixAt(x + y * width, matrix);
					}
				}

				scene.add(test);

			}
		});

	});
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
		plane = new Plane(scene, rootNode, true);
		controller = new PlaneController(renderer.domElement, plane, camera );

		//if (getCookie('planePositionX')) plane.position.x = parseFloat(getCookie('planePositionX'));
		//if (getCookie('planePositionY')) plane.position.y = parseFloat(getCookie('planePositionY'));
		/*if (getCookie('planePositionZ')) plane.position.z = parseFloat(getCookie('planePositionZ'));

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

		 */



	});
}

function animate() {
	requestAnimationFrame(animate);
	stats.update();
	landscape.render();
	renderer.render(scene, camera);
	if (plane) {
		plane.update(clock.getDelta());

		planeInformations.velx = plane.velocity.x;
		planeInformations.vely = plane.velocity.y;
		planeInformations.velz = plane.velocity.z;
		planeInformations.velocity = plane.velocity.length();
	}
	if (controller) controller.update(clock.getDelta());

}

init();
animate();
