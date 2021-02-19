import * as THREE from '../../threejs/build/three.module.js';
import {RESOURCE_MANAGER} from "../io/resourceManager.js";
import {addCommand} from "../wasm/wasmInterface.js";
import {addInputPressAction, addKeyInput} from "../io/inputManager.js";
import {getHeightAtLocation} from "./HeightGenerator.js";
import {OPTION_MANAGER} from "../io/optionManager.js";

export { Landscape }

/*
LANDSCAPE SETTINGS
 */
let ViewDistance = 6; // Section loading range
let CellsPerChunk = 20; // Wireframe resolution
let SectionWidth = 20000; // Section width

/*
CONSTANTS
 */
const cameraGroundLocation = new THREE.Vector3();

addKeyInput('Debug', 'KeyG', 1, 0);

/**
 * Represent a whole landscape system
 * It contains a grid of landscape section automatically loaded in a desired range (=ViewDistance)
 */
class Landscape {

    constructor(inScene, inCamera) {


        ViewDistance = OPTION_MANAGER.options["loading range"].value;
        CellsPerChunk = OPTION_MANAGER.options["landscape quality"].value;

        OPTION_MANAGER.bindOption(this, "loading range" ,(context, value) => {
            ViewDistance = value;
            context.rebuildLandscape();
        });

        OPTION_MANAGER.bindOption(this, "landscape quality" ,(context, value) => {
            CellsPerChunk = value;
            context.rebuildLandscape();
        });

        this.Scene = inScene;
        this.camera = inCamera;
        this.Sections = [];
        this.time = 0;

        this.LandscapeMaterial = this.createShaderMaterial();
        this.Sections = [];
        this.update(0);

    }

    update(deltaTime) {
        if (this.LandscapeMaterial.uniforms) {
            this.time += deltaTime;
            this.LandscapeMaterial.uniforms.time.value = this.time;
        }

        let cameraX = Math.trunc(this.camera.position.x / SectionWidth);
        let cameraY = Math.trunc(this.camera.position.y / SectionWidth);
        for (let i = this.Sections.length - 1; i >= 0; --i) {
            if (
                this.Sections[i].posX < cameraX - ViewDistance ||
                this.Sections[i].posX > cameraX + ViewDistance ||
                this.Sections[i].posY < cameraY - ViewDistance ||
                this.Sections[i].posY > cameraY + ViewDistance
            ) {
                this.Sections[i].section.destroy();
                this.Sections.splice(i, 1);
            }
        }

        for (let x = cameraX - ViewDistance; x <= cameraX + ViewDistance; ++x) {
            for (let y = cameraY - ViewDistance; y <= cameraY + ViewDistance; ++y) {
                this.tryLoadSection(x, y);
            }
        }

        for (let section of this.Sections) {
            section.section.update();
        }
    }

    tryLoadSection(posX, posY) {
        let exists = false;
        for (let section of this.Sections) {
            if (section.posX === posX && section.posY === posY) {
                exists = true;
            }
        }
        if (!exists) {
            this.Sections.push({
                posX: posX,
                posY: posY,
                section: new LandscapeSection(this, new THREE.Vector3(posX * SectionWidth, posY * SectionWidth, 0), SectionWidth),
            });
        }
    }


    rebuildLandscape() {
        for (const section of this.Sections) {
            section.section.destroy();
        }

        this.Sections = [];
    }

    createShaderMaterial() {
        const material = new THREE.MeshPhysicalMaterial();

        material.noise = RESOURCE_MANAGER.texture_noise;
        material.grass1 = RESOURCE_MANAGER.texture_grass1;
        material.grass2 = RESOURCE_MANAGER.texture_grass2;
        material.rock1 = RESOURCE_MANAGER.texture_rock1;
        material.rock2 = RESOURCE_MANAGER.texture_rock2;
        material.snow1 = RESOURCE_MANAGER.texture_snow1;
        material.sand1 = RESOURCE_MANAGER.texture_sand1;
        material.waterDisp = RESOURCE_MANAGER.texture_waterDisp;
        material.waterNorm = RESOURCE_MANAGER.texture_waterNorm;

        material.reflectivity = 0.2;

        material.onBeforeCompile = shader => {
            if (shader.shaderName !== "MeshPhysicalMaterial") return;


            shader.uniforms.time = { value: 0 },
            shader.uniforms.noise = { type: 't', value: RESOURCE_MANAGER.texture_noise },
            shader.uniforms.grass1 = { type: 't', value: RESOURCE_MANAGER.texture_grass1 },
            shader.uniforms.grass2 = { type: 't', value: RESOURCE_MANAGER.texture_grass2 },
            shader.uniforms.rock1 = { type: 't', value: RESOURCE_MANAGER.texture_rock1 },
            shader.uniforms.rock2 = { type: 't', value: RESOURCE_MANAGER.texture_rock2 },
            shader.uniforms.snow1 = { type: 't', value: RESOURCE_MANAGER.texture_snow1 },
            shader.uniforms.sand1= { type: 't', value: RESOURCE_MANAGER.texture_sand1 },
            shader.uniforms.waterDisp = { type: 't', value: RESOURCE_MANAGER.texture_waterDisp },
            shader.uniforms.waterNorm= { type: 't', value: RESOURCE_MANAGER.texture_waterNorm },

            shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                '#include <common>\n' + RESOURCE_MANAGER.vertexShader_landscape_a);

            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                '#include <begin_vertex>\n' + RESOURCE_MANAGER.vertexShader_landscape_b);

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                '#include <common>\n' + RESOURCE_MANAGER.fragmentShader_landscape_a);

            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <color_fragment>',
                '#include <color_fragment>\n' + RESOURCE_MANAGER.fragmentShader_landscape_b);
        }


        addInputPressAction("Wireframe", () => {this.LandscapeMaterial.wireframe = !this.LandscapeMaterial.wireframe});

        return material;
    }
}


/**
 * The landscape is split in multiple landscape sections (= A quadtree of landscape Node)
 */
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


/**
 * A node of the section's octree.
 * Each node can be subdivided in 4 smaller nodes depending on the camera location
 * The node also contains the generated mesh data
 */
class OctreeNode {
    constructor(inLandscape, inNodeLevel, inPosition, inScale) {
        this.NodeLevel = inNodeLevel;
        this.ChildNodes = [];
        this.Position = inPosition;
        this.Scale = inScale;
        this.Mesh = null;
        this.Landscape = inLandscape;

        this.createMesh();
    }

    update() {
        /*
        Either we wants to subdivide this node if he is to close, either we wants to display its mesh section
         */
        if (this.computeDesiredLODLevel() > this.NodeLevel) this.subdivide();
        else this.unSubdivide();

        for (let child of this.ChildNodes) child.update();
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
            this.hideGeometry();
        }
        else {
        }
    }

    unSubdivide() {
        this.showGeometry();

        /*
        Destroy child if not destroyed
         */
        if (this.ChildNodes.length === 0) return;
        for (let child of this.ChildNodes) child.destroy();
        this.ChildNodes = [];
    }

    hideGeometry() {
        if (this.displayed) {
            this.Landscape.Scene.remove(this.Mesh);
            this.displayed = false;
        }
    }
    showGeometry() {
        if (this.Mesh) {
            if (!this.displayed) {
                this.displayed = true;
                this.Landscape.Scene.add(this.Mesh);
            }
        }
    }

    createMesh() {
        addCommand(100, "BuildLandscapeSection",['number', 'number', 'number', 'number'], [CellsPerChunk, this.Position.x, this.Position.y, this.Scale], this).then( (data) => {

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

            // Move the "borders of the tablecloth" down to avoid seams holes

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

            this.Mesh = new THREE.Mesh(Geometry, this.Landscape.LandscapeMaterial);
            this.Mesh.castShadow = true;
            this.Mesh.receiveShadow = true;
        });
    }

    destroy() {
        this.unSubdivide();
        this.hideGeometry();
        if (this.Mesh) delete this.Mesh;
    }

    computeDesiredLODLevel() {
        // Height correction
        cameraGroundLocation.x = this.Landscape.camera.position.x;
        cameraGroundLocation.y = this.Landscape.camera.position.y;
        cameraGroundLocation.z = this.Landscape.camera.position.z - getHeightAtLocation(cameraGroundLocation.x, cameraGroundLocation.y);
        let Level = 8 - Math.min(8, (cameraGroundLocation.distanceTo(this.Position) - this.Scale)  / 500.0);
        return Math.trunc(Level);
    }
}