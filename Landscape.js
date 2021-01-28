import {SimplexNoise} from "./node_modules/three/examples/jsm/math/SimplexNoise.js";

export { Landscape }

const CellsPerChunk = 20;
const SectionWidth = 1000;
const ViewDistance = 10;

class Landscape {

    constructor(inScene, inCamera) {
        this.Scene = inScene;
        this.camera = inCamera;
        this.Sections = [];
        this.Noise = new SimplexNoise();

        this.LandscapeMaterial = this.createShaderMaterial();

        for (let x = -ViewDistance; x <= ViewDistance; ++x) {
            for (let y = -ViewDistance; y <= ViewDistance; ++y) {
                this.Sections.push(new LandscapeSection(this, new THREE.Vector3(x * SectionWidth, y * SectionWidth, 0), SectionWidth));
            }
        }
    }

    getHeightAtLocation(x, y) {
        let scale = .01;
        let scale2 = .001;
        let scale3 = .0001;
        return this.Noise.noise(x * scale, y * scale) * 10 +
            Math.pow(this.Noise.noise(x * scale2, y * scale2), 2) * 30 +
            Math.pow(this.Noise.noise(x * scale3, y * scale3), 5) * 500;
    }

    getBiomeAtLocation(x, y) {
        let scale = .0001;
        return Math.pow(this.Noise.noise(x * scale, y * scale), 5) * 500;
    }

    render() {
        for (let section of this.Sections) {
            section.update();
        }
    }

    createShaderMaterial() {
        return new THREE.ShaderMaterial( {
            uniforms: {},
            vertexColors: true,
            vertexShader: document.getElementById( 'LandscapeVertexShaders' ).textContent,
            fragmentShader: document.getElementById( 'LandscapeFragmentShaders' ).textContent
        });
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
        this.destroyGeometry();

        if (this.ChildNodes.length !== 0) return;

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

    unSubdivide() {
        this.buildGeometry();

        if (this.ChildNodes.length === 0) return;

        for (let child of this.ChildNodes) {
            child.destroy();
        }
        this.ChildNodes = [];
    }

    destroyGeometry() {
        if (this.Mesh === null) return;

        this.Landscape.Scene.remove(this.Mesh);
        this.Mesh = null;
    }
    buildGeometry() {
        if (this.Mesh !== null) return;

        const Indices = [];
        const vertices = new Float32Array(((CellsPerChunk + 3) * (CellsPerChunk + 3)) * 3);
        const color = new Float32Array(((CellsPerChunk + 3) * (CellsPerChunk + 3)) * 3);

        let Width = this.Scale;
        let CellSize = Width / CellsPerChunk;

        // Generate vertices
        let VerticesPerChunk = CellsPerChunk + 3;
        for (let x = 0; x < VerticesPerChunk; ++x) {
            for (let y = 0; y < VerticesPerChunk; ++y) {

                let posX = (x - 1) * CellSize + this.Position.x - Width / 2;
                let posY = (y - 1) * CellSize + this.Position.y - Width / 2;

                vertices.set(
                    [posX, posY, this.Landscape.getHeightAtLocation(posX, posY)],
                    (x + y * VerticesPerChunk) * 3
                );
                color.set(
                    [this.Landscape.getBiomeAtLocation(posX, posY), 0, 0],
                    (x + y * VerticesPerChunk) * 3
                );
            }
        }

        // Build faces
        let FaceLength = CellsPerChunk + 2;
        for (let x = 0; x < FaceLength; ++x) {
            for (let y = 0; y < FaceLength; ++y) {
                Indices.push(
                    (x + y * VerticesPerChunk),
                    (x + 1 + y * VerticesPerChunk),
                    (x + 1 + (y + 1) * VerticesPerChunk),

                    (x + y * VerticesPerChunk),
                    (x + 1 + (y + 1) * VerticesPerChunk),
                    (x + (y + 1) * VerticesPerChunk)
                )
            }
        }

        let Geometry = new THREE.BufferGeometry();
        Geometry.setIndex(Indices);
        Geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
        Geometry.setAttribute( 'color', new THREE.BufferAttribute( color, 3 ) );
        Geometry.computeVertexNormals();

        /**
         * Move the "borders of the tablecloth" down to avoid seams holes
         */

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
        this.Landscape.Scene.add(this.Mesh);
    }

    destroy() {
        this.unSubdivide();
        this.destroyGeometry();
    }

    computeDesiredLODLevel() {
        let Level = 5 - Math.min(5, this.Landscape.camera.position.distanceTo(this.Position) / 200.0);
        return Math.trunc(Level);
    }
}