export {init, nextFrame, addKeyInput, addGamepadAxisInput, addMouseAxisInput, addMouseButtonInput, getInputValue, getKeybinds}



let domElement;
const gamepads = [];
const keybinds = [];
const pressedKeyStates = {};
const mouseButtonStates = {};
const mouseAxisStates = { deltaX:0, deltaY:0 }

function init(dom) {

    if ( dom === undefined ) {
        console.warn( 'THREE.FlyControls: The second parameter "domElement" is now mandatory.' );
        dom = document;
    }
}

function nextFrame() {
    if (!mouseAxisStates.posX) mouseAxisStates.posX = 0;
    if (!mouseAxisStates.posY) mouseAxisStates.posY = 0;
    if (!mouseAxisStates.lastPosX) mouseAxisStates.lastPosX = 0;
    if (!mouseAxisStates.lastPosY) mouseAxisStates.lastPosY = 0;

    mouseAxisStates.deltaX = mouseAxisStates.posX - mouseAxisStates.lastPosX;
    mouseAxisStates.deltaY = mouseAxisStates.posY - mouseAxisStates.lastPosY;

    mouseAxisStates.lastPosX = mouseAxisStates.posX;
    mouseAxisStates.lastPosY = mouseAxisStates.posY;
}


function registerInput(inputID) {
    if (!keybinds[inputID]) keybinds[inputID] = {inputs: []}
}


function addKeyInput(inputId, key, pressedValue, releasedValue) {
    registerInput(inputId);
    keybinds[inputId].inputs.add({
        key: key,
        pressedValue: pressedValue,
        releasedValue: releasedValue,
    });
}

function addMouseButtonInput(inputId, button, pressedValue, releasedValue) {
    registerInput(inputId);
    keybinds[inputId].inputs.add({
        mouseButton: button,
        pressedValue: pressedValue,
        releasedValue: releasedValue,
    });
}

function addMouseAxisInput(inputId, axis, multiplier) {
    registerInput(inputId);
    keybinds[inputId].inputs.add({
        mouseAxis: axis,
        multiplier: multiplier,
    });
}

function addGamepadAxisInput(inputId, gamepad, axis, multiplier) {
    registerInput(inputId);
    keybinds[inputId].inputs.add({
        gamepad: gamepad,
        gamepadAxis: axis,
        multiplier: multiplier,
    });
}

function getKeybinds() {
    return keybinds;
}

function getInputValue(keybind) {

    let value = 0;

    for (const input of keybind.inputs) {
        if (input.key) value += pressedKeyStates[input.key] ? input.pressedValue : input.releasedValue;
        if (input.mouseButton) value += mouseButtonStates[input.mouseButton] ? input.pressedValue : input.releasedValue;
        if (input.mouseAxis) {
            switch (input.mouseAxis) {
                case 0:
                    value += mouseAxisStates.deltaX * input.multiplier;
                    break;
                case 1:
                    value += mouseAxisStates.deltaY * input.multiplier;
                    break;
            }
        }
    }


    return value;
}












function addGamepad(gamepad) {
    gamepads.push(gamepad);
    console.log('connected controller ');
}

function removeGamepad(gamepad) {
    for (let i = this.gamepads.length - 1; i >= 0; --i) {
        if (gamepads[i] === gamepad) {
            gamepads.splice(i, 1);
        }
    }
    console.log('disconnected controller');
}

function contextmenu( event ) { event.preventDefault(); }

function mousemove( event ) {
    this.pitch += -event.movementY * this.mouseSensitivity;
    this.yaw += -event.movementX * this.mouseSensitivity;

    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
    if (this.isFPS) this.yaw = Math.max(this.minYaw, Math.min(this.maxYaw, this.yaw + 90)) - 90;
    this.updateMouse();
}


document.addEventListener('pointerlockchange', function() {
    if (document.pointerLockElement === domElement) {
        document.addEventListener( 'contextmenu', contextmenu );
        document.addEventListener( 'mousemove', _mousemove );
        document.addEventListener( 'mousedown', _mousedown );
        document.addEventListener( 'mouseup', _mouseup );
        document.addEventListener( 'wheel', _mouseWheel );
    }
    else {
        document.removeEventListener( 'contextmenu', contextmenu );
        document.removeEventListener( 'mousemove', mousemove );
        document.removeEventListener( 'mousedown', _mousedown );
        document.removeEventListener( 'mouseup', _mouseup );
        document.removeEventListener( 'wheel', _mouseWheel );
    }
});
window.addEventListener( 'keydown', (event) => pressedKeyStates[event.code] = true);
window.addEventListener( 'keyup', (event) => pressedKeyStates[event.code] = false);
window.addEventListener("gamepadconnected", addGamepad)
window.addEventListener("gamepaddisconnected", removeGamepad);
