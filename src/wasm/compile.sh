emcc -O3 -s WASM=1 -s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap"]' -s EXPORTED_FUNCTIONS="['_free', '_malloc', '_getAltitudeAtLocation', '_init', '_applyMatrixData', '_A', '_B', '_C', '_D']" -o bin/tfsWasm.js src/tfsWasm.cpp -s ASSERTIONS=1

echo DONE !
read a