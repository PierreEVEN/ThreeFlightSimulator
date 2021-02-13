import * as THREE from "../../threejs/build/three.module.js";
import {addInputPressAction, initializeInputs} from "../io/inputManager.js";
import {EffectComposer} from "../../threejs/examples/jsm/postprocessing/EffectComposer.js";
import {RenderPass} from "../../threejs/examples/jsm/postprocessing/RenderPass.js";
import {SMAAPass} from "../../threejs/examples/jsm/postprocessing/SMAAPass.js";
import {UnrealBloomPass} from "../../threejs/examples/jsm/postprocessing/UnrealBloomPass.js";
import {Vector2} from "../../threejs/build/three.module.js";
import {RESOURCE_MANAGER} from "../resourceManager.js";
import {ImpostorRenderer} from "../impostorRenderer.js";

export {GameRenderer}

let gameRenderer = null;

class GameRenderer {

    constructor(clearColor, domElement, camera) {

        gameRenderer = this;

        this.clearColor = clearColor ? clearColor : new THREE.Color(0,0,0);//new THREE.Color(.6 * 0.8, .8 * 0.8, 0.8);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({antialias: false});
        this.renderer.autoClear = false;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        domElement.appendChild(this.renderer.domElement);


        // build impostors
        RESOURCE_MANAGER.model_detailedTree.scene.traverse(function(child) { if (child.isMesh) child.material.metalness = 0; });
        RESOURCE_MANAGER.model_detailedTree.scene.rotation.z += -Math.PI / 2;
        RESOURCE_MANAGER.TreeImpostor = new ImpostorRenderer(RESOURCE_MANAGER.model_detailedTree.scene);
        RESOURCE_MANAGER.TreeImpostor.render(this.renderer);
        addInputPressAction("Wireframe", () => { RESOURCE_MANAGER.TreeImpostor.material.wireframe = !RESOURCE_MANAGER.TreeImpostor.material.wireframe; });

        // Create world render target
        this.sceneRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
        this.sceneRenderTarget.texture.format = THREE.RGBFormat;
        this.sceneRenderTarget.texture.minFilter = THREE.NearestFilter;
        this.sceneRenderTarget.texture.magFilter = THREE.NearestFilter;
        this.sceneRenderTarget.texture.generateMipmaps = false;
        this.sceneRenderTarget.depthBuffer = true;
        this.sceneRenderTarget.depthTexture = new THREE.DepthTexture();
        this.sceneRenderTarget.depthTexture.format = THREE.DepthFormat;
        this.sceneRenderTarget.depthTexture.type = THREE.UnsignedIntType;


        // Create render target scene
        this.renderTargetScene = new THREE.Scene();
        this.renderTargetMaterial = new THREE.ShaderMaterial({
            uniforms: {
                cameraNear: {value: camera.near},
                cameraFar: {value: camera.far},
                projectionInverseMatrix : {value: null},
                cameraWorldInverseMatrix: {value: null},
                tDiffuse: {value: this.sceneRenderTarget.texture},
                tDepth: {value: this.sceneRenderTarget.depthTexture}
            },
            vertexShader: RESOURCE_MANAGER.vertexShader_postProcess,
            fragmentShader: RESOURCE_MANAGER.fragmentShader_postProcess,
        });
        this.renderTargetMaterial.tDiffuse = this.sceneRenderTarget.texture;
        this.renderTargetMaterial.tDepth = this.sceneRenderTarget.depthTexture;
        const obj = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.renderTargetMaterial);
        obj.frustumCulled = false;
        this.renderTargetScene.add(obj);

        // Create composer
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.renderTargetScene, camera));
        this.AAPass = new SMAAPass(window.innerWidth, window.innerHeight)
        this.composer.addPass(this.AAPass);
        this.composer.addPass(new UnrealBloomPass(new Vector2(256, 256), 0.23));


        // Set resize delegate
        window.addEventListener('resize', function () {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            gameRenderer.AAPass.setSize(window.innerWidth, window.innerHeight);
            gameRenderer.renderer.setSize(window.innerWidth, window.innerHeight);
            gameRenderer.composer.setSize(window.innerWidth, window.innerHeight);
            gameRenderer.sceneRenderTarget.setSize(window.innerWidth, window.innerHeight);
        });
    }

    render = function(renderedWorld, camera) {

        this.renderTargetMaterial.uniforms.projectionInverseMatrix.value = camera.projectionMatrixInverse;
        this.renderTargetMaterial.uniforms.cameraWorldInverseMatrix.value = camera.matrixWorld;


        this.renderer.setClearColor(this.clearColor, 1);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.renderer.setRenderTarget( this.sceneRenderTarget );
        this.renderer.clear();
        this.renderer.render(renderedWorld.scene, camera);

        this.composer.render();
    }
}