import {releaseRenderer} from "../Main.js";

const background = document.getElementById('interface-container');

let interfaceBackground, menuBar, contentPage;

function buildContainers() {
    background.innerHTML = "";

    interfaceBackground = document.createElement("div");

    const menuBarContainer = document.createElement("div");
    const menuBarTitle = document.createElement("p");
    menuBarTitle.innerText = "THREE FLIGHT SIMULATOR";

    menuBar = document.createElement("div");
    contentPage = document.createElement("div");

    menuBarContainer.appendChild(menuBarTitle);
    menuBarContainer.appendChild(menuBar);
    interfaceBackground.appendChild(menuBarContainer);
    interfaceBackground.appendChild(contentPage);
}

function showMenu(desiredContent) {
    background.appendChild(interfaceBackground);
    contentPage.innerHTML = "";
    if (desiredContent) contentPage.appendChild(desiredContent);
}

function hideMenu() {
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

function home() {}

function play() {
    hideMenu();
    releaseRenderer();
}

function graphics() {}

function keybinds() {}

buildContainers();
fillMenuBar();
home();

/* display menu */
//showMenu(null);