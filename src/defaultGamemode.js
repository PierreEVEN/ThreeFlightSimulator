import * as THREE from "../threejs/build/three.module.js";
import {PlaneController} from "./io/planeController.js";
import {RESOURCE_MANAGER} from "./io/resourceManager.js";
import {Plane} from "./objects/plane.js";
import {SaveGame} from "./io/saveGame.js";
import {FoliageSystem} from "./rendering/foliageSystem.js";
import {Landscape} from "./rendering/landscape.js";
import {enableMouseCapture} from "./io/inputManager.js";
import {getHeightAtLocation} from "./rendering/HeightGenerator.js";


export { DefaultGamemode }


function createPlane(scene) {
    let rootNode = null;
    RESOURCE_MANAGER.modele_F16.scene.traverse(function (child) {
        if (child.isMesh) {
            child.material.metalness = 0.95;
            child.material.roughness = 0.01;
            if (rootNode === null) {
                rootNode = new THREE.Mesh(child.geometry, child.material);
            } else {
                let NewMesh = new THREE.Mesh(child.geometry, child.material);
                rootNode.attach(NewMesh);
            }
        }
    });
    scene.add(rootNode);
    return new Plane(scene, rootNode, true);
}

class DefaultGamemode {

    constructor() {
        enableMouseCapture();

        this.sunDirectionVector = new THREE.Vector3(0, 0, -1);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);

        this.scene = new THREE.Scene();
        this.plane = createPlane(this.scene);
        this.controller = new PlaneController(this.plane, this.camera);
        new SaveGame(this.controller);

        this.fillScene();
    }

    fillScene() {

        const lightIntensity = 0.1;
        this.ambiantLight = new THREE.AmbientLight(new THREE.Color(lightIntensity, lightIntensity, lightIntensity));
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        this.scene.add(this.ambiantLight);
        this.scene.add(this.directionalLight);

        this.landscape = new Landscape(this.scene, this.camera);
        this.foliageSystem = new FoliageSystem(this.scene, null, this.camera);
    }

    update(deltaTime) {

        this.directionalLight.position.set(-this.sunDirectionVector.x, -this.sunDirectionVector.y, -this.sunDirectionVector.z)


        this.landscape.update(deltaTime);
        this.foliageSystem.update();
        this.plane.update(deltaTime);


        if (this.plane.position.z < getHeightAtLocation(this.plane.position.x, this.plane.position.y)) {
            this.plane.position.set(0, 0, getHeightAtLocation(this.plane.position.x, this.plane.position.y) + 100);
            this.plane.velocity.set(0, 0, 0);
            this.plane.rotation.identity();
        }


        this.controller.update(deltaTime);
    }

}
