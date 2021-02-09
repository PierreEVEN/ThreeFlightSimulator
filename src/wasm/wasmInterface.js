export {runCommand}

const callReferences = {};

let callbackPtr = Module.addFunction((id, Data, Size) => {
    if (!callReferences[id]) {
        console.log("failed to find call with id : " + id);
        return;
    }

    callReferences[id].validate({Data: Data, Size: Size, context:callReferences[id].context});
    delete callReferences[id];
}, 'viii');

Module.cwrap("Init", 'void', ['string', 'number'])("./src/wasm/bin/tfsWasmWorker.js", callbackPtr);

function runCommand(funcName, types, params, context) {
    return new Promise(function (resolve, reject) {
        let id = Module.ccall(funcName, 'number', types, params);
        callReferences[id] = {
            validate: resolve,
            failed: reject,
            context: context,
        }
    });
}