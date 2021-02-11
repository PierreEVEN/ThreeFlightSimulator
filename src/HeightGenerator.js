
function getHeightAtLocation(x, y) {
    return Module.cwrap('GetAltitudeAtLocation', 'double', ['double', 'double'])(x, y);
}

class HeightGenerator {

    getHeightAtLocation(x, y) {
        return Module.cwrap('GetAltitudeAtLocation', 'double', ['double', 'double'])(x, y);
    }
}

export {HeightGenerator, getHeightAtLocation}