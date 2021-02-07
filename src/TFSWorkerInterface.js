export {WASM_INSTANCE}

const MESSAGE_INITIALIZE_WORKER = 0;
const MESSAGE_WORKER_INITIALIZED = 1;
const MESSAGE_EXECUTE = 2;
const MESSAGE_RETURN = 3;
const MESSAGE_FAIL = 4;


function wasmWorker(modulePath) {

    /* Object containing available methods */
    const proxy = {};

    /* Function call references */
    let id = 0;
    const idPromises = {};

    const registerMethod = function(methodName, worker) {
        proxy[methodName] = function () {
            return new Promise((resolve, reject) => {

                worker.postMessage({
                    eventType: MESSAGE_EXECUTE,
                    eventData: {
                        method: methodName,
                        arguments: Array.from(arguments), // arguments is not an array
                        memories: {}
                    },
                    eventId: id
                });

                /* Register call for later resolve */
                idPromises[id] = {resolve, reject};
                id++;
            });
        }
    }

    const receiveWorkerMessage = function(event, worker, resolve) {

        const {eventType, eventData, eventId} = event.data;

        switch (eventType) {
            case MESSAGE_WORKER_INITIALIZED:
                event.data.eventData.forEach((method) => registerMethod(method, worker, idPromises, id));
                resolve(proxy);
                break;
            case MESSAGE_RETURN:
                if (eventId !== undefined && idPromises[eventId]) {
                    idPromises[eventId].resolve(eventData);
                    delete idPromises[eventId];
                }
                break;
            case MESSAGE_FAIL:
                if (eventId !== undefined && idPromises[eventId]) {
                    idPromises[eventId].reject(event.data.eventData);
                    delete idPromises[eventId];
                }
                break;
            default:
                console.log('unhandled message type');
        }
    }



    return new Promise((resolve, reject) => {
        const worker = new Worker('./src/TFSWasmWorker.js');

        /* Initialize wasm instance */
        worker.postMessage({ eventType: MESSAGE_INITIALIZE_WORKER, eventData: modulePath });

        /* Handle messages received from the worker */
        worker.addEventListener('message', (event) => receiveWorkerMessage(event, worker, resolve));

        /* Handle errors */
        worker.addEventListener('error', (error) => reject(error));
    })

}

/* default worker instance (automatically loaded) */
let WASM_INSTANCE = undefined;

/* create default worker */
wasmWorker("./wasm/bin/tfsWasm.wasm").then((wasmProxyInstance) => {
    wasmProxyInstance.init();
    WASM_INSTANCE = wasmProxyInstance;
});
