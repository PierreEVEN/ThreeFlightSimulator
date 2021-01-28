import {Landscape} from './Landscape.js'
import {GLTFLoader} from "./node_modules/three/examples/jsm/loaders/GLTFLoader.js";

let W = document.body.scrollWidth;
let H = document.body.scrollHeight;

let container = document.querySelector('#threejsContainer');

let scene, camera, clock, light, renderer, controls, landscape;

let test;

const gltfLoader = new GLTFLoader();

function init() {

	clock = new THREE.Clock(true);

	scene = new THREE.Scene();
	renderer = new THREE.WebGLRenderer();
	renderer.antialias = true;
	renderer.setSize(W, H);

	camera = new THREE.PerspectiveCamera(75, W / H, 0.1, 10000);
	camera.position.set(0, 10, 10);
	camera.lookAt(scene.position);
	camera.up.set(0,0,1);
	scene.add(camera);

	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.update();

	container.appendChild(renderer.domElement);

	// Ambient light
	scene.add(new THREE.AmbientLight(new THREE.Color(.3, .3, .3)));

	// Directional light
	light = new THREE.DirectionalLight( 0xffffff, 2);
	light.position.set( 0, 5, 0);
	scene.add(light);

	// Background color
	renderer.setClearColor(new THREE.Color(.6,.8,1),  1)

	// Create landscape
	landscape = new Landscape(scene, camera);

	test = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 10), new THREE.MeshPhongMaterial(), 100);
	test.instanceMatrix.setUsage(THREE.StaticDrawUsage);

	const matrix = new THREE.Matrix4();
	for (let i = 0; i < 100; ++i) {
		matrix.setPosition(i * 10, 0, 0);
		test.setMatrixAt(i, matrix);
	}


	scene.add(test);
}


function animate() {
        requestAnimationFrame(animate);
		controls.update();
		landscape.render();
        renderer.render(scene, camera);
}

init();
animate();
