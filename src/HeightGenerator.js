
import {ImprovedNoise} from "../threejs/examples/jsm/maths/ImprovedNoise.js";

class HeightGenerator {

    constructor() {
        this.Noise = new ImprovedNoise();
    }

    getHeightAtLocation(x, y) {
        let scale = .01;
        let scale2 = .001;
        let scale3 = .0003;
        return this.Noise.noise(x * scale, y * scale, 0) * 10 +
            Math.pow(this.Noise.noise(x * scale2, y * scale2, 0), 2) * 300 +
            Math.pow(this.Noise.noise(x * scale3, y * scale3, 0), 2) * 1000;
    }

    getBiomeAtLocation(x, y) {
        let scale = .0001;
        return Math.pow(this.Noise.noise(x * scale, y * scale, 0), 5) * 500;
    }
}

export {HeightGenerator}