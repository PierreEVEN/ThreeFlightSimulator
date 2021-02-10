import {World} from "./World.js";
import Stats from '../threejs/examples/jsm/libs/stats.module.js'
import {OrbitControls} from '../threejs/examples/jsm/controls/OrbitControls.js'
import {RESOURCE_MANAGER} from './resourceManager.js'
import * as THREE from '../threejs/build/three.module.js';
import {ImpostorRenderer} from "./impostorRenderer.js";

let clock, stats, renderer, world, camera, controller, impostorTest;

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

    // Initialize world
    world = new World(renderer, camera);

    // Add global controller
    controller = new OrbitControls(camera, renderer.domElement);

    // Create impostors
    RESOURCE_MANAGER.model_treeBasic.scene.traverse(function(child) { if (child.isMesh) child.material.metalness = 0; });
    RESOURCE_MANAGER.model_treeBasic.scene.rotation.z += -Math.PI / 2;
    impostorTest = new ImpostorRenderer(RESOURCE_MANAGER.model_treeBasic.scene);
    impostorTest.render(renderer);
    RESOURCE_MANAGER.TEST = impostorTest;

    // Create impostor instances
    const instCount = 1000;
    const spacing = 0.6;
    const matrix = new THREE.Matrix4();
    let instMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(), RESOURCE_MANAGER.TEST.material, instCount * instCount);
    instMesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    for (let x = 0; x < instCount; ++x) {
        for (let y = 0; y < instCount; ++y) {
            matrix.identity();
            matrix.setPosition((x - instCount / 2) * spacing + Math.random() * spacing, (y - instCount / 2) * spacing + Math.random() * spacing, 0);
            instMesh.setMatrixAt(x + y * instCount, matrix);
        }
    }
    world.scene.add(instMesh);
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

    renderer.setRenderTarget( null );
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color(.6,.8,1), 1);
    renderer.clear();
    renderer.render(world.scene, camera);
    stats.update();
}

loadResources();
preInit();