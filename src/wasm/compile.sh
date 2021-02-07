emcc -O0 -s WASM=1 -s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap"]' -o bin/tfsWasm.js src/tfsWasm.cpp -s ASSERTIONS=1 -s BUILD_AS_WORKER=1

echo DONE !
read a