import {World} from "./World.js";
import Stats from '../threejs/examples/jsm/libs/stats.module.js'
import {PlaneController} from './planeController.js'
import {RESOURCE_MANAGER} from './resourceManager.js'
import * as THREE from '../threejs/build/three.module.js';

let clock, stats, renderer, world, camera, controller;

function loadResources() {
    RESOURCE_MANAGER.loadMeshResource('./models/F-16/F-16.glb', 'modele_F16');
    RESOURCE_MANAGER.loadMeshResource('./models/tree.glb', 'model_tree');

    RESOURCE_MANAGER.loadFileResource('./shaders/landscape.VS.glsl', 'vertexShader_landscape');
    RESOURCE_MANAGER.loadFileResource('./shaders/landscape.FS.glsl', 'fragmentShader_landscape');

    RESOURCE_MANAGER.loadTextureResource('./textures/noise.png', 'texture_noise');
    RESOURCE_MANAGER.loadTextureResource('./textures/forrest_ground_01_diff_1k.jpg', 'texture_grass1');
    RESOURCE_MANAGER.loadTextureResource('./textures/brown_mud_leaves_01_diff_1k.jpg', 'texture_grass2');
    RESOURCE_MANAGER.loadTextureResource('./textures/aerial_rocks_02_diff_1k.jpg', 'texture_rock1');
    RESOURCE_MANAGER.loadTextureResource('./textures/aerial_rocks_04_diff_1k.jpg', 'texture_rock2');
    RESOURCE_MANAGER.loadTextureResource('./textures/snow_02_diff_1k.jpg', 'texture_snow1');
    RESOURCE_MANAGER.loadTextureResource('./textures/aerial_beach_01_diff_1k.jpg', 'texture_sand1');
    RESOURCE_MANAGER.loadTextureResource('./textures/Water_001_DISP.png', 'texture_waterDisp');
    RESOURCE_MANAGER.loadTextureResource('./textures/Water_001_NORM.jpg', 'texture_waterNorm');
}


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

function preInit() {

    // Wait resource loading...
    if (RESOURCE_MANAGER.isLoadingResource()) {
        requestAnimationFrame(preInit);
        return;
    }
    console.log('loading complete. Starting simulation');

    init();
    animate();
}

function animate() {
    requestAnimationFrame(animate);

    // Get delta time
    let deltaTime = clock.getDelta();

    world.tick(deltaTime);
    stats.update();
    //controller.update(deltaTime);
    renderer.render(world.scene, world.camera);
}

loadResources();
preInit();