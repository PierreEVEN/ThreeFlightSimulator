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

let HEAP8, HEAPU8;

function _emscripten_memcpy_big(dest, src, num) {
    HEAPU8.copyWithin(dest, src, src + num)
}

function UTF8ArrayToString(heap, idx, maxBytesToRead) {
    var endIdx = idx + maxBytesToRead;
    var endPtr = idx;
    while (heap[endPtr] && !(endPtr >= endIdx)) ++endPtr;
    if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
        return UTF8Decoder.decode(heap.subarray(idx, endPtr))
    } else {
        var str = "";
        while (idx < endPtr) {
            var u0 = heap[idx++];
            if (!(u0 & 128)) {
                str += String.fromCharCode(u0);
                continue
            }
            var u1 = heap[idx++] & 63;
            if ((u0 & 224) == 192) {
                str += String.fromCharCode((u0 & 31) << 6 | u1);
                continue
            }
            var u2 = heap[idx++] & 63;
            if ((u0 & 240) == 224) {
                u0 = (u0 & 15) << 12 | u1 << 6 | u2
            } else {
                if ((u0 & 248) != 240) warnOnce("Invalid UTF-8 leading byte 0x" + u0.toString(16) + " encountered when deserializing a UTF-8 string on the asm.js/wasm heap to a JS string!");
                u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heap[idx++] & 63
            }
            if (u0 < 65536) {
                str += String.fromCharCode(u0)
            } else {
                var ch = u0 - 65536;
                str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
            }
        }
    }
    return str
}
function UTF8ToString(ptr, maxBytesToRead) {
    return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""
}
function _emscripten_run_script(ptr) {
    eval(UTF8ToString(ptr))
}

function updateGlobalBufferAndViews(buf) {
    //buffer = buf;
    HEAP8 = new Int8Array(buf);
    //HEAP16 = new Int16Array(buf);
    //HEAP32 = new Int32Array(buf);
    HEAPU8 = new Uint8Array(buf);
    //HEAPU16 = new Uint16Array(buf);
    //HEAPU32 = new Uint32Array(buf);
    //HEAPF32 = new Float32Array(buf);
    //HEAPF64 = new Float64Array(buf)
}

// Handle incoming messages
self.addEventListener('message', function(event) {

    const { eventType, eventData, eventId } = event.data;

    if (eventType === "INITIALISE") {

        let memory = new WebAssembly.Memory({initial: 256});
        let imports = {
            env: {
                memoryBase: 0,
                tableBase: 0,
                memory: memory,
                table: new WebAssembly.Table({initial: 256, element: 'anyfunc'}),
                emscripten_resize_heap: _emscripten_resize_heap,
                setTempRet0: _setTempRet0,
                abort: function () { console.log('abort'); },
                emscripten_run_script: _emscripten_run_script,
                emscripten_memcpy_big: _emscripten_memcpy_big,
            },
        };

        updateGlobalBufferAndViews(memory.buffer);

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
