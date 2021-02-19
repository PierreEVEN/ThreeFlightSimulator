import {SAVEGAME} from "./saveGame.js";

export {OPTION_MANAGER};

class OptionManager {
    constructor() {
        this.options = {};
    }

    addComboOption(optionName, choices, currentChoice) {
        this.options[optionName] = {
            type: "combo",
            choices: choices,
            currentChoice: SAVEGAME.getOption(optionName) ? SAVEGAME.getOption(optionName) : currentChoice,
            onChanged: []
        }
    }

    addRangeOption(optionName, defaultValue, min, max, step) {
        this.options[optionName] = {
            type: "range",
            value: SAVEGAME.getOption(optionName) ? parseFloat(SAVEGAME.getOption(optionName)) : defaultValue,
            min: min,
            max: max,
            step: step ? step : "1",
            onChanged: []
        }
    }

    addBooleanOption(optionName, defaultValue) {
        this.options[optionName] = {
            type: "boolean",
            value:  SAVEGAME.getOption(optionName) ? SAVEGAME.getOption(optionName) === "true" : defaultValue,
            onChanged: []
        }
    }

    bindOption(context, optionName, event) {
        this.options[optionName].onChanged.push({context: context, event: event});
    }

    setOptionValue(optionName, value) {
        SAVEGAME.saveOption(optionName, value);
        this.options[optionName].value = value;
        for(const event of this.options[optionName].onChanged) {
            event.event(event.context, value);
        }
    }
}



const OPTION_MANAGER = new OptionManager();