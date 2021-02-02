import {RESOURCE_MANAGER} from "./resourceManager.js";

export {ImpostorRenderer}
import * as THREE from '../threejs/build/three.module.js';

/*
Create normal material
 */
let normalMaterial;

function getNormalMaterial() {
    if (!normalMaterial) {
        normalMaterial = new THREE.ShaderMaterial({
            vertexShader: RESOURCE_MANAGER.vertexShader_normal,
            fragmentShader: RESOURCE_MANAGER.fragmentShader_normal,
        });
    }
    return normalMaterial;
}

class ImpostorRenderer {


    constructor(renderedObject) {

        this.objectScaleFactor = 1.5;
        this.captureRadius = 5;
        this.renderTargetResolution = 2048;
        this.alpha = 0;

        this.object = this.makeObject(renderedObject);
        this.camera = this.generateCamera(this.object);
        this.baseScene = this.createColorScene(this.object);
        this.normalScene = this.createNormalScene(this.object);

        this.colorTarget = this.createRenderTarget(THREE.RGBAFormat,this.renderTargetResolution);
        this.normalTarget = this.createRenderTarget(THREE.RGBFormat, this.renderTargetResolution);

        this.material = this.createMaterial(this.colorTarget, this.normalTarget, this.captureRadius);
    }

    makeObject(base) {
        let object = base.clone();

        const objectBounds = new THREE.Box3().setFromObject(object);
        const objectSize = new THREE.Vector3();
        const objectCenter = new THREE.Vector3();
        objectBounds.getSize(objectSize);
        objectBounds.getCenter(objectCenter);

        object.position.x -= objectCenter.x;

        return object;
    }

    generateCamera(object) {
        const objectBounds = new THREE.Box3().setFromObject(object);
        const objectSize = new THREE.Vector3();
        objectBounds.getSize(objectSize);
        const radius = objectSize.length() / 2 / this.objectScaleFactor;
        return new THREE.OrthographicCamera( -radius, radius, radius, -radius, -1000, 1000 );
    }

    createColorScene(object) {
        const colorScene = new THREE.Scene();
        colorScene.add(new THREE.AmbientLight());
        colorScene.add(object);
        return colorScene;
    }

    createNormalScene(object) {
        const normalScene = new THREE.Scene();
        normalScene.add(new THREE.AmbientLight());

        const normalObject = object.clone();

        normalObject.traverse(function(child) {
            if (child.isMesh) {
                child.material = getNormalMaterial();
            }
        });

        normalScene.add(normalObject);
        return normalScene;
    }

    createRenderTarget(format, resolution) {
        return new THREE.WebGLRenderTarget(
            resolution,
            resolution,
            {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.NearestFilter,
                format: format
            });
    }

    createMaterial(colorTarget, normalTarget, captureRadius) {
        const uniforms = {
            lightDir: { value: new THREE.Vector3(0, 1, 0) },
            captureRadius: { value: captureRadius },
            colorTexture: {type: 't', value: colorTarget.texture },
            normalTexture: {type: 't', value: normalTarget.texture },
        }

        const material = new THREE.ShaderMaterial( {
            uniforms: uniforms,
            vertexShader: RESOURCE_MANAGER.vertexShader_impostors,
            fragmentShader: RESOURCE_MANAGER.fragmentShader_impostors,
        });
        material.colorTexture = colorTarget.texture;
        material.normalTexture = normalTarget.texture;

        return material;
    }

    setLightDirection() {

    }

    renderItem(w, posX, posY, renderer, scene) {
        length = Math.sqrt(posX * posX + posY * posY);
        const normPosX = posX / length;
        const normPosY = posY / length;
        const notch = this.renderTargetResolution / (this.captureRadius * 2);

        // camera yaw
        this.camera.rotation.x = (posX === 0 && posY === 0) ? 0 : Math.atan2(normPosX, normPosY);

        //camera pitch
        this.camera.rotation.y = Math.cos(w / this.captureRadius * (Math.PI / 2)) * Math.PI / 2;

        let x = (posX - 0.5 + this.captureRadius) * notch;
        let y = (posY - 0.5 + this.captureRadius) * notch;

        renderer.setViewport(x, y, notch, notch);
        renderer.render(scene, this.camera);
    }

    runCapture(renderer, scene) {

        for (let r = 1; r <= this.captureRadius; ++r) {
            for (let i = -r; i < r; ++i) {
                this.renderItem(r, i + 0.5, r - 0.5, renderer, scene);
                this.renderItem(r, i + 0.5, -r + 0.5, renderer, scene);
            }
            for (let i = -r + 1; i < r - 1; ++i) {
                this.renderItem(r, r - 0.5, i + 0.5, renderer, scene);
                this.renderItem(r, -r + 0.5, i + 0.5, renderer, scene);
            }
        }
    }

    render(renderer) {
        renderer.setClearAlpha(this.alpha);

        renderer.setRenderTarget(this.colorTarget);
        renderer.clear();
        this.runCapture(renderer, this.baseScene);

        renderer.setRenderTarget(this.normalTarget);
        renderer.clear();
        this.runCapture(renderer, this.normalScene);
    }

}