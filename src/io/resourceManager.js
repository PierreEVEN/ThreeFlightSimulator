export {RESOURCE_MANAGER};
import {GLTFLoader} from "../../threejs/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from '../../threejs/build/three.module.js';

const meshLoader = new GLTFLoader();
const fileLoader = new THREE.FileLoader();
const textureLoader = new THREE.TextureLoader();

function LoadFile(target, resourcePath, propertyName) {
    target.pendingLoadResources++;
    fileLoader.load(resourcePath, function (textData) {
        target[propertyName] = textData;
        target.pendingLoadResources--;
    });
}

function LoadTexture(target, resourcePath, propertyName) {
    target.pendingLoadResources++;
    const texture = textureLoader.load(resourcePath, function (textureData) {
        target[propertyName] = textureData;
        target.pendingLoadResources--;
    });
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
}

function LoadMesh(target, resourcePath, propertyName) {
    target.pendingLoadResources++;
    meshLoader.load(resourcePath, function (gltfData) {
        target[propertyName] = gltfData;
        target.pendingLoadResources--;
    });
}

class ResourceManager {
    constructor() {
        this.pendingLoadResources = 0;
    }

    loadFileResource(resourcePath, propertyName) {
        LoadFile(this, resourcePath, propertyName);
    }
    loadTextureResource(resourcePath, propertyName) {
        LoadTexture(this, resourcePath, propertyName);
    }
    loadMeshResource(resourcePath, propertyName) {
        LoadMesh(this, resourcePath, propertyName);
    }

    isLoadingResource() {
        return this.pendingLoadResources !== 0;
    }

};

const RESOURCE_MANAGER = new ResourceManager();