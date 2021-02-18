
import * as THREE from '../../threejs/build/three.module.js';

export {createMipMappedTexture}
let test = 0;

function co(imageData, newResolution, channels) {

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
        }
    }
    return dividedData;
}

function improveAlphaColor(texture, resolutionX, resolutionY) {


    for (let x = 0; x < resolutionX; ++x) {
        for (let y = 0; y < resolutionY; ++y) {
            // Only done on transparent pixels
            if (texture[(x + y * resolutionX) * 4 + 3] === 0) {
                // For each channel
                for (let channel = 0; channel < 3; ++channel) {

                    let px = texture[(x + 1 + y * resolutionX) * 4 + channel];
                    let mx = texture[(x - 1 + y * resolutionX) * 4 + channel];
                    let py = texture[(x + (y + 1) * resolutionX) * 4 + channel];
                    let my = texture[(x + (y - 1) * resolutionX) * 4 + channel];

                    let sum = 0;
                    if (mx) sum += 1;
                    if (my) sum += 1;

                    texture[(x + y * resolutionX) * 4 + channel] = (mx +  my ) / sum;
                }
            }
            //texture[(x + y * resolutionX) * 4 + 3] = 255;
        }
    }
}



function createMipMappedTexture(resolution, channels, baseData) {

    improveAlphaColor(baseData, resolution, resolution);




    const texture = new THREE.CanvasTexture(document.createElement("canvas"));


    let lastMipMaps = baseData;
    texture.mipmaps[0] = new ImageData(lastMipMaps, resolution, resolution);
    let mipmap = 1;
    do {
        resolution /= 2;
        test = mipmap;
        const newMip = co(lastMipMaps, resolution, channels);
        texture.mipmaps[mipmap++] = new ImageData(newMip, resolution, resolution);
        lastMipMaps = newMip;
    }
    while (resolution > 1);

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;


    return texture;


    /*
    let imageCanvas = document.createElement( "canvas" ),
        context = imageCanvas.getContext( "2d" );
    imageCanvas.width = resolution;
    imageCanvas.height = resolution;
    let testImData = new ImageData(baseData, resolution, resolution);

    context.putImageData(testImData, 0, 0);
    let imgAsDataURL = imageCanvas.toDataURL("image/png");

    document.getElementById("game").appendChild(imageCanvas);

    // Save image into localStorage
    try {
        localStorage.setItem("elephant", imgAsDataURL);
        console.log("stored");
        let link = document.createElement("a");
        link.setAttribute("href", imgAsDataURL);
        link.setAttribute("download", "test");
        link.click();
    }
    catch (e) {
        console.log("Storage failed: " + e);
    }
     */
}