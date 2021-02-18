import {releaseRenderer} from "../Main.js";
import {graphicsPage} from "./graphics.js";
import {addInputPressAction} from "../io/inputManager.js";

export {showMenu}

const background = document.getElementById('interface-container');

let interfaceBackground, menuBar, contentPage, bShowMenu = false;

function buildContainers() {
    background.innerHTML = "";
    interfaceBackground = document.createElement("div");
    interfaceBackground.id = "interfaceBackground";
    const menuBarContainer = document.createElement("div");
    const menuBarTitle = document.createElement("h1");
    menuBarTitle.innerText = "THREE FLIGHT SIMULATOR";
    menuBarContainer.id = "menuBar";

    menuBar = document.createElement("div");
    menuBar.id = "menubarContainer";
    contentPage = document.createElement("div");

    menuBarContainer.appendChild(menuBarTitle);
    menuBarContainer.appendChild(menuBar);
    interfaceBackground.appendChild(menuBarContainer);
    interfaceBackground.appendChild(contentPage);
}

function showMenu(desiredContent) {
    bShowMenu = true;
    background.appendChild(interfaceBackground);
    background.classList.add("fill");
    document.getElementById("game").classList.add("blurred");
    if (desiredContent) {
        contentPage.innerHTML = "";
        if (desiredContent !== false) contentPage.appendChild(desiredContent);
    }
}

function hideMenu() {
    bShowMenu = false;
    background.classList.remove("fill");
    document.getElementById("game").classList.remove("blurred");
    background.removeChild(interfaceBackground);
}


function addMenuButton(text, onclick) {
    const menuButton = document.createElement("button");
    menuButton.innerText = text;
    menuButton.onclick = onclick;
    menuButton.classList.add("menuButton");
    menuBar.appendChild(menuButton);
}

function fillMenuBar() {
    addMenuButton("HOME", home);
    addMenuButton("PLAY", play);
    addMenuButton("GRAPHICS", graphics);
    addMenuButton("INPUTS", keybinds);
}

function home() {
    showMenu();
}

let hasClickedPlay = true;
function play() {
    hideMenu();
    if (hasClickedPlay) releaseRenderer();
    hasClickedPlay = false;
}

function graphics() {
    showMenu(graphicsPage);
}

function keybinds() {
    showMenu();
}

buildContainers();
fillMenuBar();
home();

/* display menu */
showMenu(null);

addInputPressAction("Main menu", () => {
    if (bShowMenu) hideMenu();
    else showMenu(false);
});

document.addEventListener('pointerlockchange', (event) => {
    if (!document.pointerLockElement) showMenu(false);
}, false);