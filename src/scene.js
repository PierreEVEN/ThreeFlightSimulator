import * as THREE from '../threejs/build/three.module.js';
import {Landscape} from './landscape.js'
import Stats from '../threejs/examples/jsm/libs/stats.module.js'
import {GLTFLoader} from "../threejs/examples/jsm/loaders/GLTFLoader.js";
import {Plane} from "./plane.js";
import {PlaneController} from "./planeController.js";
import {OrbitControls} from "../threejs/examples/jsm/controls/OrbitControls.js";

let W = document.body.scrollWidth;
let H = document.body.scrollHeight;

let container = document.querySelector('#threejsContainer');

let scene, camera, clock, light, renderer, controller, landscape, plane = null, stats;
const gltfLoader = new GLTFLoader();

function init() {
	stats = new Stats();
	container.appendChild( stats.dom );

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

//WIP :: load tree instances :: TEST
	gltfLoader.load('./tree.glb', function (gltf) {

		const matrix = new THREE.Matrix4();
		gltf.scene.traverse(function(child) {
			if (child.isMesh) {

				let width = 100;
				let test = new THREE.InstancedMesh(child.geometry, child.material, width * width);
				test.instanceMatrix.setUsage(THREE.StaticDrawUsage);

				for (let x = 0; x < width; ++x) {
					for (let y = 0; y < width; ++y) {

						let posX = x * 10 + Math.random() * 10 - 5;
						let posY = y * 10 + Math.random() * 10 - 5;

						matrix.makeRotationFromEuler(new THREE.Euler(Math.PI / 2, Math.random() * 100, 0));
						matrix.scale(new THREE.Vector3(0.01,0.01,0.01));
						matrix.setPosition(posX, posY, landscape.getHeightAtLocation(posX, posY));
						test.setMatrixAt(x + y * width, matrix);
					}
				}

				scene.add(test);

			}
		});

	});
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
		plane = new Plane(scene, rootNode);
		controller = new PlaneController(renderer.domElement, plane, camera );
	});
}

function animate() {
	requestAnimationFrame(animate);
	landscape.render();
	renderer.render(scene, camera);
	if (plane) plane.update(clock.getDelta());
	if (controller) controller.update(clock.getDelta());
	stats.update();
}

init();
animate();
