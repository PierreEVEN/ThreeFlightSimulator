import {World} from "./World.js";
import Stats from '../threejs/examples/jsm/libs/stats.module.js'
import {OrbitControls} from '../threejs/examples/jsm/controls/OrbitControls.js'
import {RESOURCE_MANAGER} from './resourceManager.js'
import * as THREE from '../threejs/build/three.module.js';
import {ImpostorRenderer} from "./impostorRenderer.js";

let clock, stats, renderer, world, camera, controller, debugUI, impostorTest;

function loadResources() {
    RESOURCE_MANAGER.loadMeshResource('./models/detailedTree.glb', 'model_tree');
    RESOURCE_MANAGER.loadMeshResource('./models/tree.glb', 'model_treeBasic');

    RESOURCE_MANAGER.loadFileResource('./shaders/impostors.VS.glsl', 'vertexShader_impostors');
    RESOURCE_MANAGER.loadFileResource('./shaders/impostors.FS.glsl', 'fragmentShader_impostors');
    RESOURCE_MANAGER.loadFileResource('./shaders/normalMaterial.VS.glsl', 'vertexShader_normal');
    RESOURCE_MANAGER.loadFileResource('./shaders/normalMaterial.FS.glsl', 'fragmentShader_normal');

    RESOURCE_MANAGER.loadTextureResource('./textures/forrest_ground_01_diff_1k.jpg', 'texture_forestGround');
    RESOURCE_MANAGER.loadTextureResource('./textures/TestImpost.png', 'texture_TestImpost');
    RESOURCE_MANAGER.loadTextureResource('./textures/TestImpostSimplified.png', 'texture_TestImpostSimplified');
    RESOURCE_MANAGER.loadTextureResource('./textures/textureImpostSimplified.png', 'texture_textureImpostSimplified');
}


function init() {

    // Setup renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    document.body.appendChild(renderer.domElement);

    // Setup clock
    clock = new THREE.Clock();

    // Register stat window
    stats = new Stats();
    document.body.appendChild( stats.dom );

    // Set resize delegate
    window.addEventListener( 'resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    });

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 4000);
    camera.position.x -= 5;
    camera.up.set(0,0,1);

    impostorTest = new ImpostorRenderer(camera);

    // Initialize world
    world = new World(renderer, camera);

    // Add global controller
    controller = new OrbitControls(camera, renderer.domElement);
    let demo = new THREE.Mesh(new THREE.BoxGeometry(.2, 4, 4), new THREE.MeshBasicMaterial({map:RESOURCE_MANAGER.TEST.texture}));
    demo.position.z += 2.5;
    demo.position.x += 1;
    world.scene.add(demo);
    let demo2 = new THREE.Mesh(new THREE.BoxGeometry(.2, 4, 4), new THREE.MeshBasicMaterial({map:RESOURCE_MANAGER.TEST2.texture}));
    demo2.position.z += 2.5;
    demo2.position.x -= 5;
    world.scene.add(demo2);
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
    controller.update();

    impostorTest.render(renderer);

    renderer.setRenderTarget( null );
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color(.6,.8,1), 1);
    renderer.clear();
    renderer.render(world.scene, camera);
    stats.update();
}

loadResources();
preInit();