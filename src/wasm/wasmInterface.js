export {addCommand, commandsInProcess, commandPool}

const MaxCommandInProcess = 10;

const callReferences = {};
let commandPool = [];
let commandsInProcess = 0;

let callbackPtr = Module.addFunction((id, Data, Size) => {

    if (!callReferences[id]) {
        console.log("failed to find call with id : " + id);
        return;
    }

    callReferences[id].validate({Data: Data, Size: Size, context:callReferences[id].context});
    delete callReferences[id];
    commandsInProcess--;
    triggerCommandPool();
}, 'viii');

Module.cwrap("Init", 'void', ['string', 'number'])("./src/wasm/bin/tfsWasmWorker.js", callbackPtr);

function executeCommand(command) {
    commandsInProcess++;
    let id = Module.ccall(command.funcName, 'number', command.types, command.params);
    callReferences[id] = command.call;
}

function triggerCommandPool() {
    if (!commandPool.length) return;

    while (commandsInProcess < MaxCommandInProcess) {
        // Get command with the highest priority
        let MaxPriority = undefined;
        let MaxPriorityID = undefined;
        let MaxPriorityCommand = undefined
        for (let i = commandPool.length - 1; i >= 0; --i) {
            if (!MaxPriority || commandPool[i].priority > MaxPriority) {
                MaxPriorityCommand = commandPool[i];
                MaxPriority = MaxPriorityCommand.priority;
                MaxPriorityID = i;
            }
        }
        if (!MaxPriorityCommand) { return; }
        executeCommand(MaxPriorityCommand);
        commandPool.splice(MaxPriorityID, 1);
    }
}

function addCommand(priority, funcName, types, params, context) {
    return new Promise(function (resolve, reject) {

        commandPool.push({
            priority: priority,
            funcName: funcName,
            types: types,
            params: params,
            context: context,
            call: {
                validate: resolve,
                failed: reject,
                context: context,
            }
        });
        triggerCommandPool();
    });
}