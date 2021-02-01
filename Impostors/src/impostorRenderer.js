import {RESOURCE_MANAGER} from "./resourceManager.js";

export {ImpostorRenderer}
import * as THREE from '../threejs/build/three.module.js';

const renderTargetResolution = 8192;
const captureRadius = 13;
const alpha = 0;
const notch = renderTargetResolution / (captureRadius * 2);


// noinspection JSSuspiciousNameCombination
class ImpostorRenderer {


    constructor(camera) {
        //let object = new THREE.Mesh(new THREE.TorusGeometry(), new THREE.MeshPhysicalMaterial())
        let object = RESOURCE_MANAGER.model_treeBasic.scene;
        let objectBounds = new THREE.Box3().setFromObject(object);
        let objectSize = new THREE.Vector3();
        let objectCenter = new THREE.Vector3();
        objectBounds.getSize(objectSize);
        objectBounds.getCenter(objectCenter);

        let radius = objectSize.length() / 2 / 1.5;

        this.camera = new THREE.OrthographicCamera( -radius, radius, radius, -radius, - 100, 100 );

        this.scene = new THREE.Scene();

        this.scene.add(camera);

        this.scene.add(new THREE.DirectionalLight());

        object.position.x -= objectCenter.y;
        object.rotation.z += -Math.PI/2;
        this.scene.add(object);

        this.renderTarget = new THREE.WebGLRenderTarget(
            renderTargetResolution,
            renderTargetResolution,
            {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.NearestFilter,
                format: THREE.RGBAFormat
            });

        RESOURCE_MANAGER.captureRadius = captureRadius;
        RESOURCE_MANAGER.TEST = this.renderTarget;

    }

    renderItem(w, posX, posY, renderer) {
        length = Math.sqrt(posX * posX + posY * posY);
        const normPosX = posX / length;
        const normPosY = posY / length;

        // camera yaw
        this.camera.rotation.x = (posX === 0 && posY === 0) ? 0 : Math.atan2(normPosX, normPosY);

        //camera pitch
        this.camera.rotation.y = Math.cos(w / captureRadius * (Math.PI / 2)) * Math.PI / 2;

        let x = (posX - 0.5 + captureRadius) * notch;
        let y = (posY - 0.5 + captureRadius) * notch;

        renderer.setViewport(x, y, notch, notch);
        renderer.render(this.scene, this.camera);
    }

    render(renderer) {
        renderer.setRenderTarget(this.renderTarget);
        renderer.setClearAlpha(alpha);
        renderer.clear();

        for (let r = 1; r <= captureRadius; ++r) {
            for (let i = -r; i < r; ++i) {
                this.renderItem(r, i + 0.5, r - 0.5, renderer);
                this.renderItem(r, i + 0.5, -r + 0.5, renderer);
            }
            for (let i = -r + 1; i < r - 1; ++i) {
                this.renderItem(r, r - 0.5, i + 0.5, renderer);
                this.renderItem(r, -r + 0.5, i + 0.5, renderer);
            }
        }
    }
}