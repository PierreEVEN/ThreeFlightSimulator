
options = -O0 -s WASM=1 -s ASSERTIONS=1 -s EXTRA_EXPORTED_RUNTIME_METHODS='["cwrap", "ccall", "addFunction", "removeFunction"]' -s ALLOW_MEMORY_GROWTH=1 -s ALLOW_TABLE_GROWTH=1
cxx = emcc
output = bin
global_sources = src/thirdParty/emscriptenInterface.cpp src/generators/heightGenerator.cpp

all: echoBuildAll create_dirs echoBuildWorker tfsWasmWorker.js echoBuildInterface tfsWasmInterface.js  echoBuildComplete

echoBuildAll:
	@echo building all

echoBuildWorker:
	@echo building worker ... 

echoBuildInterface:
	@echo building interface ... 

echoBuildComplete:
	@echo Done !
	
create_dirs:
	@[ -d bin ] || mkdir bin

tfsWasmWorker.js: $(global_sources) src/tfsWasmWorker.cpp
	@$(cxx) $(options) -s BUILD_AS_WORKER=1 -o $(output)/$@ $?

tfsWasmInterface.js: $(global_sources) src/tfsWasmInterface.cpp
	@$(cxx) $(options) -o $(output)/$@ $?

