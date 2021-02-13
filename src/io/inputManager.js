export {keybinds, initializeInputs, updateInputs, addKeyInput, addGamepadAxisInput, addMouseAxisInput, addMouseButtonInput, getInputValue, getKeybindValue, addInputPressAction, addInputReleaseAction, isPressed, enableMouseCapture, disableMouseCapture}



let domElement;
const gamepads = [];
const keybinds = {};
const pressedKeyStates = {};
const mouseButtonStates = {};
const mouseAxisStates = {
    posX: 0, lastPosX: 0, deltaX:0,
    posY: 0, lastPosY: 0, deltaY:0,
    wheel: 0, lastWheel: 0, deltaWheel: 0
};

function initializeInputs(dom) {

    if ( dom === undefined ) {
        console.warn( 'THREE.FlyControls: The second parameter "domElement" is now mandatory.' );
        dom = document;
    }
    domElement = dom;
    if ( domElement ) domElement.setAttribute( 'tabindex', - 1 );

}

function enableMouseCapture() {
    domElement.addEventListener('click', function () {
        domElement.requestPointerLock();
    });
}
function disableMouseCapture() {
    domElement.removeEventListener('click');
}

function updateInputs() {

    mouseAxisStates.deltaX = mouseAxisStates.posX - mouseAxisStates.lastPosX;
    mouseAxisStates.deltaY = mouseAxisStates.posY - mouseAxisStates.lastPosY;
    mouseAxisStates.deltaWheel = mouseAxisStates.wheel - mouseAxisStates.lastWheel;

    mouseAxisStates.lastPosX = mouseAxisStates.posX;
    mouseAxisStates.lastPosY = mouseAxisStates.posY;
    mouseAxisStates.lastWheel = mouseAxisStates.wheel;

    for (const [key, value] of Object.entries(keybinds)) {
        updateInputValue(value);
    }
}


function registerInput(inputID) {
    if (!keybinds[inputID]) keybinds[inputID] = {
        inputs: [],
        defaults: [],
        value: 0,
        pressedEvents: [],
        releasedEvents: [],
        pressed: false,
    }


}


function addKeyInput(inputId, key, pressedValue, releasedValue) {
    registerInput(inputId);
    keybinds[inputId].inputs.push({
        key: key,
        pressedValue: pressedValue,
        releasedValue: releasedValue,
    });
}

function addMouseButtonInput(inputId, button, pressedValue, releasedValue) {
    registerInput(inputId);
    keybinds[inputId].inputs.push({
        mouseButton: button,
        pressedValue: pressedValue,
        releasedValue: releasedValue,
    });
}

function addMouseAxisInput(inputId, axis, multiplier) {
    registerInput(inputId);
    keybinds[inputId].inputs.push({
        mouseAxis: axis,
        multiplier: multiplier,
    });
}

function addGamepadAxisInput(inputId, gamepad, axis, multiplier, add) {
    registerInput(inputId);
    keybinds[inputId].inputs.push({
        gamepad: gamepad,
        gamepadAxis: axis,
        multiplier: multiplier,
    });
}

function getKeybindValue(inputId) {
    return keybinds[inputId].value;
}

function addInputPressAction(inputId, action) { keybinds[inputId].pressedEvents.push(action); }

function addInputReleaseAction(inputId, action) { keybinds[inputId].releasedEvents.push(action); }

function updateInputValue(keybind) {
    let value = 0;

    for (const input of keybind.inputs) {
        if (input.key) value += pressedKeyStates[input.key] ? input.pressedValue : input.releasedValue;
        if (input.mouseButton) value += mouseButtonStates[input.mouseButton] ? input.pressedValue : input.releasedValue;
        if (input.mouseAxis) {
            switch (input.mouseAxis) {
                case 1:
                    value += mouseAxisStates.deltaX * input.multiplier;
                    break;
                case 2:
                    value += mouseAxisStates.deltaY * input.multiplier;
                    break;
                case 3:
                    value += mouseAxisStates.deltaWheel * input.multiplier;
                    break;
            }
        }
        if (input.gamepad) {
            for (let gamepad of gamepads) {
                if (gamepad.gamepad.id === input.gamepad) {
                    if (input.gamepadAxis < gamepad.gamepad.axes.length && input.gamepadAxis >= 0)
                        value += gamepad.gamepad.axes[input.gamepadAxis] * input.multiplier;
                }
            }
        }
    }

    if (value > 0.5 && !keybind.pressed) {
        for (const event of keybind.pressedEvents) event();
        keybind.pressed = true;
    }
    else if (value <= 0 && keybind.pressed) {
        for (const event of keybind.releasedEvents) event();
        keybind.pressed = false;
    }

    keybind.value = value;
}



function getInputValue(inputId) {
    return keybinds[inputId].value;
}

function isPressed(inputId) {
    return keybinds[inputId].pressed;
}








function addGamepad(gamepad) {
    gamepads.push(gamepad);
    console.log('added controller "' + gamepad.gamepad.id + '"');
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
    mouseAxisStates.posX += event.movementX;
    mouseAxisStates.posY += event.movementY;
}

function mouseWheel(event) {
    mouseAxisStates.wheel += event.deltaY;
}

document.addEventListener('pointerlockchange', function() {
    if (document.pointerLockElement === domElement) {
        document.addEventListener( 'contextmenu', contextmenu );
        document.addEventListener( 'mousemove', mousemove );
        document.addEventListener( 'wheel', mouseWheel );
    }
    else {
        document.removeEventListener( 'contextmenu', contextmenu );
        document.removeEventListener( 'mousemove', mousemove );
        document.removeEventListener( 'wheel', mouseWheel );
    }
});
window.addEventListener( 'keydown', (event) => pressedKeyStates[event.code] = true);
window.addEventListener( 'keyup', (event) => pressedKeyStates[event.code] = false);
window.addEventListener("gamepadconnected", addGamepad);
window.addEventListener("gamepaddisconnected", removeGamepad);
