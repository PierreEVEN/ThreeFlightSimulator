export {FoliageSystem}

import * as THREE from '../threejs/build/three.module.js';
import {RESOURCE_MANAGER} from './resourceManager.js';
import {WASM_INSTANCE} from './TFSWorkerInterface.js';


let meshGroups = [];
let instCount = 0;
const sectionRange = 3;



Module.cwrap('init')();

let currentBuildCommand = 0;
let commands = {};

class FoliageType {
    constructor() {

        this.minLOD = 0;
        this.maxLOD = 0;
        let test = 0.02;
        this.scale = new THREE.Vector3(test, test, test);

        this.density = 1;

        meshGroups.push({
            geometry: new THREE.PlaneGeometry(10, 10),//child.geometry,
            material: RESOURCE_MANAGER.TreeImpostor.material
        });
    }


    generateAsync(section, heightGenerator, nodeLevel, position, size) {
        const buildCommandID = currentBuildCommand++;

        if (this.minLOD > nodeLevel || this.maxLOD < nodeLevel) return [];


        const treeCount = this.density * this.density;
        commands[buildCommandID] = {
            memory: null,
            section: section,
            treeCount: treeCount
        };

        if (WASM_INSTANCE) {

            let memory = {
                isMemory: true,
                size: treeCount * 64
            }

            WASM_INSTANCE.applyMatrixData(buildCommandID, memory, this.density, position.x, position.y, size).then((commandID) => {

                let meshs = [];
                /* retrieve command */
                const command = commands[commandID];
                if (!command) return;
                commands[commandID] = undefined;

                /* copy result memory */
                let dataView = new Float32Array(Module.HEAP8.buffer, command.memory, command.treeCount * 16);
                const data = new Float32Array(dataView);

                for (let group of meshGroups) {
                    /* generate meshes and assign matrices */
                    let mesh = new THREE.InstancedMesh(group.geometry, group.material, treeCount);
                    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
                    mesh.instanceMatrix.array = data;
                    console.log(data)
                    meshs.push(mesh);
                }

                command.section.postBuild(meshs);

            }).catch((error) => {
                console.log('error : ' + error);
            })
        }

        return buildCommandID;
    }
    /*
    generate(heightGenerator, nodeLevel, position, size) {
        let meshs = [];

        if (this.minLOD > nodeLevel || this.maxLOD < nodeLevel) return [];

        const treeCount = this.density * this.density;
        let memory = Module._malloc(treeCount * 64);

        Module.cwrap('applyMatrixData', 'number', ['number', 'number', 'number', 'number', 'number', 'number'])(0, memory, this.density, position.x, position.y, size);

        let dataView = new Float32Array(Module.HEAP8.buffer, memory, treeCount * 16);
        const data = new Float32Array(dataView);

        for (let group of meshGroups) {
            let mesh = new THREE.InstancedMesh(group.geometry, group.material, treeCount);
            mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
            mesh.setMatrixAt(0, new THREE.Matrix4().identity());
            mesh.instanceMatrix.array = data;
            meshs.push(mesh);
        }
        Module._free(memory);

        return meshs;
    }

     */
}


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
            foliage.generateAsync(this, this.foliageSystem.heightGenerator, this.nodeLevel, this.nodePosition, this.nodeSize);
        }
    }

    postBuild(generatedFoliages) {
        this.foliages = this.foliages.concat(generatedFoliages);

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