import {World} from "./World.js";
import Stats from '../threejs/examples/jsm/libs/stats.module.js'
import {PlaneController} from './planeController.js'
import {PlaneDebugUI} from './planeDebugUI.js'
import {SaveGame} from './saveGame.js'
import {RESOURCE_MANAGER} from './resourceManager.js'
import * as THREE from '../threejs/build/three.module.js';
import {ImpostorRenderer} from "./impostorRenderer.js";
import {addKeyInput, addMouseAxisInput, initializeInputs, updateInputs} from "./io/inputManager.js";

let clock, stats, renderer, world, camera, controller, debugUI, background;


function loadResources() {
    RESOURCE_MANAGER.loadMeshResource('./models/F-16/F-16.glb', 'modele_F16');
    RESOURCE_MANAGER.loadMeshResource('./models/tree.glb', 'model_tree');
    RESOURCE_MANAGER.loadMeshResource('./models/detailedTree.glb', 'model_detailedTree');

    RESOURCE_MANAGER.loadFileResource('./shaders/landscape.VS.glsl', 'vertexShader_landscape');
    RESOURCE_MANAGER.loadFileResource('./shaders/landscape.FS.glsl', 'fragmentShader_landscape');
    RESOURCE_MANAGER.loadFileResource('./shaders/impostors.VS.glsl', 'vertexShader_impostors');
    RESOURCE_MANAGER.loadFileResource('./shaders/impostors.FS.glsl', 'fragmentShader_impostors');
    RESOURCE_MANAGER.loadFileResource('./shaders/normalMaterial.VS.glsl', 'vertexShader_normal');
    RESOURCE_MANAGER.loadFileResource('./shaders/normalMaterial.FS.glsl', 'fragmentShader_normal');

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



addKeyInput("Wireframe", "F1", 1, 0);
addKeyInput("FpsView", "KeyV", 1, 0);
addKeyInput("Pause", "KeyP", 1, 0);

addKeyInput("Pitch", "KeyW", 1, 0);
addKeyInput("Pitch", "KeyS", -1, 0);
addKeyInput("Roll", "KeyE", 1, 0);
addKeyInput("Roll", "KeyQ", -1, 0);
addKeyInput("Yaw", "KeyA", 1, 0);
addKeyInput("Yaw", "KeyD", -1, 0);
addMouseAxisInput("Throttle", 3, 1);
addMouseAxisInput("LookUp", 2, -1);
addMouseAxisInput("LookRight", 1, -1);




function init() {

    // Setup renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.autoClear = false;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color(.6,.8,1),  1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    background = document.getElementById('game');
    background.appendChild(renderer.domElement);
    initializeInputs(background);

    // Setup clock
    clock = new THREE.Clock();

    // Register stat window
    stats = new Stats();
    background.appendChild( stats.dom );

    // Set resize delegate
    window.addEventListener( 'resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    });

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);

    // build impostors
    RESOURCE_MANAGER.model_tree.scene.traverse(function(child) { if (child.isMesh) child.material.metalness = 0; });
    RESOURCE_MANAGER.model_tree.scene.rotation.z += -Math.PI / 2;
    RESOURCE_MANAGER.TreeImpostor = new ImpostorRenderer(RESOURCE_MANAGER.model_tree.scene);
    RESOURCE_MANAGER.TreeImpostor.render(renderer);

    // Initialize world
    world = new World(renderer, camera);

    // Create default plane
    let rootNode = null;
    RESOURCE_MANAGER.modele_F16.scene.traverse(function (child) {
        if (child.isMesh) {
            if (rootNode === null) {
                rootNode = new THREE.Mesh(child.geometry, child.material);
            } else {
                rootNode.attach(new THREE.Mesh(child.geometry, child.material));
            }
        }
    });
    let plane = world.addPlane(rootNode);

    // Add global controller
    controller = new PlaneController(background, plane, camera, world.landscape);
    new SaveGame(controller);

    debugUI = new PlaneDebugUI(controller, world);
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

    updateInputs();

    // Get delta time
    let deltaTime = clock.getDelta();

    world.tick(deltaTime);
    controller.update(deltaTime);
    debugUI.tick(deltaTime);

    renderer.setRenderTarget( null );
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color(.6,.8,1), 1);
    renderer.clear();
    renderer.render(world.scene, camera);
    stats.update();
}

loadResources();
preInit();