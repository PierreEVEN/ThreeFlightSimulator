export {FoliageSystem}

import {GLTFLoader} from "../threejs/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from '../threejs/build/three.module.js';
import {RESOURCE_MANAGER} from './resourceManager.js'

const gltfLoader = new GLTFLoader();


let meshGroups = [];

class FoliageType {

    constructor() {
        this.minDistance = 0;
        this.maxDistance = 100;

        this.density = 0;

        RESOURCE_MANAGER.model_tree.scene.traverse(function(child) {
            if (child.isMesh) {
                meshGroups.push({
                    geometry:child.geometry,
                    material:child.material
                });
            }
        });

        for (let group of meshGroups) {
            group.mesh = new THREE.InstancedMesh(group.geometry, group.material, 300 * 300);
            group.mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
        }
    }
}




class FoliageSystem {

    constructor(scene, heightGenerator, foliageTypes, camera) {
        this.scene = scene;
        this.camera = camera;
        this.heightGenerator = heightGenerator;
        this.foliageTypes = [new FoliageType()];

        for (let group of meshGroups) {
            scene.add(group.mesh);

            group.mesh.count = 50 * 50;

            const matrix = new THREE.Matrix4();
            let spacing =50;
            let width = 50;
            let scale = 0.025;

            for (let x = 0; x < width; ++x) {
                for (let y = 0; y < width; ++y) {

                    let posX = x * spacing + Math.random() * spacing - spacing / 2 - width * spacing / 2;
                    let posY = y * spacing + Math.random() * spacing - spacing / 2 - width * spacing / 2;
                    let posZ = heightGenerator.getHeightAtLocation(posX, posY);
                    if (posZ < 30 || posZ > 250) continue;

                    matrix.makeRotationFromEuler(new THREE.Euler(Math.PI / 2, Math.random() * 100, 0));
                    matrix.scale(new THREE.Vector3(scale,scale,scale));
                    matrix.setPosition(posX, posY, posZ);
                    group.mesh.setMatrixAt(x + y * width, matrix);
                }
            }
        }


        this.rootSection = new foliageSystemSection(this, new THREE.Vector3());
    }

    update() {
        this.rootSection.update();
    }
}

class foliageSystemSection {
    constructor(foliageSystem, position) {
        this.foliageSystem = foliageSystem;
        this.rootNode = new foliageSystemNode(this.foliageSystem, 0, position, 1000);
    }

    update() {
        this.rootNode.update();
    }
}

class foliageSystemNode {
    constructor(foliageSystem, nodeLevel, nodePosition, nodeSize) {
        this.foliageSystem = foliageSystem;
        this.nodeLevel = nodeLevel;
        this.nodeSize = nodeSize;
        this.nodePosition = nodePosition;
        this.cameraGroundLocation = new THREE.Vector3();
        this.childs = [];
        this.mesh = null;
    }

    update() {
        this.generate();
        if (this.nodeLevel < this.getDesiredNodeLevel()) {
            this.subdivide();
        }
        else {
            this.unsubdivide();
        }

        for (let child of this.childs) {
            child.update();
        }
    }

    subdivide() {
        if (this.childs.length > 0) return;

        this.childs.push(new foliageSystemNode(
            this.foliageSystem,
            this.nodeLevel + 1,
            new THREE.Vector3(this.nodePosition.x - this.nodeSize / 4, this.nodePosition.y - this.nodeSize / 4, this.nodePosition.z),
            this.nodeSize / 2)
        );
        this.childs.push(new foliageSystemNode(
            this.foliageSystem,
            this.nodeLevel + 1,
            new THREE.Vector3(this.nodePosition.x + this.nodeSize / 4, this.nodePosition.y - this.nodeSize / 4, this.nodePosition.z),
            this.nodeSize / 2)
        );
        this.childs.push(new foliageSystemNode(
            this.foliageSystem,
            this.nodeLevel + 1,
            new THREE.Vector3(this.nodePosition.x + this.nodeSize / 4, this.nodePosition.y + this.nodeSize / 4, this.nodePosition.z),
            this.nodeSize / 2)
        );
        this.childs.push(new foliageSystemNode(
            this.foliageSystem,
            this.nodeLevel + 1,
            new THREE.Vector3(this.nodePosition.x - this.nodeSize / 4, this.nodePosition.y + this.nodeSize / 4, this.nodePosition.z),
            this.nodeSize / 2)
        );

    }

    unsubdivide() {
        if (this.childs.length === 0) return;

        for (let child of this.childs) {
            child.destroy();
        }
        this.childs = [];
    }

    generate() {
        if (this.generated) return;
        this.generated = true;

        console.log('add');
        this.mesh = new THREE.Mesh(new THREE.BoxGeometry(this.nodeSize, this.nodeSize, 1 + this.nodeLevel * 20), new THREE.MeshPhysicalMaterial({wireframe:true}));
        this.mesh.position.set(this.nodePosition.x, this.nodePosition.y, this.nodePosition.z);
        this.mesh.position.z += 50;

        this.foliageSystem.scene.add(this.mesh);
    }

    destroy() {
        this.foliageSystem.scene.remove(this.mesh);
    }

    getDesiredNodeLevel() {
        // Height correction
        this.cameraGroundLocation.x = this.foliageSystem.camera.position.x;
        this.cameraGroundLocation.y = this.foliageSystem.camera.position.y;
        this.cameraGroundLocation.z = this.foliageSystem.camera.position.z - this.foliageSystem.heightGenerator.getHeightAtLocation(this.cameraGroundLocation.x, this.cameraGroundLocation.y);
        let Level = 3 - Math.min(3, (this.cameraGroundLocation.distanceTo(this.nodePosition) - this.nodeSize)  / 500.0);
        return Math.trunc(Level);
    }
}