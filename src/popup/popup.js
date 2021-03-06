/**
 * populates the modulelist from local Storage
 */
async function populateModuleList() {
    const moduleList = await Helpers.getModuleListFromLocalStorage();

    // reset ModuleList
    const selectModuleList = document.getElementById("customModulesList");
    const selectParentNode = selectModuleList.parentNode;
    let newModuleList = selectModuleList.cloneNode(false); // Make a shallow copy
    selectParentNode.replaceChild(newModuleList, selectModuleList);
    newModuleList.onchange = showCustomModuleInformation;

    if (!(Object.keys(moduleList).length === 0) && moduleList.constructor === Object) {
        for (let customModule in moduleList) {
            newModuleList.options[newModuleList.options.length] = new Option(moduleList[customModule].acronym);
            newModuleList.hidden = false;
        }
    }
    else {
        newModuleList.hidden = true;
    }

}

/**
 * Gets the information of the selected modul and
 * updates the forms with the right values.
 */
async function showCustomModuleInformation() {
    let moduleAcronym = "";
    const selectModuleList = document.getElementById("customModulesList");

    const selectedIndex = selectModuleList.selectedIndex
    if (selectedIndex > -1) {
        moduleAcronym = selectModuleList.options[selectedIndex].value;
    }

    const moduleList = await Helpers.getModuleListFromLocalStorage();
    const customModule = moduleList[moduleAcronym];

    document.getElementById("moduleCredits").value = customModule.credits;
    document.getElementById("moduleGrade").value = customModule.grade != 'n/a' ? customModule.grade : '-';
    document.getElementById("moduleMark").value = customModule.mark != 'n/a' ? customModule.mark : '0';
    document.getElementById("moduleAcronym").value = customModule.acronym;
    document.getElementById("moduleYear").value = customModule.year;
    document.getElementById("moduleType").value = customModule.type;

    const moduleSemesterRadios = document.getElementsByName('moduleImplementation');
    for (let i = 0, length = moduleSemesterRadios.length; i < length; i++) {
        if (moduleSemesterRadios[i].value == customModule.semster) {
            moduleSemesterRadios[i].checked = true;
            break;
        }
    }
}

/**
 * populates the year select
 */
function populateYearList() {
    const startYear = (new Date()).getFullYear() - 8;
    const endYear = (new Date()).getFullYear();
    let options = "";

    for (var y = startYear; y <= endYear; y++) {
        options += "<option>" + y + "</option>";
    }
    document.getElementById("moduleYear").innerHTML = options;
}

/**
 * @returns {Object} local storage
 */
async function getLocalStorage() {
    let localStorage;
    if (Helpers.isFirefox()) {
        localStorage = await browser.storage.local.get();
    }
    else {
        const getLocalStorageChrome = () => {
            return new Promise(
                (resolve, reject) => {
                    moduleList = chrome.storage.local.get(null, function (response) {
                        resolve(response);
                    });
                });
        }
        localStorage = await getLocalStorageChrome();

    }
    return localStorage
}

/**
 *
 * @param {Object} moduleList
 */
async function setModuleList(moduleList) {
    if (Helpers.isFirefox()) {
        await browser.storage.local.set({ moduleList: moduleList });
    }
    else {
        await chrome.storage.local.set({ moduleList: moduleList });
    }
}

/**
 * deletes the selected module from local storage
 */
async function removeCustomModule() {
    const moduleList = await Helpers.getModuleListFromLocalStorage();

    const selectModuleList = document.getElementById("customModulesList");

    const selectedIndex = selectModuleList.selectedIndex;
    if (selectedIndex > -1) {
        const selectedModule = selectModuleList.options[selectedIndex].value;
        delete moduleList[selectedModule];
        await setModuleList(moduleList);
    }
    else {
        console.warn("select a module");
    }
}

/**
 * adds custom module to local storage
 */
async function addCustomModule() {
    const moduleAcronym = document.getElementById("moduleAcronym").value;
    const moduleType = document.getElementById("moduleType").value;
    const moduleCredits = document.getElementById("moduleCredits").value;
    let moduleGrade = document.getElementById("moduleGrade").value;
    if (moduleGrade == "-") {
        moduleGrade = 'n/a';
    }

    const modulYearList = document.getElementById("moduleYear");
    const moduleYear = modulYearList.options[modulYearList.selectedIndex].value;

    const moduleSemesterRadios = document.getElementsByName('moduleImplementation');
    for (let i = 0, length = moduleSemesterRadios.length; i < length; i++) {
        if (moduleSemesterRadios[i].checked) {
            moduleSemester = moduleSemesterRadios[i].value;
            break;
        }
    }

    let moduleMark = document.getElementById("moduleMark").value;
    if (moduleMark < 1) {
        moduleMark = 'n/a';
    }

    const moduleList = await Helpers.getModuleListFromLocalStorage();

    moduleList[moduleAcronym] = {
        acronym: moduleAcronym,
        type: moduleType,
        credits: moduleCredits,
        mark: moduleMark,
        grade: moduleGrade,
        year: moduleYear,
        semster: moduleSemester
    }
    await setModuleList(moduleList);
}

/**
 * init function
 */
async function start() {
    document.getElementById("submitModule").onclick = addCustomModule;
    document.getElementById("removeModule").onclick = removeCustomModule;

    let localStorage = await Helpers.getLocalStorage();
    if (!(localStorage.moduleList)) {
        const moduleList = {};
        await setModuleList(moduleList);
    }
    populateModuleList();
    populateYearList();

    //every time the storage changes(set/remove)
    if (Helpers.isFirefox()) {
        browser.storage.onChanged.addListener(populateModuleList);
    }
    else {
        chrome.storage.onChanged.addListener(populateModuleList);
    }
}

window.onload = () => {
    start();
};
