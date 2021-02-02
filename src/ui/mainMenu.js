
class MainMenu {
    constructor() {
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

        document.getElementById('solo-button').onclick = this.play;
        document.getElementById('multiplayer-button').disabled = true;
        document.getElementById('option-button').onclick = this.showServerPage;
        document.getElementById('option-button').onclick = this.showOptions;
        document.getElementById('credits-button').onclick = this.showCredits;
    }

    play() {
        document.getElementById('interface').innerHTML = null;
    }

    showServerPage() {

    }

    showCredits() {

    }


    showOptions() {
        console.log('test');
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

        document.getElementById('graphics-button').onclick = this.graphicsOptions;
        document.getElementById('controls-option').onclick = this.controlsOptions;
        document.getElementById('audio-button').onclick = this.audioOptions;
        document.getElementById('back-button').onclick = this.mainMenu;
        console.log('bind');
    }


    graphicsOptions() {

        console.log('testZzefs');
    }

    controlsOptions() {

    }

    audioOptions() {

    }
}

const mainMenu = new MainMenu();