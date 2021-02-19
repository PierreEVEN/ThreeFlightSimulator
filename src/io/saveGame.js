export {SAVEGAME}

function setCookie(name, value) {
    document.cookie = `${name}=${value};Secure;expires=2147483647`;
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

class SaveGame {
    constructor() {
        this.saveEvents = [];
    }

    getOption(optionName) {
        return getCookie(`option_${optionName}`);
    }

    saveOption(optionName, value) {
        setCookie(`option_${optionName}`, value);
    }

    addSaveEvent(event) {
        this.saveEvents.push(event);
    }
}

window.onbeforeunload = function (event) {
    for (const event of SAVEGAME.saveEvents) {
        event(SAVEGAME);
    }
}

const SAVEGAME = new SaveGame();
