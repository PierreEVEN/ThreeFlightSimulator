import {RESOURCE_MANAGER} from "./resourceManager.js";

export {ImpostorRenderer}
import * as THREE from '../threejs/build/three.module.js';

const renderTargetResolution = 8192;
const captureRadius = 5;
const alpha = 0;
const notch = renderTargetResolution / (captureRadius * 2);


class ImpostorRenderer {


    constructor() {
        //let object = new THREE.Mesh(new THREE.TorusGeometry(), new THREE.MeshPhysicalMaterial())
        let object = RESOURCE_MANAGER.model_treeBasic.scene;

        object.traverse(function(child) {
            if (child.isMesh) {
                child.material.metalness = 0;
            }
        });

        let objectBounds = new THREE.Box3().setFromObject(object);
        let objectSize = new THREE.Vector3();
        let objectCenter = new THREE.Vector3();
        objectBounds.getSize(objectSize);
        objectBounds.getCenter(objectCenter);

        let radius = objectSize.length() / 2 / 1.5;

        this.camera = new THREE.OrthographicCamera( -radius, radius, radius, -radius, - 100, 100 );
        this.colorScene = new THREE.Scene();
        this.colorScene.add(new THREE.AmbientLight());

        object.position.x -= objectCenter.y;
        object.rotation.z += -Math.PI/2;
        this.colorScene.add(object);

        this.colorTarget = new THREE.WebGLRenderTarget(
            renderTargetResolution,
            renderTargetResolution,
            {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.NearestFilter,
                format: THREE.RGBAFormat
            });

        this.normalTarget = new THREE.WebGLRenderTarget(
            renderTargetResolution,
            renderTargetResolution,
            {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.NearestFilter,
                format: THREE.RGBFormat
            });

        this.normalScene = new THREE.Scene();
        this.createMeshObject(RESOURCE_MANAGER.model_treeBasic.scene, this.normalScene, object.position.x, object.position.z);

        RESOURCE_MANAGER.captureRadius = captureRadius;
        RESOURCE_MANAGER.TEST = this.colorTarget;
        RESOURCE_MANAGER.TEST2 = this.normalTarget;

    }

    createMeshObject(baseScene, normalScene, x, z) {

        let impostorNormalMat = new THREE.ShaderMaterial( {
            //wireframe:true,
            //vertexColors: true,
            vertexShader: RESOURCE_MANAGER.vertexShader_normal,
            fragmentShader: RESOURCE_MANAGER.fragmentShader_normal,
        });

        baseScene.traverse(function(child) {
            if (child.isMesh) {
                let mesh = new THREE.Mesh(child.geometry, impostorNormalMat);
                mesh.position.set(x, 0, z);
                mesh.rotation.z = -Math.PI / 2;
                mesh.scale.set(0.01,0.01,0.01);
                normalScene.add(mesh);
            }
        });

    }

    renderItem(w, posX, posY, renderer, scene) {
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
        renderer.render(scene, this.camera);
    }

    runCapture(renderer, scene) {

        for (let r = 1; r <= captureRadius; ++r) {
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

        renderer.setClearAlpha(alpha);

        renderer.setRenderTarget(this.colorTarget);
        renderer.clear();
        this.runCapture(renderer, this.colorScene);

        renderer.setRenderTarget(this.normalTarget);
        renderer.clear();
        this.runCapture(renderer, this.normalScene);
    }
}