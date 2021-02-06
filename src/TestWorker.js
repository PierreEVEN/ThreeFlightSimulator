// worker.js

// Polyfill instantiateStreaming for browsers missing it
if (!WebAssembly.instantiateStreaming) {
    WebAssembly.instantiateStreaming = async (resp, importObject) => {
        const source = await (await resp).arrayBuffer();
        return await WebAssembly.instantiate(source, importObject);
    };
}

// Create promise to handle Worker calls whilst
// module is still initialising
let wasmResolve;
let wasmReady = new Promise((resolve) => {
    wasmResolve = resolve;
})

function _setTempRet0($i) {
    setTempRet0($i | 0)
}

function abortOnCannotGrowMemory(requestedSize) {
    abort("Cannot enlarge memory arrays to size " + requestedSize + " bytes (OOM). Either (1) compile with  -s INITIAL_MEMORY=X  with X higher than the current value " + HEAP8.length + ", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ")
}
function _emscripten_resize_heap(requestedSize) {
    requestedSize = requestedSize >>> 0;
    abortOnCannotGrowMemory(requestedSize)
}

// Handle incoming messages
self.addEventListener('message', function(event) {

    const { eventType, eventData, eventId } = event.data;

    if (eventType === "INITIALISE") {

        let imports = {};
        imports.env = {
            'memoryBase': 0,
                'tableBase': 0,
                'memory': new WebAssembly.Memory({initial: 256}),
                'table': new WebAssembly.Table({initial: 256, element: 'anyfunc'}),
                'emscripten_resize_heap': _emscripten_resize_heap,
                'setTempRet0': _setTempRet0
        }


        WebAssembly.instantiateStreaming(fetch(eventData), imports)
            .then(instantiatedModule => {
                const wasmExports = instantiatedModule.instance.exports;

                // Resolve our exports for when the messages
                // to execute functions come through
                wasmResolve(wasmExports);

                // Send back initialised message to main thread
                self.postMessage({
                    eventType: "INITIALISED",
                    eventData: Object.keys(wasmExports)
                });

            });
    } else if (eventType === "CALL") {
        wasmReady
            .then((wasmInstance) => {
                const method = wasmInstance[eventData.method];
                const result = method.apply(null, eventData.arguments);
                self.postMessage({
                    eventType: "RESULT",
                    eventData: result,
                    eventId: eventId
                });
            })
            .catch((error) => {
                self.postMessage({
                    eventType: "ERROR",
                    eventData: "An error occured executing WASM instance function: " + error.toString(),
                    eventId: eventId
                });
            })
    }

}, false);
