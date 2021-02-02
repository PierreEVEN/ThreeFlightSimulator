export {FoliageSystem}

import {GLTFLoader} from "../threejs/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from '../threejs/build/three.module.js';
import {RESOURCE_MANAGER} from './resourceManager.js'

const gltfLoader = new GLTFLoader();


let meshGroups = [];
let instCount = 0;
//let testGaom = new THREE.BoxGeometry(100, 2000, 100);

class FoliageType {
    constructor() {
        this.minLOD = 0;
        this.maxLOD = 2;
        let test = 0.02;
        this.scale = new THREE.Vector3(test, test, test);

        this.density = 20;

        //RESOURCE_MANAGER.model_tree.scene.traverse(function(child) {
         //   if (child.isMesh) {
                meshGroups.push({
                    geometry:new THREE.PlaneGeometry(10, 10),//child.geometry,
                    material:RESOURCE_MANAGER.TreeImpostor.material
                });
        //    }
        //});
    }

    generate(heightGenerator, nodeLevel, position, size) {

        if (this.minLOD > nodeLevel || this.maxLOD < nodeLevel) return [];

        let instances = [];
        let spacing = size / this.density;

        // Generate instances coordinates
        for (let x = 0; x < this.density; ++x) {
            for (let y = 0; y < this.density; ++y) {

                let posX = x * spacing - size / 2 + position.x + Math.random() * spacing;
                let posY = y * spacing - size / 2 + position.y + Math.random() * spacing;
                let posZ = heightGenerator.getHeightAtLocation(posX, posY) + 4;
                if (posZ < 30 || posZ > 250) continue;

                let matrix = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(Math.PI / 2, Math.random() * 100, 0));
                matrix.scale(this.scale);
                matrix.setPosition(posX, posY, posZ);
                instances.push(matrix);
            }
        }
        // generate meshs
        let meshs = [];
        for (let group of meshGroups) {
            let mesh = new THREE.InstancedMesh(group.geometry, group.material, instances.length);
            mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);

            let index = 0;
            for (let instance of instances) {
                mesh.setMatrixAt(index++, instance);
            }
            meshs.push(mesh);
        }
        return meshs;
    }
}


const sectionRange = 3;

class FoliageSystem {

    constructor(scene, heightGenerator, foliageTypes, camera) {
        this.scene = scene;
        this.camera = camera;
        this.heightGenerator = heightGenerator;
        this.foliageTypes = [new FoliageType()];

        this.sectionSize = 4000;

        this.sections = [];
    }

    update() {
        let cameraX = Math.trunc(this.camera.position.x / this.sectionSize);
        let cameraY = Math.trunc(this.camera.position.y / this.sectionSize);
        for (let i = this.sections.length - 1; i >= 0; --i) {
            if (
                this.sections[i].posX < cameraX - sectionRange ||
                this.sections[i].posX > cameraX + sectionRange ||
                this.sections[i].posY < cameraY - sectionRange ||
                this.sections[i].posY > cameraY + sectionRange
            ) {
                this.sections[i].section.destroy();
                this.sections.splice(i, 1);
            }
        }

        for (let x = cameraX - sectionRange; x <= cameraX + sectionRange; ++x) {
            for (let y = cameraY - sectionRange; y <= cameraY + sectionRange; ++y) {
                this.tryLoadSection(x, y);
            }
        }

        for (let section of this.sections) {
            section.section.update();
        }
    }

    tryLoadSection(posX, posY) {
        let exists = false;
        for (let section of this.sections) {
            if (section.posX === posX && section.posY === posY) {
                exists = true;
            }
        }
        if (!exists) {
            this.sections.push({
                posX: posX,
                posY: posY,
                section: new foliageSystemSection(this, new THREE.Vector3(posX * this.sectionSize, posY * this.sectionSize, 0), this.sectionSize)
            });
        }
    }
}

class foliageSystemSection {
    constructor(foliageSystem, position, size) {
        this.foliageSystem = foliageSystem;
        this.rootNode = new foliageSystemNode(this.foliageSystem, 0, position, size);
    }

    update() {
        this.rootNode.update();
    }

    destroy() {
        this.rootNode.destroy();
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

        this.foliages = [];

        for (let foliage of this.foliageSystem.foliageTypes) {
            let foli = foliage.generate(this.foliageSystem.heightGenerator, this.nodeLevel, this.nodePosition, this.nodeSize);
            for (let inst of foli) {
                if (inst.count) {
                    this.instCount = inst.count;
                    instCount += inst.count;
                }
            }
            this.foliages = this.foliages.concat(foli);
        }

        for (let foliage of this.foliages) {
            this.foliageSystem.scene.add(foliage);
        }
    }

    destroy() {
        if (this.instCount) instCount -= this.instCount;
        for (let child of this.childs) {
            child.destroy();
        }

        for (let foliage of this.foliages) {
            this.foliageSystem.scene.remove(foliage);
        }

        //this.foliageSystem.scene.remove(this.mesh);
    }

    getDesiredNodeLevel() {
        // Height correction
        this.cameraGroundLocation.x = this.foliageSystem.camera.position.x;
        this.cameraGroundLocation.y = this.foliageSystem.camera.position.y;
        this.cameraGroundLocation.z = this.foliageSystem.camera.position.z - this.foliageSystem.heightGenerator.getHeightAtLocation(this.cameraGroundLocation.x, this.cameraGroundLocation.y);
        let Level = 3 - Math.min(3, (this.cameraGroundLocation.distanceTo(this.nodePosition) - this.nodeSize * 2)  / 200.0);
        return Math.trunc(Level);
    }
}