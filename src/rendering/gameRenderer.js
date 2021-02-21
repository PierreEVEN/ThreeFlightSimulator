import * as THREE from "../../threejs/build/three.module.js";
import {EffectComposer} from "../../threejs/examples/jsm/postprocessing/EffectComposer.js";
import {RenderPass} from "../../threejs/examples/jsm/postprocessing/RenderPass.js";
import {UnrealBloomPass} from "../../threejs/examples/jsm/postprocessing/UnrealBloomPass.js";
import {Vector2} from "../../threejs/build/three.module.js";
import {RESOURCE_MANAGER} from "../io/resourceManager.js";
import {GUI} from "../../threejs/examples/jsm/libs/dat.gui.module.js";
import {FXAAShader} from "../../threejs/examples/jsm/shaders/FXAAShader.js";
import {ShaderPass} from "../../threejs/examples/jsm/postprocessing/ShaderPass.js";
import {OPTION_MANAGER} from "../io/optionManager.js";
import {CSM} from "../../threejs/examples/jsm/csm/CSM.js";
import {addInputPressAction} from "../io/inputManager.js";

export {GameRenderer}

let rendererInstance = null, fxaaPass = null;

class GameRenderer {

    constructor(clearColor, domElement, gamemode) {

        rendererInstance = this;

        this.sunDirectionVector = gamemode.sunDirectionVector;

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({antialias: false});
        this.renderer.autoClear = false;
        this.renderer.setPixelRatio(window.devicePixelRatio * OPTION_MANAGER.options["pixel percentage"].value / 100);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        domElement.appendChild(this.renderer.domElement);

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
        this.bUsePostProcessing = OPTION_MANAGER.options["post processing"].value;

        // Create render target scene
        this.renderTargetScene = new THREE.Scene();

        this.renderTargetMaterial = new THREE.ShaderMaterial({
            uniforms: {
                cameraNear: {value: gamemode.camera.near},
                cameraFar: {value: gamemode.camera.far},
                projectionInverseMatrix : {value: null},
                cameraWorldInverseMatrix: {value: null},
                tDiffuse: {value: this.sceneRenderTarget.texture},
                tDepth: {value: this.sceneRenderTarget.depthTexture},
                planetCenter: {value: new THREE.Vector3(0, 0, -9985946)},
                atmosphereRadius: { value: 10000000},
                planetRadius: {value : 4000},
                atmosphereDensityFalloff: {value: 3.9},
                scatterCoefficients: { value: new THREE.Vector3(700, 550, 460)},
                NumScatterPoints: {value : OPTION_MANAGER.options["atmospheric scattering quality"].value},
                NumOpticalDepthPoints: {value : OPTION_MANAGER.options["atmospheric scattering quality"].value},
                sunDirection: {value: new THREE.Vector3(1, 1, 1).normalize()}
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
        fxaaPass = new ShaderPass(FXAAShader);
        const pixelRatio = this.renderer.getPixelRatio();
        fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( window.innerWidth * pixelRatio);
        fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( window.innerHeight * pixelRatio );
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.renderTargetScene, gamemode.camera));
        this.composer.addPass(fxaaPass);
        this.composer.addPass(new UnrealBloomPass(new Vector2(256, 256), 0.23));



        // Set resize delegate
        window.addEventListener('resize', function () {
            gamemode.camera.aspect = window.innerWidth / window.innerHeight;
            gamemode.camera.updateProjectionMatrix();
            fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( window.innerWidth * pixelRatio);
            fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( window.innerHeight * pixelRatio);
            rendererInstance.renderer.setSize(window.innerWidth, window.innerHeight);
            rendererInstance.composer.setSize(window.innerWidth, window.innerHeight);
            rendererInstance.sceneRenderTarget.setSize(window.innerWidth, window.innerHeight);
        });

        this.scatterValues = new THREE.Vector3(700, 530, 440);
        this.scatteringStrength = 2.62;

        OPTION_MANAGER.bindOption(this, "atmospheric scattering quality" ,(context, value) => {
            context.renderTargetMaterial.uniforms.NumScatterPoints.value = value;
            context.renderTargetMaterial.uniforms.NumOpticalDepthPoints.value = value;
        });

        OPTION_MANAGER.bindOption(this, "pixel percentage" ,(context, value) => {
            context.renderer.setPixelRatio(window.devicePixelRatio * (value / 100.0));
            context.sceneRenderTarget.setSize(window.innerWidth * value / 100, window.innerHeight * value / 100)
        });

        OPTION_MANAGER.bindOption(this, "post processing" ,(context, value) => {
            context.bUsePostProcessing = value;
            if (!value) context.clearColor = new THREE.Color(102 / 256, 203 / 256, 239 / 256);
            else context.clearColor = new THREE.Color(0, 0, 0);
        });
        this.clearColor = OPTION_MANAGER.options["post processing"].value ? new THREE.Color(0,0,0) : new THREE.Color(102 / 256, 203 / 256, 239 / 256);

        /**
         * Setup cascaded shadow maps
         */


        const splitFunction = function ( amount, near, far, target ) {


            target.push( 0.001 );
            target.push( 0.005 );
            target.push( 0.5 );
            target.push( 1 );
        }

        this.csm = new CSM( {
            maxFar: 5000,
            lightFar: 20000,
            shadowMapSize: 4096,
            shadowBias: 0.000000001,
            lightDirection: gamemode.sunDirectionVector,
            camera: gamemode.camera,
            parent: gamemode.scene,
            mode: 'custom',
            lightIntensity: 1,
            cascades: 4,
            fade: true,
            customSplitsCallback: splitFunction,
        } );
        this.csm.fade = true;
        this.csm.update();
        this.enableShadows = OPTION_MANAGER.options["shadows"].value;
        this.renderer.shadowMap.enabled = this.enableShadows;

        OPTION_MANAGER.bindOption(this, "shadows" ,(context, value) => {
            context.enableShadows = value;
            this.renderer.shadowMap.enabled = value;
        });

        if (gamemode.setMaterialCsmShadows) gamemode.setMaterialCsmShadows(this.csm);

        this.gui = new GUI();
        const sunFolder = this.gui.addFolder("sun");
        sunFolder.add(gamemode.sunDirectionVector, 'x', -1, 1).name('X').listen();
        sunFolder.add(gamemode.sunDirectionVector, 'y', -1, 1).name('Y').listen();
        sunFolder.add(gamemode.sunDirectionVector, 'z', -1, 1).name('Z').listen();
    }

    render = function(gamemode) {
        let scatterR = Math.pow(400 / this.scatterValues.x, 4) * this.scatteringStrength;
        let scatterG = Math.pow(400 / this.scatterValues.y, 4) * this.scatteringStrength;
        let scatterB = Math.pow(400 / this.scatterValues.z, 4) * this.scatteringStrength;

        this.sunDirectionVector.normalize();

        RESOURCE_MANAGER.TreeImpostor.material.uniforms.lightDir.value = this.sunDirectionVector;

        this.renderTargetMaterial.uniforms.sunDirection.value.set(-this.sunDirectionVector.x, -this.sunDirectionVector.y, -this.sunDirectionVector.z);
        this.renderTargetMaterial.uniforms.scatterCoefficients.value.set(scatterR, scatterG, scatterB);


        this.renderTargetMaterial.uniforms.projectionInverseMatrix.value = gamemode.camera.projectionMatrixInverse;
        this.renderTargetMaterial.uniforms.cameraWorldInverseMatrix.value = gamemode.camera.matrixWorld;

        this.renderer.setClearColor(this.clearColor, 1);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.renderer.setRenderTarget( this.bUsePostProcessing ? this.sceneRenderTarget : null);
        this.renderer.clear();

        this.renderer.render(gamemode.scene, gamemode.camera);

        if (this.bUsePostProcessing) this.composer.render();

        if (this.csm && this.enableShadows) this.csm.update();
    }
}