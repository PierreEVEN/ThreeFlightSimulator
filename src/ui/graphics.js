import {OPTION_MANAGER} from "../io/optionManager.js";

export {graphicsPage}

let graphicsPage;

function newOption(optionName) {
    const optionContainer = document.createElement("div");
    const optionTitle = document.createElement("h4");
    optionTitle.innerText = optionName;

    optionContainer.appendChild(optionTitle);
    return optionContainer;
}

function newSliderOption(title, value, min, max) {
    const option = newOption(title);
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = min;
    slider.max = max;
    slider.value = value;
    option.appendChild(slider);
    return option;
}


function newCheckboxOption(title, value) {
    const option = newOption(title);
    const checkBox = document.createElement("input");
    checkBox.type = "checkbox";
    checkBox.checked = value;

    option.appendChild(checkBox);
    return option;
}

function newCategory(categoryName) {
    let categoryBackground = document.createElement("div");
    let categoryTitle = document.createElement("h3");
    categoryTitle.innerText = categoryName;
    let categoryContainer = document.createElement("div");

    categoryBackground.appendChild(categoryTitle);
    categoryBackground.appendChild(categoryContainer);

    categoryBackground.appendChild = function (item) {
        categoryContainer.appendChild(item);
    }

    return categoryBackground;
}


function createGraphics() {
    graphicsPage = document.createElement("div");


    for (const option in OPTION_MANAGER.options) {
        const optionValue = OPTION_MANAGER.options[option];

        const optionContainer = document.createElement("div");
        const optionTitle = document.createElement("h4");
        optionTitle.innerText = option;
        optionContainer.appendChild(optionTitle);

        switch (optionValue.type) {
            case "combo":
                const combo = document.createElement("select");
                for (const selectOption of optionValue.choices) {
                    const optionItem = document.createElement("option");
                    optionItem.innerText = selectOption;
                    optionItem.value = selectOption;
                    if (selectOption === optionValue.currentChoice) optionItem.selected = true;
                    combo.appendChild(optionItem);
                }
                optionContainer.appendChild(combo);
                combo.onchange = () => {
                    OPTION_MANAGER.setOptionValue(option, combo.value);
                }
                break;
            case "range":
                const slider = document.createElement("input");
                slider.type = "range";
                slider.min = optionValue.min;
                slider.max = optionValue.max;
                slider.value = optionValue.value;
                slider.step = optionValue.step;
                const number = document.createElement("input");
                number.type = "number";
                number.min = optionValue.min;
                number.max = optionValue.max;
                number.value = optionValue.value;
                number.step = optionValue.step;
                OPTION_MANAGER.bindOption(slider, option, (context, value) => {context.value = value;});
                OPTION_MANAGER.bindOption(number, option, (context, value) => {context.value = value;});
                slider.onchange = () => {
                    OPTION_MANAGER.setOptionValue(option, parseFloat(slider.value));
                }
                slider.oninput = () => {
                    number.value = slider.value;
                }
                number.onchange = () => {
                    const value = parseFloat(number.value);
                    if (value < optionValue.min) number.value = optionValue.min;
                    if (value > optionValue.max) number.value = optionValue.max;
                    OPTION_MANAGER.setOptionValue(option, parseFloat(number.value));
                }
                number.oninput = () => {
                    slider.value = number.value;
                }
                optionContainer.appendChild(slider);
                optionContainer.appendChild(number);
                break;
            case "boolean":
                const checkBox = document.createElement("input");
                checkBox.type = "checkbox";
                checkBox.checked = optionValue.value;
                optionContainer.appendChild(checkBox);
                OPTION_MANAGER.bindOption(optionContainer, option, (context, value) => {context.checked = value;});
                checkBox.onchange = () => {
                    OPTION_MANAGER.setOptionValue(option, checkBox.checked);
                }
                break;
        }

        graphicsPage.appendChild(optionContainer);
    }

    let miscellaneous = newCategory("miscellaneous");
    miscellaneous.appendChild(newSliderOption("pixel percentage", 100, 25, 200));

    let foliage = newCategory("foliage");
    foliage.appendChild(newCheckboxOption("enable foliage", true));
    foliage.appendChild(newSliderOption("foliage density", 100, 20, 200));

    let atmosphere = newCategory("atmosphere");
    atmosphere.appendChild(newCheckboxOption("atmospheric scattering", true));
    atmosphere.appendChild(newSliderOption("atmosphere quality", 10, 3, 30));

    let landscape = newCategory("landscape");
    landscape.appendChild(newCheckboxOption("use skirts", true));
    landscape.appendChild(newSliderOption("loading range", 6, 2, 10));

}

createGraphics();