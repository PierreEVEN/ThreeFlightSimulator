import {World} from "./World.js";
import Stats from '../threejs/examples/jsm/libs/stats.module.js'
import {PlaneController} from './planeController.js'
import * as THREE from '../threejs/build/three.module.js';

let clock, stats, renderer, world, camera, controller;

function init() {

    // Setup renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color(.6,.8,1),  1);
    document.body.appendChild(renderer.domElement);

    // Setup clock
    clock = new THREE.Clock();

    // Register stat window
    stats = new Stats();
    document.body.appendChild( stats.dom );

    // Set resize delegate
    window.addEventListener( 'resize', function () {
        world.camera.aspect = window.innerWidth / window.innerHeight;
        world.camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    });

    // Initialize world
    world = new World(renderer);

    // Create camera
    camera = new THREE.Camera();
    world.scene.add(camera);

    // Add global controller
    //controller = new PlaneController(renderer.domElement, world.planeActor, camera, world.landscape);
}

function animate() {
    let deltaTime = clock.getDelta();
    world.tick(deltaTime);
    stats.update();
    //controller.update(deltaTime);
    renderer.render(world.scene, world.camera);
    requestAnimationFrame(animate);
}

init();
animate();