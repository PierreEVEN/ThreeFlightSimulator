import * as THREE from '../threejs/build/three.module.js';
import {Quaternion, Vector3} from "../threejs/build/three.module.js";
import {RESOURCE_MANAGER} from "./resourceManager.js";
import {runCommand} from "./wasm/wasmInterface.js";

export { Landscape }

const CellsPerChunk = 20;
const SectionWidth = 20000;
const ViewDistance = 6;

class Landscape {

    constructor(inScene, inCamera, heightGenerator) {
        this.heightGenerator = heightGenerator;
        this.Scene = inScene;
        this.camera = inCamera;
        this.Sections = [];
        this.time = 0;

        this.LandscapeMaterial = this.createShaderMaterial();

        for (let x = -ViewDistance; x <= ViewDistance; ++x) {
            for (let y = -ViewDistance; y <= ViewDistance; ++y) {
                this.Sections.push(new LandscapeSection(this, new THREE.Vector3(x * SectionWidth, y * SectionWidth, 0), SectionWidth));
            }
        }
        this.render(0);
    }

    render(deltaTime) {
        this.time += deltaTime;
        this.LandscapeMaterial.uniforms.time.value = this.time;

        for (let section of this.Sections) {
            section.update();
        }
    }

    createTexture(path) {
        let texture = new THREE.TextureLoader().load(path);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    createShaderMaterial() {
        let uniforms = {
            time: { value: 0 },
            noise: { type: 't', value: RESOURCE_MANAGER.texture_noise },
            grass1: { type: 't', value: RESOURCE_MANAGER.texture_grass1 },
            grass2: { type: 't', value: RESOURCE_MANAGER.texture_grass2 },
            rock1: { type: 't', value: RESOURCE_MANAGER.texture_rock1 },
            rock2: { type: 't', value: RESOURCE_MANAGER.texture_rock2 },
            snow1: { type: 't', value: RESOURCE_MANAGER.texture_snow1 },
            sand1: { type: 't', value: RESOURCE_MANAGER.texture_sand1 },
            waterDisp: { type: 't', value: RESOURCE_MANAGER.texture_waterDisp },
            waterNorm: { type: 't', value: RESOURCE_MANAGER.texture_waterNorm },
        };

        let material =  new THREE.ShaderMaterial( {
            uniforms: uniforms,
            wireframe:false,
            vertexColors: true,
            vertexShader: RESOURCE_MANAGER.vertexShader_landscape,
            fragmentShader: RESOURCE_MANAGER.fragmentShader_landscape
        });

        material.noise = RESOURCE_MANAGER.texture_noise;
        material.grass1 = RESOURCE_MANAGER.texture_grass1;
        material.grass2 = RESOURCE_MANAGER.texture_grass2;
        material.rock1 = RESOURCE_MANAGER.texture_rock1;
        material.rock2 = RESOURCE_MANAGER.texture_rock2;
        material.snow1 = RESOURCE_MANAGER.texture_snow1;
        material.sand1 = RESOURCE_MANAGER.texture_sand1;
        material.waterDisp = RESOURCE_MANAGER.texture_waterDisp;
        material.waterNorm = RESOURCE_MANAGER.texture_waterNorm;

        return material;
    }
}

class LandscapeSection {

    constructor(inLandscape, inPos, inScale) {
        this.Landscape = inLandscape;
        this.Pos = inPos;
        this.Scale = inScale;
        this.RootNode = new OctreeNode(this.Landscape, 1, this.Pos, this.Scale);
    }

    update() {
        this.RootNode.update();
    }

    /**
     * Destructor
     */
    destroy() {
        this.RootNode.destroy();
        this.RootNode = null;
    }
}

class OctreeNode {

    constructor(inLandscape, inNodeLevel, inPosition, inScale) {
        this.NodeLevel = inNodeLevel;
        this.ChildNodes = [];
        this.Position = inPosition;
        this.Scale = inScale;
        this.Mesh = null;
        this.Landscape = inLandscape;
        this.cameraGroundLocation = new Vector3();
    }

    update() {
        let RequiredNodeLevel = this.computeDesiredLODLevel();
        if (RequiredNodeLevel > this.NodeLevel) {
            this.subdivide();
        }
        else {
            this.unSubdivide();
        }

        for (let child of this.ChildNodes) {
            child.update();
        }
    }

    subdivide() {

        if (this.ChildNodes.length === 0) {

            this.ChildNodes.push(new OctreeNode(
                this.Landscape,
                this.NodeLevel + 1,
                new THREE.Vector3(this.Position.x - this.Scale / 4, this.Position.y - this.Scale / 4, this.Position.z),
                this.Scale / 2)
            );
            this.ChildNodes.push(new OctreeNode(
                this.Landscape,
                this.NodeLevel + 1,
                new THREE.Vector3(this.Position.x + this.Scale / 4, this.Position.y - this.Scale / 4, this.Position.z),
                this.Scale / 2)
            );
            this.ChildNodes.push(new OctreeNode(
                this.Landscape,
                this.NodeLevel + 1,
                new THREE.Vector3(this.Position.x + this.Scale / 4, this.Position.y + this.Scale / 4, this.Position.z),
                this.Scale / 2)
            );
            this.ChildNodes.push(new OctreeNode(
                this.Landscape,
                this.NodeLevel + 1,
                new THREE.Vector3(this.Position.x - this.Scale / 4, this.Position.y + this.Scale / 4, this.Position.z),
                this.Scale / 2)
            );
        }

        let childBuilt = true;
        for (const child of this.ChildNodes) {
            if (!child.Mesh) {
                childBuilt = false;
                return;
            }
        }
        if (childBuilt) {
            this.destroyGeometry();
        }
    }

    unSubdivide() {
        this.buildGeometry();

        if (this.ChildNodes.length === 0) return;

        for (let child of this.ChildNodes) {
            child.destroy();
        }
        this.ChildNodes = [];
    }

    destroyGeometry() {
        if (this.Mesh) {
            this.Landscape.Scene.remove(this.Mesh);
        }
        this.displayed = false;
    }
    buildGeometry() {
        this.cancelled = false;

        if (this.Mesh) {
            if (!this.displayed) {
                this.displayed = true;
                this.Landscape.Scene.add(this.Mesh);
            }
            return;
        }
        if (this.isBuilding) return;
        this.isBuilding = true;

        runCommand("BuildLandscapeSection",['number', 'number', 'number', 'number'], [CellsPerChunk, this.Position.x, this.Position.y, this.Scale], this).then( (data) => {

            this.isBuilding = false;

            const memoryView = new Int32Array(Module.HEAP8.buffer, data.Data, 2)
            const memory = new Int32Array(memoryView);

            const VerticesCount = memory[0];
            const IndiceCount = memory[1];

            const indicesView = new Int32Array(Module.HEAP8.buffer, data.Data + 2 * 4, IndiceCount);
            const indices = new Int32Array(indicesView);
            const verticesView = new Float32Array(Module.HEAP8.buffer, data.Data + (2 + IndiceCount) * 4, VerticesCount);
            const vertices = new Float32Array(verticesView);
            const colorView = new Float32Array(Module.HEAP8.buffer, data.Data + (2 + IndiceCount + VerticesCount) * 4, VerticesCount);
            const color = new Float32Array(colorView);

            let Width = this.Scale;
            let CellSize = Width / CellsPerChunk;

            let Geometry = new THREE.BufferGeometry();
            Geometry.setIndex(Array.from(indices));
            Geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
            Geometry.setAttribute( 'color', new THREE.BufferAttribute( color, 3 ) );
            Geometry.computeVertexNormals();
            /**
             * Move the "borders of the tablecloth" down to avoid seams holes
             */

            let VerticesPerChunk = CellsPerChunk + 3;
            // North seams
            for (let i = 0; i < VerticesPerChunk; ++i) {
                // Align Y to zero
                vertices[i * 3 + 1] += CellSize;
                vertices[i * 3 + 2] -= CellSize;
            }
            // South seams
            const maxSouth = VerticesPerChunk * VerticesPerChunk;
            for (let i = VerticesPerChunk * (VerticesPerChunk - 1); i < maxSouth; ++i) {
                // Align Y to zero
                vertices[i * 3 + 1] -= CellSize;
                vertices[i * 3 + 2] -= CellSize;
            }
            // West seams
            const maxWest = VerticesPerChunk * (VerticesPerChunk);
            for (let i = 0; i < maxWest; i += VerticesPerChunk) {
                // Align Y to zero
                vertices[i * 3] += CellSize;
                vertices[i * 3 + 2] -= CellSize;
            }
            // East seams
            const maxEast = VerticesPerChunk * VerticesPerChunk - 1;
            for (let i = VerticesPerChunk - 1; i < maxEast; i += VerticesPerChunk) {
                // Align Y to zero
                vertices[i * 3] -= CellSize;
                vertices[i * 3 + 2] -= CellSize;
            }

            Geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );

            this.Mesh = new THREE.Mesh(Geometry, this.Landscape.LandscapeMaterial);
        });
    }

    destroy() {
        this.unSubdivide();
        this.destroyGeometry();
    }

    computeDesiredLODLevel() {
        // Height correction
        this.cameraGroundLocation.x = this.Landscape.camera.position.x;
        this.cameraGroundLocation.y = this.Landscape.camera.position.y;
        this.cameraGroundLocation.z = this.Landscape.camera.position.z - this.Landscape.heightGenerator.getHeightAtLocation(this.cameraGroundLocation.x, this.cameraGroundLocation.y);
        let Level = 8 - Math.min(8, (this.cameraGroundLocation.distanceTo(this.Position) - this.Scale)  / 500.0);
        return Math.trunc(Level);
    }
}