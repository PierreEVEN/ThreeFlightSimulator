export {displaySettings}
import {buildMenu, mainMenu} from "./mainMenu.js";

function addGraphics() {
    return '<p>graphics</p>' +
        '<form>' +
        '<input type="range" min="0" max="10">' +
        '<input type="number">' +
        '<select>' +
        '<option value="TOTO">toto</option> ' +
        '</select>' +
        '' +
        '</form>';
}


function addAxis(axisName) {

    let axisStr = "";
    for (const axis of getAxisList()) {
        axisStr += '<option value="1">axis' + axis.id + '</option>';
    }


    return '<p>' +axisName +
        '<select>' +
        axisStr +
        '</select>' +
        '<input type="checkbox">' +
        '<input type="number" value="1" step="0.01">' +

        '</p>';
}

function addKeyboard(keyName) {
    return '<p>' + keyName + ' : none </p>';
}

function addControls() {
    return '<p>controls</p>' +
        '<div>' +
            '<p>keyboard</p>' +
            addKeyboard("Roll right") +
            addKeyboard("Roll left") +
            addKeyboard("Pitch up") +
            addKeyboard("Pitch up") +
            addKeyboard("Yaw right") +
            addKeyboard("Yaw left") +
        '</div>' +
        '<div>' +
            '<p>gamepad</p>' +
            addAxis("throttle") +
            addAxis("roll") +
            addAxis("pitch") +
            addAxis("yaw") +
        '</div>' +
        '' +
        '</form>';
}

function getAxisList() {
    return [
        {
            id:0
        },
        {
            id:1
        },
        {
            id:2
        }
    ]
}


function addAudio() {
    return '<p>audio</p>' +
        '' +
        '' +
        '' +
        '';
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
            '<div>' +
                addControls() +
            '</div>' +
        '</div>' +
        '<div class="content-cell">' +
            '<div>' +
                addAudio() +
            '</div>' +
        '</div>'
}