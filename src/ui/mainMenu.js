
let menuInstance = null;

const myWorker = new Worker("./src/TestWorker.js");

myWorker.onmessage = function(e) {
    console.log('Message received from worker : ' + e.data);
}

function test() {

    console.log('execute');
    myWorker.postMessage([10, 15]);

}


class MainMenu {
    constructor() {
        menuInstance = this;
        this.uiBackground = document.getElementById('interface');

        this.uiBackground.innerHTML = [
            '<div id="menuBar">' +
            '</div>' +
            '<div id="menuBackground">' +

            '</div>'
            ];

        this.mainMenu();
    }

    mainMenu() {
        let menuBackground = document.getElementById('menuBar');

        menuBackground.innerHTML = [
            '<h1>Three flight simulator</h1>' +
            '<div id="menuButtons">' +
                '<button class="game-button" id="solo-button">Nouvelle partie</button>' +
                '<button class="game-button" id="multiplayer-button">Multijoueur</button>' +
                '<button class="game-button" id="option-button">Options</button>' +
                '<button class="game-button" id="credits-button">Credits</button>' +
            '</div>'
        ];

        document.getElementById('solo-button').onclick = menuInstance.play;
        document.getElementById('multiplayer-button').disabled = true;
        document.getElementById('option-button').onclick = menuInstance.showServerPage;
        document.getElementById('option-button').onclick = menuInstance.showOptions;
        document.getElementById('credits-button').onclick = menuInstance.showCredits;
    }

    play() {
        document.getElementById('interface').innerHTML = null;
    }

    showServerPage() {

    }

    showCredits() {
        test();
    }


    showOptions() {
        let menuBackground = document.getElementById('menuBar');

        menuBackground.innerHTML = [
            '<h1>Options</h1>' +
            '<div id="menuButtons">' +
                '<button class="game-button" id="graphics-button">Graphismes</button>' +
                '<button class="game-button" id="controls-option">Controles</button>' +
                '<button class="game-button" id="audio-button">Audio</button>' +
                '<button class="game-button" id="back-button">Retour</button>' +
            '</div>'
        ];

        document.getElementById('graphics-button').onclick = menuInstance.graphicsOptions;
        document.getElementById('controls-option').onclick = menuInstance.controlsOptions;
        document.getElementById('audio-button').onclick = menuInstance.audioOptions;
        document.getElementById('back-button').onclick = menuInstance.mainMenu;
    }


    graphicsOptions() {
    }

    controlsOptions() {

    }

    audioOptions() {

    }
}

const mainMenu = new MainMenu();