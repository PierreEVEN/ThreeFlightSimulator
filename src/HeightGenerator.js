
import {ImprovedNoise} from "../threejs/examples/jsm/maths/ImprovedNoise.js";

class HeightGenerator {

    constructor() {
        this.Noise = new ImprovedNoise();
    }

    getHeightAtLocation(x, y) {
        return Module.cwrap('getAltitudeAtLocation', 'double', ['double', 'double'])(x, y);
    }

    getBiomeAtLocation(x, y) {
        let scale = .0001;
        return Math.pow(this.Noise.noise(x * scale, y * scale, 0), 5) * 500;
    }
}

export {HeightGenerator}