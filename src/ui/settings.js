import {keybinds} from "../io/inputManager.js";

export {displaySettings}
import {buildMenu, mainMenu} from "./mainMenu.js";

function addGraphics() {
    return '';
}

function addAudio() {
    return '';
}

function addKeyInput(input) {
    return '<div class="control-type">keyboard' +
            '<div class="control-parameters">' +
                '<button>assigned key : ' + input.key + '</button>' +
                '<div class="control-parameters-advanced">' +
                    '<p>pressed</p><input type="range" step="any" min="-2" max="2" value="' + input.pressedValue + '">' +
                    '<input type="number" step="0.01" min="-2" max="2" value="' + input.pressedValue + '">' +
                '</div>' +
                '<div class="control-parameters-advanced">' +
                    '<p>released</p><input type="range" step="any" min="-2" max="2" value="' + input.releasedValue + '">' +
                    '<input type="number" step="0.01" min="-2" max="2" value="' + input.releasedValue + '">' +
                '</div>' +
            '</div>' +
        '</div>';
}

function addMouseAxisInput(input) {
    return '<div class="control-type">mouse axis' +
        '<div class="control-parameters">' +
        '<select>' +
        '<option value="1">Mouse X</option>' +
        '<option value="2">Mouse Y</option>' +
        '<option value="3">Mouse Wheel</option>' +
        '</select>' +
        'multiplier<input type="range" step="0.01" min="-2" max="2" value="' + input.multiplier + '">' +
        '<input type="number" step="0.01" min="-2" max="2" value="' + input.multiplier + '">' +
        '</div>' +
        '</div>';
}

function generateInputContent(input) {

    let text = "";

    text += '<div class="control-buttonActions">'
    text += '<button>Reset</button>'
    text += '<button>Add key</button>'
    text += '<button>Add mouse axis</button>'
    text += '<button>Add mouse button</button>'
    text += '<button>Add controller</button>'
    text += '</div>'

    for (const binding of input.inputs) {
        if (binding.key) {
            text += addKeyInput(binding);
        }
        if (binding.mouseAxis) {
            text += addMouseAxisInput(binding)
        }
    }

    return text;
}

function generateInput(name, binding) {
    return '<button class="control-button id="input_key_' + name + '">' + '<img src="./textures/icons/back-icon.png"><p>' + name + '</p><progress value="0.5"></progress> 0 </button>' +
        '<div class="control-buttonContent">' +
        generateInputContent(binding) +
        '</div>';
}

function update() {
    requestAnimationFrame(update);
}
update();


function addControls() {

    let inputText =
        '<div id="control-bindings">'

    for (const [key, binding] of Object.entries(keybinds)) {
        inputText += generateInput(key, binding);
    }
    inputText +=
        '</div>';

    return inputText;
}


function displaySettings() {
    buildMenu();

    document.getElementById('bottom-bar').innerHTML = '<img id="backButton" src="./textures/icons/back-icon.png">'
    document.getElementById("backButton").onclick = mainMenu;

    document.getElementById('content-page').innerHTML =
        '<div class="content-cell">' +
            '<div>' +
                addGraphics() +
            '</div>' +
        '</div>' +
        '<div class="content-cell">' +
                addControls() +
        '</div>' +
        '<div class="content-cell">' +
            '<div>' +
                addAudio() +
            '</div>' +
        '</div>'
}