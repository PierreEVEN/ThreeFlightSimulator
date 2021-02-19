import Stats from '../threejs/examples/jsm/libs/stats.module.js'
import {RESOURCE_MANAGER} from './io/resourceManager.js'
import * as THREE from '../threejs/build/three.module.js';
import {
    addGamepadAxisInput,
    addInputPressAction,
    addKeyInput,
    addMouseAxisInput,
    initializeInputs,
    updateInputs
} from "./io/inputManager.js";
import {GameRenderer} from "./rendering/gameRenderer.js";
import {DefaultGamemode} from "./defaultGamemode.js";
import {ImpostorRenderer} from "./rendering/impostorRenderer.js";
import {DevGamemode} from "./devGamemode.js";
import {OPTION_MANAGER} from "./io/optionManager.js";
import {SAVEGAME} from "./io/saveGame.js";
export {releaseRenderer}

let isReady = false, clock, stats, gamemode, gameRenderer;

/**
 * OPTIONS
 */

OPTION_MANAGER.addComboOption("Graphic settings", ["custom", "low", "medium", "high", "cinematic"], "high");
OPTION_MANAGER.addRangeOption("pixel percentage", 100, 25, 200);
OPTION_MANAGER.addBooleanOption("enable foliage", true);
OPTION_MANAGER.addRangeOption("foliage density", 100, 20, 200);
OPTION_MANAGER.addBooleanOption("post processing", true);
OPTION_MANAGER.addRangeOption("atmospheric scattering quality", 10, 3, 30);
OPTION_MANAGER.addRangeOption("loading range", 6, 1, 10);
OPTION_MANAGER.addRangeOption("landscape quality", 20, 2, 100);
OPTION_MANAGER.addRangeOption("camera min", 0.1, 0.01, 1, 0.01);
OPTION_MANAGER.addRangeOption("camera max", 100000, 10000, 1000000, 10000);

OPTION_MANAGER.bindOption(null, "Graphic settings", (context, value) => {
    switch (value) {
        case "custom":
            return;
        case "low":
            OPTION_MANAGER.setOptionValue("pixel percentage", 50);
            OPTION_MANAGER.setOptionValue("enable foliage", true);
            OPTION_MANAGER.setOptionValue("foliage density", 20);
            OPTION_MANAGER.setOptionValue("post processing", false);
            OPTION_MANAGER.setOptionValue("loading range", 1);
            OPTION_MANAGER.setOptionValue("landscape quality", 10);
            break;
        case "medium":
            OPTION_MANAGER.setOptionValue("pixel percentage", 100);
            OPTION_MANAGER.setOptionValue("enable foliage", true);
            OPTION_MANAGER.setOptionValue("foliage density", 50);
            OPTION_MANAGER.setOptionValue("post processing", true);
            OPTION_MANAGER.setOptionValue("atmospheric scattering quality", 3);
            OPTION_MANAGER.setOptionValue("loading range", 3);
            OPTION_MANAGER.setOptionValue("landscape quality", 15);
            break;
        case "high":
            OPTION_MANAGER.setOptionValue("pixel percentage", 100);
            OPTION_MANAGER.setOptionValue("enable foliage", true);
            OPTION_MANAGER.setOptionValue("foliage density", 100);
            OPTION_MANAGER.setOptionValue("post processing", true);
            OPTION_MANAGER.setOptionValue("atmospheric scattering quality", 10);
            OPTION_MANAGER.setOptionValue("loading range", 6);
            OPTION_MANAGER.setOptionValue("landscape quality", 20);
            break;
        case "cinematic":
            OPTION_MANAGER.setOptionValue("pixel percentage", 200);
            OPTION_MANAGER.setOptionValue("enable foliage", true);
            OPTION_MANAGER.setOptionValue("foliage density", 150);
            OPTION_MANAGER.setOptionValue("post processing", true);
            OPTION_MANAGER.setOptionValue("atmospheric scattering quality", 20);
            OPTION_MANAGER.setOptionValue("loading range", 6);
            OPTION_MANAGER.setOptionValue("landscape quality", 50);
            break;
    }
});

if (!SAVEGAME.getOption("Graphic settings")) {
    let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) console.log("detected mobile device, using low settings");
    else console.log("detected desktop device, using high settings");
    OPTION_MANAGER.setOptionValue("Graphic settings", isMobile ? "low" : "high");
}

/**
 * INPUTS
 */

addKeyInput("Main menu", "Escape", 1, 0);
addKeyInput("Wireframe", "F2", 1, 0);
addKeyInput("DetachCamera", "KeyT", 1, 0);
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

addKeyInput("MoveForward", "KeyW", 1, 0);
addKeyInput("MoveForward", "KeyS", -1, 0);
addKeyInput("MoveRight", "KeyE", 1, 0);
addKeyInput("MoveRight", "KeyQ", -1, 0);
addKeyInput("MoveUp", "KeyA", 1, 0);
addKeyInput("MoveUp", "KeyD", -1, 0);
addMouseAxisInput("MoveSpeed", 3, 1);

addGamepadAxisInput("Roll", "0b9b-4012-GOLD WARRIOR SIM -  XTR5.5+G2+FMS Controller", 0, 1);
addGamepadAxisInput("Pitch", "0b9b-4012-GOLD WARRIOR SIM -  XTR5.5+G2+FMS Controller", 6, -1);
addGamepadAxisInput("Yaw", "0b9b-4012-GOLD WARRIOR SIM -  XTR5.5+G2+FMS Controller", 5, -1);
addGamepadAxisInput("Throttle", "0b9b-4012-GOLD WARRIOR SIM -  XTR5.5+G2+FMS Controller", 1, 1);


/**
 * RESOURCES
 */

function loadResources() {
    RESOURCE_MANAGER.loadMeshResource('./models/F-16/F-16_b.glb', 'modele_F16');
    RESOURCE_MANAGER.loadMeshResource('./models/debugCube.glb', 'debugCube');
    RESOURCE_MANAGER.loadMeshResource('./models/detailedTree.glb', 'model_detailedTree');

    RESOURCE_MANAGER.loadFileResource('./shaders/PostProcess/postProcess.FS.glsl', 'fragmentShader_postProcess');
    RESOURCE_MANAGER.loadFileResource('./shaders/PostProcess/postProcess.VS.glsl', 'vertexShader_postProcess');
    RESOURCE_MANAGER.loadFileResource('./shaders/landscape.a.VS.glsl', 'vertexShader_landscape_a');
    RESOURCE_MANAGER.loadFileResource('./shaders/landscape.b.VS.glsl', 'vertexShader_landscape_b');
    RESOURCE_MANAGER.loadFileResource('./shaders/landscape.a.FS.glsl', 'fragmentShader_landscape_a');
    RESOURCE_MANAGER.loadFileResource('./shaders/landscape.b.FS.glsl', 'fragmentShader_landscape_b');
    RESOURCE_MANAGER.loadFileResource('./shaders/impostors/impostorsV2.VS.glsl', 'vertexShader_impostors');
    RESOURCE_MANAGER.loadFileResource('./shaders/impostors/impostorsV2.FS.glsl', 'fragmentShader_impostors');
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

function preInit() {

    // Wait resource loading...
    if (RESOURCE_MANAGER.isLoadingResource()) {
        requestAnimationFrame(preInit);
        return;
    }
    console.log('loading complete. Starting simulation');
    isReady = true;
}

/**
 * INITIALIZATION
 */

function init() {

    const background = document.getElementById('game');
    initializeInputs(background);

    // Setup clock
    clock = new THREE.Clock();

    // Register stat window
    stats = new Stats();
    background.appendChild( stats.dom );

    // Initialize world
    gamemode = new DefaultGamemode();
    gameRenderer = new GameRenderer(null, document.getElementById('game'), gamemode);

    // build impostors
    RESOURCE_MANAGER.model_detailedTree.scene.traverse(function(child) { if (child.isMesh) child.material.metalness = 0; });
    RESOURCE_MANAGER.model_detailedTree.scene.rotation.z += -Math.PI / 2;
    RESOURCE_MANAGER.TreeImpostor = new ImpostorRenderer(RESOURCE_MANAGER.model_detailedTree.scene);
    RESOURCE_MANAGER.TreeImpostor.render(gameRenderer.renderer);
    addInputPressAction("Wireframe", () => { RESOURCE_MANAGER.TreeImpostor.material.wireframe = !RESOURCE_MANAGER.TreeImpostor.material.wireframe; });
}

function animate() {
    let deltaTime = clock.getDelta();

    updateInputs();

    gamemode.update(deltaTime);
    gameRenderer.render(gamemode);
    stats.update();

    requestAnimationFrame(animate);
}

function releaseRenderer() {
    if (isReady) {
        init();
        animate();
    }
}

loadResources();
preInit();