import {World} from "./World.js";
import Stats from '../threejs/examples/jsm/libs/stats.module.js'
import {PlaneController} from './planeController.js'
import {PlaneDebugUI} from './planeDebugUI.js'
import {SaveGame} from './saveGame.js'
import {RESOURCE_MANAGER} from './resourceManager.js'
import * as THREE from '../threejs/build/three.module.js';
import {ImpostorRenderer} from "./impostorRenderer.js";
import {
    addGamepadAxisInput,
    addKeyInput,
    addMouseAxisInput,
    initializeInputs,
    updateInputs
} from "./io/inputManager.js";
import {EffectComposer} from "../threejs/examples/jsm/postprocessing/EffectComposer.js";
import {RenderPass} from "../threejs/examples/jsm/postprocessing/RenderPass.js";
import {BloomPass} from "../threejs/examples/jsm/postprocessing/BloomPass.js";
import {UnrealBloomPass} from "../threejs/examples/jsm/postprocessing/UnrealBloomPass.js";
import {Vector2} from "../threejs/build/three.module.js";
import {TAARenderPass} from "../threejs/examples/jsm/postprocessing/TAARenderPass.js";
import {SMAAPass} from "../threejs/examples/jsm/postprocessing/SMAAPass.js";

let clock, stats, renderer, world, camera, controller, debugUI, background, composer, skyColor;


function loadResources() {
    RESOURCE_MANAGER.loadMeshResource('./models/F-16/F-16.glb', 'modele_F16');
    //RESOURCE_MANAGER.loadMeshResource('./models/tree.glb', 'model_tree');
    RESOURCE_MANAGER.loadMeshResource('./models/detailedTree.glb', 'model_detailedTree');

    RESOURCE_MANAGER.loadFileResource('./shaders/landscape.a.VS.glsl', 'vertexShader_landscape_a');
    RESOURCE_MANAGER.loadFileResource('./shaders/landscape.b.VS.glsl', 'vertexShader_landscape_b');
    RESOURCE_MANAGER.loadFileResource('./shaders/landscape.a.FS.glsl', 'fragmentShader_landscape_a');
    RESOURCE_MANAGER.loadFileResource('./shaders/landscape.b.FS.glsl', 'fragmentShader_landscape_b');
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


addGamepadAxisInput("Roll", "0b9b-4012-GOLD WARRIOR SIM -  XTR5.5+G2+FMS Controller", 0, 1);
addGamepadAxisInput("Pitch", "0b9b-4012-GOLD WARRIOR SIM -  XTR5.5+G2+FMS Controller", 6, -1);
addGamepadAxisInput("Yaw", "0b9b-4012-GOLD WARRIOR SIM -  XTR5.5+G2+FMS Controller", 5, -1);
addGamepadAxisInput("Throttle", "0b9b-4012-GOLD WARRIOR SIM -  XTR5.5+G2+FMS Controller", 1, 1);


function init() {

    // Setup renderer
    renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.autoClear = false;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    const skyIntensity = 0.8;
    skyColor = new THREE.Color(.6 * skyIntensity,.8 * skyIntensity,skyIntensity);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    background = document.getElementById('game');
    background.appendChild(renderer.domElement);
    initializeInputs(background);

    composer = new EffectComposer(renderer);

    // Setup clock
    clock = new THREE.Clock();

    // Register stat window
    stats = new Stats();
    background.appendChild( stats.dom );

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);

    // build impostors
    RESOURCE_MANAGER.model_detailedTree.scene.traverse(function(child) { if (child.isMesh) child.material.metalness = 0; });
    RESOURCE_MANAGER.model_detailedTree.scene.rotation.z += -Math.PI / 2;
    RESOURCE_MANAGER.TreeImpostor = new ImpostorRenderer(RESOURCE_MANAGER.model_detailedTree.scene);
    RESOURCE_MANAGER.TreeImpostor.render(renderer);

    // Initialize world
    world = new World(renderer, camera);

    composer.addPass(new RenderPass(world.scene, camera));
    const AAPass = new SMAAPass(window.innerWidth, window.innerHeight)
    composer.addPass(AAPass);
    composer.addPass(new UnrealBloomPass(new Vector2( 256, 256 ), 0.23));

    // Set resize delegate
    window.addEventListener( 'resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        AAPass.setSize(window.innerWidth, window.innerHeight);
        renderer.setSize( window.innerWidth, window.innerHeight );
        composer.setSize(window.innerWidth, window.innerHeight)
    });


    // Create default plane
    let rootNode = null;
    RESOURCE_MANAGER.modele_F16.scene.traverse(function (child) {
        if (child.isMesh) {
            child.material.metalness = 0.95;
            child.material.roughness = 0.01;
            if (rootNode === null) {
                rootNode = new THREE.Mesh(child.geometry, child.material);
            } else {
                let NewMesh = new THREE.Mesh(child.geometry, child.material);
                rootNode.attach(NewMesh);
            }
        }
    });
    let plane = world.addPlane(rootNode);

    // Add global controller
    controller = new PlaneController(plane, camera, world.landscape);
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
    renderer.setClearColor(skyColor, 1);

    composer.render();


    //renderer.clear();
    //renderer.render(world.scene, camera);
    stats.update();
}

loadResources();
preInit();