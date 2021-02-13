
function getHeightAtLocation(x, y) {
    return Module.cwrap('GetAltitudeAtLocation', 'double', ['double', 'double'])(x, y);
}

export {getHeightAtLocation}