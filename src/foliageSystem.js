import {GLTFLoader} from "../threejs/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from '../threejs/build/three.module.js';

const gltfLoader = new GLTFLoader();

class FoliageSystem {

    constructor(scene, heightGenerator) {
//WIP :: load tree instances :: TEST
        gltfLoader.load('./models/tree.glb', function (gltf) {

            const matrix = new THREE.Matrix4();
            gltf.scene.traverse(function(child) {
                if (child.isMesh) {
                    let spacing = 40;
                    let width = 50;
                    let scale = 0.025;
                    let test = new THREE.InstancedMesh(child.geometry, child.material, width * width);
                    test.instanceMatrix.setUsage(THREE.StaticDrawUsage);

                    for (let x = 0; x < width; ++x) {
                        for (let y = 0; y < width; ++y) {

                            let posX = x * spacing + Math.random() * spacing - spacing / 2 - width * spacing / 2;
                            let posY = y * spacing + Math.random() * spacing - spacing / 2 - width * spacing / 2;
                            let posZ = heightGenerator.getHeightAtLocation(posX, posY);
                            if (posZ < 30 || posZ > 250) continue;

                            matrix.makeRotationFromEuler(new THREE.Euler(Math.PI / 2, Math.random() * 100, 0));
                            matrix.scale(new THREE.Vector3(scale,scale,scale));
                            matrix.setPosition(posX, posY, posZ);
                            test.setMatrixAt(x + y * width, matrix);
                        }
                    }

                    scene.add(test);

                }
            });

        });
    }


}

export {FoliageSystem}