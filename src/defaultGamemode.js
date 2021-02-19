import * as THREE from "../threejs/build/three.module.js";
import {PlaneController} from "./io/planeController.js";
import {RESOURCE_MANAGER} from "./io/resourceManager.js";
import {Plane} from "./objects/plane.js";
import {FoliageSystem} from "./rendering/foliageSystem.js";
import {Landscape} from "./rendering/landscape.js";
import {enableMouseCapture} from "./io/inputManager.js";
import {getHeightAtLocation} from "./rendering/HeightGenerator.js";
import {OPTION_MANAGER} from "./io/optionManager.js";
import {CSM} from "../threejs/examples/jsm/csm/CSM.js";
import {CSMHelper} from "../threejs/examples/jsm/csm/CSMHelper.js";
import {MeshPhysicalMaterial} from "../threejs/build/three.module.js";


export { DefaultGamemode }


function createPlane(scene) {
    RESOURCE_MANAGER.modele_F16.scene.traverse(function (child) {
        if (child.isMesh) {
            child.material.metalness = 0;
            child.material.roughness = 1;
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    scene.add(RESOURCE_MANAGER.modele_F16.scene);
    return new Plane(scene, RESOURCE_MANAGER.modele_F16.scene, false);
}

class DefaultGamemode {

    constructor() {
        enableMouseCapture();

        this.sunDirectionVector = new THREE.Vector3(0, 1, -1).normalize();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, OPTION_MANAGER.options["camera min"].value, OPTION_MANAGER.options["camera max"].value);




        this.scene = new THREE.Scene();
        this.plane = createPlane(this.scene);
        this.controller = new PlaneController(this.plane, this.camera);

        this.fillScene();


        OPTION_MANAGER.bindOption(this, "camera min" ,(context, value) => {
            context.camera.near = value;
            console.log("update near : " + value);
            context.camera.updateProjectionMatrix();
        });

        OPTION_MANAGER.bindOption(this, "camera max" ,(context, value) => {
            context.camera.far = value;
            context.camera.updateProjectionMatrix();
        });
    }

    fillScene() {

        const lightIntensity = 0.1;
        this.ambiantLight = new THREE.AmbientLight(new THREE.Color(lightIntensity, lightIntensity, lightIntensity));
        this.scene.add(this.ambiantLight);

        this.landscape = new Landscape(this.scene, this.camera);
        this.foliageSystem = new FoliageSystem(this.scene, null, this.camera);
    }

    update(deltaTime) {

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

    setMaterialCsmShadows(csm) {
        this.plane.mesh.traverse(function (child) {
            if (child.isMesh) {
                csm.setupMaterial(child.material);
            }
        });
    }

}
