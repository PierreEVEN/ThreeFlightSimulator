import {releaseRenderer} from "../Main.js";
import {graphicsPage} from "./graphics.js";
import {addInputPressAction} from "../io/inputManager.js";

const background = document.getElementById('interface-container');

let interfaceBackground, menuBar, contentPage, bShowMenu = false;

function buildContainers() {
    background.innerHTML = "";

    interfaceBackground = document.createElement("div");

    const menuBarContainer = document.createElement("div");
    const menuBarTitle = document.createElement("h1");
    menuBarTitle.innerText = "THREE FLIGHT SIMULATOR";

    menuBar = document.createElement("div");
    contentPage = document.createElement("div");

    menuBarContainer.appendChild(menuBarTitle);
    menuBarContainer.appendChild(menuBar);
    interfaceBackground.appendChild(menuBarContainer);
    interfaceBackground.appendChild(contentPage);
}

function showMenu(desiredContent) {
    bShowMenu = true;
    background.appendChild(interfaceBackground);
    contentPage.innerHTML = "";
    if (desiredContent) contentPage.appendChild(desiredContent);
}

function hideMenu() {
    bShowMenu = false;
    background.removeChild(interfaceBackground);
}


function addMenuButton(text, onclick) {
    const menuButton = document.createElement("button");
    menuButton.innerText = text;
    menuButton.onclick = onclick;
    menuButton.class = "menuButton";
    menuBar.appendChild(menuButton);
}

function fillMenuBar() {
    addMenuButton("home", home);
    addMenuButton("Play", play);
    addMenuButton("Graphics", graphics);
    addMenuButton("keybinds", keybinds);
}

function home() {
    showMenu(null);
}

function play() {
    hideMenu();
    releaseRenderer();
}

function graphics() {
    showMenu(graphicsPage);
}

function keybinds() {
    showMenu(null);
}

buildContainers();
fillMenuBar();
home();

/* display menu */
showMenu(null);

addInputPressAction("Main menu", () => {
    if (bShowMenu) hideMenu(null);
    else showMenu();
});
