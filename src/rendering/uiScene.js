import * as THREE from "../../threejs/build/three.module.js";
import {OPTION_MANAGER} from "../io/optionManager.js";

export {UIScene};

class UIScene {
    constructor(resX = 256, resY = 256) {
        this.renderer = new THREE.WebGLRenderer( { antialias:true });
        this.renderer.setClearAlpha(0);
        this.camera = new THREE.OrthographicCamera();
        this.camera.position.z = 1;
        this.scene = new THREE.Scene();
        this.renderTarget = new THREE.WebGLRenderTarget();
        this.renderer.setRenderTarget(this.renderTarget);
        this.setSize(resX, resY);

        this.renderer.setPixelRatio(window.devicePixelRatio * OPTION_MANAGER.options["pixel percentage"].value / 100);
        document.getElementById('game').appendChild(this.renderer.domElement);
    }

    setSize(sizeX, sizeY) {
        this.renderer.setSize(sizeX, sizeY);
        this.renderTarget.setSize(sizeX, sizeY);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}