import {runCommand} from "./wasm/wasmInterface.js";

export {FoliageSystem}

import * as THREE from '../threejs/build/three.module.js';
import {RESOURCE_MANAGER} from './resourceManager.js';


const meshGroups = [];
const sectionRange = 3;


class FoliageType {
    constructor() {

        this.minLOD = 0;
        this.maxLOD = 2;
        let test = 0.02;
        this.scale = new THREE.Vector3(test, test, test);

        this.density = 100;

        meshGroups.push({
            geometry: new THREE.PlaneGeometry(15, 15),//child.geometry,
            material: RESOURCE_MANAGER.TreeImpostor.material
        });
    }


    generateAsync(section, heightGenerator, nodeLevel, position, size) {
        return new Promise((resolve, abort) => {
            if (this.minLOD > nodeLevel || this.maxLOD < nodeLevel) return [];

            runCommand("BuildFoliage",['number', 'number', 'number', 'number'], [this.density, position.x, position.y, size], section).then( (data) => {

                if (data.context.cancelled) return [];

                let dataView = new Float32Array(Module.HEAP8.buffer, data.Data, data.Size / 4);
                const array = new Float32Array(dataView);

                let meshes = [];

                for (let group of meshGroups) {
                    let mesh = new THREE.InstancedMesh(group.geometry, group.material, data.Size / 64);
                    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
                    mesh.instanceMatrix.array = array;
                    meshes.push(mesh);
                }

                resolve(meshes);
            });
        })

    }
}


class FoliageSystem {

    constructor(scene, heightGenerator, foliageTypes, camera) {
        this.scene = scene;
        this.camera = camera;
        this.heightGenerator = heightGenerator;
        this.foliageTypes = [new FoliageType()];

        this.sectionSize = 6000;

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
        this.cancelled = false;
        if (this.generated) return;
        this.generated = true;



        this.foliages = [];
        for (let foliage of this.foliageSystem.foliageTypes) {
            foliage.generateAsync(this, this.foliageSystem.heightGenerator, this.nodeLevel, this.nodePosition, this.nodeSize).then((data) => {

                this.foliages = this.foliages.concat(data);

                for (let foliage of this.foliages) {
                    this.foliageSystem.scene.add(foliage);
                }
            });
        }
    }



    destroy() {
        this.cancelled = true;
        for (let child of this.childs) {
            child.destroy();
        }

        for (let foliage of this.foliages) {
            this.foliageSystem.scene.remove(foliage);
        }
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