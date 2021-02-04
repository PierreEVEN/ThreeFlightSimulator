C:/Users/pierre/Documents/WASM/emsdk/upstream/emscripten/emcc -O3 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 -s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap"]' -s EXPORTED_FUNCTIONS="['_free', '_malloc']" -o bin/tfsWasm.js src/tfsWasm.cpp

echo DONE !
read a