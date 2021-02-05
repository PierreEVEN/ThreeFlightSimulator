
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

// Handle incoming messages
self.addEventListener('message', function(event) {

    const { eventType, eventData, eventId } = event.data;

    if (eventType === "INITIALISE") {
        WebAssembly.instantiateStreaming(fetch(eventData), {})
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





onmessage = function(e) {


    WebAssembly.instantiateStreaming(fetch('./wasm/bin/tfsWasm.wasm'), {})
    .then(obj => {
        // Call an exported function:
        obj.instance.exports.exported_func();

        // or access the buffer contents of an exported memory:
        var i32 = new Uint32Array(obj.instance.exports.memory.buffer);

        // or access the elements of an exported table:
        var table = obj.instance.exports.table;
        console.log(table.get(0)());
    })


    let Module = e.data[0];
    //let memory = Module._malloc(100);
    //Module._free(memory);


    console.log("receive message");

    console.log("done");

    var workerResult = 'Result: ' + (e.data[1]);
    postMessage(workerResult);
}