import * as THREE from "../threejs/build/three.module.js";
import {OrbitControls} from "../threejs/examples/jsm/controls/OrbitControls.js";
import {RESOURCE_MANAGER} from "./io/resourceManager.js";
import {Quaternion} from "../threejs/build/three.module.js";
import {CSM} from "../threejs/examples/jsm/csm/CSM.js";
import {CSMHelper} from "../threejs/examples/jsm/csm/CSMHelper.js";
import {Plane} from "./objects/plane.js";

export { DevGamemode }

function createPlane(scene) {
    RESOURCE_MANAGER.modele_F16.scene.traverse(function (child) {
        if (child.isMesh) {
            child.material.metalness = 0;
            child.material.roughness = 1;
            if (child.name !== "CanopyGlass") {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        }
    });
    scene.add(RESOURCE_MANAGER.modele_F16.scene);
    return new Plane(scene, RESOURCE_MANAGER.modele_F16.scene, false);
}

class DevGamemode {

    constructor() {
        this.sunDirectionVector = new THREE.Vector3(0, 1, -1);
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
        this.camera.up = new THREE.Vector3(0, 0, 1);
        this.scene = new THREE.Scene();

        this.scene.add(new THREE.AmbientLight())

        this.plane = createPlane(this.scene);
        this.controller = new OrbitControls(this.camera, document.getElementById('game'));

        this.camera.position.set(0, 0, 50);
    }

    update(deltaTime) {
        if (!this.bg) {
            this.bg = true;
            this.createBG();
        }

        this.controller.update();

        this.plane.update(deltaTime);

    }



    createBG() {



        this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshPhysicalMaterial({})));
/*
        const instCount = 20;
        const spacing = 2;

        let mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), RESOURCE_MANAGER.TreeImpostor.material, instCount * instCount);
        mesh.position.z += 0.5;
        mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
        let Mat = new THREE.Matrix4();

        for (let x = 0; x < instCount; ++x) {
            for (let y = 0; y < instCount; ++y) {
                Mat.identity();
                Mat.compose(new THREE.Vector3(x * spacing, y * spacing), new THREE.Quaternion().identity(), new THREE.Vector3(1, 1, 1));
                mesh.setMatrixAt(x + y * instCount, Mat);
            }
        }


        for (const angle of RESOURCE_MANAGER.TreeImpostor.getCameraAngles()) {

            const rotation = new THREE.Euler(0, angle.pitch, angle.yaw, 'ZYX');
            const direction = new THREE.Vector3(1, 0, 0).applyEuler(rotation);

            const arrow = new THREE.ArrowHelper(direction, new THREE.Vector3(0, 0, 0).addScaledVector(direction, -5), 1, new THREE.Color(1, 1, 0), 0.4, 0.2);

            this.scene.add(arrow);


        }




        this.scene.add(mesh);
 */

    }
}
