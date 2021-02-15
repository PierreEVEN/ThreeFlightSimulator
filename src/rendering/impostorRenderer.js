import {RESOURCE_MANAGER} from "../io/resourceManager.js";

export {ImpostorRenderer}
import * as THREE from '../../threejs/build/three.module.js';

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

        this.objectScaleFactor = 1.0;
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
                generateMipmaps: true,
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
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


    capturePointToUvCoordinates(stageCaptureCount, percentYaw) {
        let posX;
        let posY;
        if (percentYaw <= 0.25) {
            posX = 1;
            posY = percentYaw * 8 - 1;
        }
        else if (percentYaw <= 0.5) {
            posX = -percentYaw * 8 + 3;
            posY = 1;
        }
        else if (percentYaw <= 0.75) {
            posX = -1;
            posY = -percentYaw * 8 + 5;
        }
        else {
            posX = percentYaw * 8 - 7;
            posY = -1;
        }
        return {
            posX: posX,
            posY: posY
        }
    }


    getCameraAngles() {
        const cameraAngles = [];

        const atlasItemSize = this.renderTargetResolution / (this.captureRadius * 2);

        for (let r = 1; r <= this.captureRadius; ++r) {
            const stageCaptureCount = (r * 8 - 4);
            for (let x = 0; x < stageCaptureCount; ++x) {


                const uvPos = this.capturePointToUvCoordinates(stageCaptureCount, x / stageCaptureCount);

                cameraAngles.push({
                    pitch: (Math.PI / 2) - (r / (this.captureRadius) * (Math.PI / 2)),
                    yaw: x / stageCaptureCount * Math.PI * 2 + Math.PI / 4,
                    atlasItemSize: atlasItemSize,
                    x: uvPos.posX * (r - 0.5),
                    y: uvPos.posY * (r - 0.5)
                })
            }
        }
        return cameraAngles;
    }


    runCapture(renderer, scene) {

        for (const angle of this.getCameraAngles()) {

            this.camera.rotation.y = angle.pitch;
            this.camera.rotation.x = angle.yaw - Math.PI / 4;

            const pixelRatio = renderer.getPixelRatio();

            renderer.setViewport((angle.x + this.captureRadius - 0.5) * angle.atlasItemSize / pixelRatio, (angle.y + this.captureRadius - 0.5) * angle.atlasItemSize / pixelRatio, angle.atlasItemSize / pixelRatio, angle.atlasItemSize / pixelRatio);
            renderer.render(scene, this.camera);
        }
    }

    render(renderer) {

        renderer.setClearAlpha(this.alpha);

        renderer.setSize(this.renderTargetResolution, this.renderTargetResolution);
        renderer.setRenderTarget(this.colorTarget);
        renderer.clear();
        this.runCapture(renderer, this.baseScene);
        renderer.setRenderTarget(this.normalTarget);
        renderer.clear();
        this.runCapture(renderer, this.normalScene);

    }
}