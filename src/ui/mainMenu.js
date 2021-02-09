import {
    getInputValue,
    addKeyInput,
    addMouseAxisInput,
    addInputPressAction,
    addInputReleaseAction
} from "../io/inputManager.js";

export {mainMenu, buildMenu}
import {displaySettings} from "./settings.js";

function buildMenu() {
    document.getElementById('interface-container').innerHTML =
        '<div id="interface"> ' +
            '<img id="background" src="https://www.coved.com/wp-content/uploads/2016/11/orionthemes-placeholder-image-1.png">' +
            '<div id="top-bar"></div>' +
            '<div id="content-page"></div>' +
            '<div id="bottom-bar"></div>' +
        '</div>'

}

function multiplayer() {}

function singleplayer() {
    document.getElementById('interface-container').innerHTML = "";
}


function mainMenu() {
    buildMenu();

    document.getElementById('content-page').innerHTML =
    '<div class="content-cell clickable_content" id="singleplayer">' +
        '<img src="https://www.coved.com/wp-content/uploads/2016/11/orionthemes-placeholder-image-1.png">' +
        '<div class="description">' +
            '<p class="play-button"> singleplayer</p>' +
        '</div>' +
    '</div>' +
    '<div class="content-cell clickable_content" id="multiplayer">' +
        '<img src="https://www.coved.com/wp-content/uploads/2016/11/orionthemes-placeholder-image-1.png">' +
        '<div class="description">' +
            '<p class="play-button"> multiplayer</p>' +
        '</div>' +
    '</div>'

    document.getElementById('top-bar').innerHTML =
        '<img id="settingsButton" src="./textures/icons/settings-icon.png">';


    document.getElementById('singleplayer').onclick = singleplayer;
    document.getElementById('multiplayer').onclick = multiplayer;
    document.getElementById("settingsButton").onclick = displaySettings;
}

mainMenu();

