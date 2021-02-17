
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


    const globalQuality = document.createElement("select");
    globalQuality.textContent = "graphics preset";
    const custom = document.createElement("option");
    custom.innerText = "custom";
    globalQuality.appendChild(custom);
    const low = document.createElement("option");
    low.innerText = "low";
    globalQuality.appendChild(low);
    const medium = document.createElement("option");
    medium.innerText = "medium";
    globalQuality.appendChild(medium);
    const high = document.createElement("option");
    high.innerText = "high";
    globalQuality.appendChild(high);
    const cinematic = document.createElement("option");
    cinematic.innerText = "cinematic";
    globalQuality.appendChild(cinematic);


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



    graphicsPage.appendChild(globalQuality);
    graphicsPage.appendChild(miscellaneous);
    graphicsPage.appendChild(foliage);
    graphicsPage.appendChild(atmosphere);
    graphicsPage.appendChild(landscape);
}

createGraphics();