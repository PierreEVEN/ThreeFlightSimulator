
import * as THREE from '../../threejs/build/three.module.js';

export {createMipMappedTexture}
let test = 0;

function divideImageData(imageData, newResolution, channels) {

    const pixels = newResolution * newResolution;
    let dividedData = new Uint8ClampedArray(pixels * channels);

    for (let x = 0; x < newResolution; ++x) {
        for (let y = 0; y < newResolution; ++y) {
            let newPos = (x + y * newResolution) * channels;

            let lastPos0 = (x * 2 + (y * 2) * newResolution * 2) * channels;
            let lastPos1 = ((x + 1) * 2 + (y * 2) * newResolution * 2) * channels;
            let lastPos2 = ((x + 1) * 2 + ((y + 1) * 2) * newResolution * 2) * channels;
            let lastPos3 = (x * 2 + ((y + 1) * 2) * newResolution * 2) * channels;

            dividedData[newPos] = (imageData[lastPos0] + imageData[lastPos1] + imageData[lastPos2] + imageData[lastPos3]) / 4;
            dividedData[newPos + 1] = (imageData[lastPos0 + 1] + imageData[lastPos1 + 1] + imageData[lastPos2 + 1] + imageData[lastPos3 + 1]) / 4;
            dividedData[newPos + 2] = (imageData[lastPos0 + 2] + imageData[lastPos1 + 2] + imageData[lastPos2 + 2] + imageData[lastPos3 + 2]) / 4;
            dividedData[newPos + 3] = (imageData[lastPos0 + 3] + imageData[lastPos1 + 3] + imageData[lastPos2 + 3] + imageData[lastPos3 + 3]) / 2;
            if (dividedData[newPos + 3] < 0.5) {
                dividedData[newPos] = 70
                dividedData[newPos + 1] = 120
                dividedData[newPos + 2] = 30
            }

        }
    }
    return dividedData;
}


function createMipMappedTexture(resolution, channels, baseData) {

    const texture = new THREE.CanvasTexture(document.createElement("canvas"));

    let lastMipMaps = baseData;
    texture.mipmaps[0] = new ImageData(lastMipMaps, resolution, resolution);
    let mipmap = 1;
    do {
        resolution /= 2;
        test = mipmap;
        const newMip = divideImageData(lastMipMaps, resolution, channels);
        texture.mipmaps[mipmap++] = new ImageData(newMip, resolution, resolution);
        lastMipMaps = newMip;
    }
    while (resolution > 1);

    //texture.minFilter = THREE.NearestMipMapNearestFilter;
    //texture.magFilter = THREE.NearestFilter
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}