export {RESOURCE_MANAGER};
import {GLTFLoader} from "../threejs/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from '../threejs/build/three.module.js';

const meshLoader = new GLTFLoader();
const fileLoader = new THREE.FileLoader();
const textureLoader = new THREE.TextureLoader();

function LoadFile(target, resourcePath, propertyName) {
    target.pendingLoadResources++;
    fileLoader.load(resourcePath, function (textData) {
        target[propertyName] = textData;
        //console.log('loaded file : ' + propertyName);
        target.pendingLoadResources--;
    });
}

function LoadTexture(target, resourcePath, propertyName) {
    target.pendingLoadResources++;
    textureLoader.load(resourcePath, function (textureData) {
        textureData.wrapS = THREE.RepeatWrapping;
        textureData.wrapT = THREE.RepeatWrapping;
        target[propertyName] = textureData;
        //console.log('loaded texture : ' + propertyName);
        target.pendingLoadResources--;
    });
}

function LoadMesh(target, resourcePath, propertyName) {
    target.pendingLoadResources++;
    meshLoader.load(resourcePath, function (gltfData) {
        target[propertyName] = gltfData;
        //console.log('loaded mesh : ' + propertyName);
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