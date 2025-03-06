addEventListener("DOMContentLoaded", async () => {
    somethingChanged();
    addEventListener("click", async (event) => {
        if (event.target.id === "activate") {
            await activateDrivers();
        }
        if (event.target.id === "deactivate") {
            await deactivateDrivers();
        }
        if (event.target.id === "deactivateAll") {
            await deactivateAllDrivers();
        }
        if (event.target.id === "moveUp") {
            await moveUp();
        }
        if (event.target.id === "moveDown") {
            await moveDown();
        }
        if (event.target.id === "save") {
            await saveDrivers();
        }
        if (event.target.id === "resetData") {
            await resetData();
        }
        document
            .getElementById("activeDrivers")
            .addEventListener("change", () => {
                somethingChanged();
            });
        document
            .getElementById("inactiveDrivers")
            .addEventListener("change", () => {
                somethingChanged();
            });

        const trainingGroupsElement = document.getElementById("trainingGroups");
        if (trainingGroupsElement) {
            trainingGroupsElement.addEventListener("change", () => {
                filterDriversByTrainingGroup();
            });
        }
    });
});

async function resetData() {
    try {
        await fetch("/reset-data", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });
        location.reload();
    } catch (error) {
        console.error(error);
    }
}

function somethingChanged() {
    const activeSelect = document.getElementById("activeDrivers");
    const inactiveSelect = document.getElementById("inactiveDrivers");

    const moveUpButton = document.getElementById("moveUp");
    const moveDownButton = document.getElementById("moveDown");
    const deactivateButton = document.getElementById("deactivate");
    const deactivateAllButton = document.getElementById("deactivateAll");
    const activateButton = document.getElementById("activate");

    activeSelect.size = activeSelect.length;
    inactiveSelect.size = Array.from(inactiveSelect.options).filter(
        (option) => !option.hidden
    ).length;

    if (activeSelect.length === 0) {
        moveUpButton.disabled = true;
        moveDownButton.disabled = true;
        deactivateButton.disabled = true;
        deactivateAllButton.disabled = true;
        activeSelect.disabled = true;
    } else if (activeSelect.length === 1) {
        moveUpButton.disabled = true;
        moveDownButton.disabled = true;
        deactivateButton.disabled = false;
        deactivateAllButton.disabled = false;
        activeSelect.disabled = false;
    } else if (activeSelect.selectedOptions.length === 1) {
        moveUpButton.disabled = activeSelect.selectedOptions[0].index === 0;
        moveDownButton.disabled =
            activeSelect.selectedOptions[0].index === activeSelect.length - 1;
        deactivateButton.disabled = false;
        deactivateAllButton.disabled = false;
        activeSelect.disabled = false;
    } else {
        moveUpButton.disabled = true;
        moveDownButton.disabled = true;
        deactivateButton.disabled = true;
        deactivateAllButton.disabled = false;
        activeSelect.disabled = false;
    }

    if (inactiveSelect.length === 0) {
        activateButton.disabled = true;
        inactiveSelect.size = 1;
        inactiveSelect.disabled = true;
    } else if (inactiveSelect.length === 1) {
        inactiveSelect.disabled = true;
        inactiveSelect.selectedIndex = 0;
    } else if (inactiveSelect.selectedOptions.length >= 1) {
        activateButton.disabled = false;
        inactiveSelect.disabled = false;
    } else {
        activateButton.disabled = true;
        inactiveSelect.disabled = false;
    }

    if (activeSelect.length > 0) {
        deactivateButton.disabled = activeSelect.selectedOptions.length === 0;
        deactivateAllButton.disabled = false;
    } else {
        deactivateButton.disabled = true;
        deactivateAllButton.disabled = true;
    }

    if (inactiveSelect.length > 0) {
        activateButton.disabled = inactiveSelect.selectedOptions.length === 0;
    } else {
        activateButton.disabled = true;
    }

    filterDriversByTrainingGroup();
}

function filterDriversByTrainingGroup() {
    const checkboxes = document.querySelectorAll(
        'input[name="trainingGroups"]:checked'
    );
    const selectedGroups = Array.from(checkboxes).map(
        (checkbox) => checkbox.value
    );

    const inactiveSelect = document.getElementById("inactiveDrivers");

    Array.from(inactiveSelect.options).forEach((option) => {
        const trainingGroup = option.getAttribute("data-training-group");
        option.hidden = !selectedGroups.includes(trainingGroup);
    });

    inactiveSelect.size = Array.from(inactiveSelect.options).filter(
        (option) => !option.hidden
    ).length;
}

async function activateDrivers() {
    const inactiveSelect = document.getElementById("inactiveDrivers");
    const activeSelect = document.getElementById("activeDrivers");

    const selectedInactiveDrivers = Array.from(inactiveSelect.selectedOptions)
        .filter((option) => !option.hidden)
        .map((option) => ({
            value: option.value,
            text: option.text,
            trainingGroup: option.getAttribute("data-training-group"),
        }));

    const fragment = document.createDocumentFragment();

    selectedInactiveDrivers.forEach(({ value, text, trainingGroup }) => {
        const option = document.createElement("option");
        option.value = value;
        option.text = text;
        option.setAttribute("data-training-group", trainingGroup);
        fragment.appendChild(option);
    });

    let insertPosition = activeSelect.length;
    if (activeSelect.selectedOptions.length > 0) {
        const lastSelectedActiveIndex =
            activeSelect.selectedOptions[
                activeSelect.selectedOptions.length - 1
            ].index;
        insertPosition = lastSelectedActiveIndex + 1;
    }

    const activeOptionsArray = Array.from(activeSelect.options);

    if (insertPosition < activeOptionsArray.length) {
        activeSelect.insertBefore(fragment, activeOptionsArray[insertPosition]);
    } else {
        activeSelect.appendChild(fragment);
    }

    selectedInactiveDrivers.forEach(({ value }) => {
        const option = Array.from(activeSelect.options).find(
            (option) => option.value === value
        );
        if (option) {
            option.selected = true;
        }
    });

    selectedInactiveDrivers.forEach(({ value, text }) => {
        const option = Array.from(inactiveSelect.options).find(
            (option) => option.value === value && option.text === text
        );
        if (option) {
            const index = option.index;
            inactiveSelect.remove(option.index);
        }
    });
    document.getElementById("save").disabled = false;
    somethingChanged();
}

async function deactivateDrivers() {
    const select = document.getElementById("activeDrivers");
    const selectedDrivers = Array.from(select.selectedOptions).map(
        (option) => ({
            value: option.value,
            text: option.text,
            trainingGroup: option.getAttribute("data-training-group"),
        })
    );

    const inactiveSelect = document.getElementById("inactiveDrivers");

    selectedDrivers.forEach(({ value, text, trainingGroup }) => {
        const option = document.createElement("option");
        option.value = value;
        option.text = text;
        option.setAttribute("data-training-group", trainingGroup);
        inactiveSelect.add(option);
    });

    selectedDrivers.forEach(({ value, text }) => {
        const option = Array.from(select.options).find(
            (option) => option.value === value && option.text === text
        );
        if (option) {
            const index = option.index;
            select.remove(option.index);

            if (index < select.length) {
                select.selectedIndex = index;
            } else {
                select.selectedIndex = index - 1;
            }
        }
    });

    document.getElementById("save").disabled = false;
    somethingChanged();
}

async function deactivateAllDrivers() {
    const select = document.getElementById("activeDrivers");
    const drivers = Array.from(select.options).map((option) => ({
        value: option.value,
        text: option.text,
        trainingGroup: option.getAttribute("data-training-group"),
    }));

    const inactiveSelect = document.getElementById("inactiveDrivers");

    drivers.forEach(({ value, text, trainingGroup }) => {
        const option = document.createElement("option");
        option.value = value;
        option.text = text;
        option.setAttribute("data-training-group", trainingGroup);
        inactiveSelect.add(option);
    });

    drivers.forEach(({ value, text }) => {
        const option = Array.from(select.options).find(
            (option) => option.value === value && option.text === text
        );
        if (option) {
            select.remove(option.index);
        }
    });
    document.getElementById("save").disabled = false;
    somethingChanged();
}

async function moveUp() {
    const select = document.getElementById("activeDrivers");
    const selectedDrivers = Array.from(select.selectedOptions).map(
        (option) => option.value
    );

    selectedDrivers.forEach((driver) => {
        const option = Array.from(select.options).find(
            (option) => option.value === driver
        );
        if (option.index > 0) {
            select.insertBefore(option, select.options[option.index - 1]);
        }
    });
    document.getElementById("save").disabled = false;
    somethingChanged();
}

async function moveDown() {
    const select = document.getElementById("activeDrivers");
    const selectedDrivers = Array.from(select.selectedOptions).map(
        (option) => option.value
    );

    selectedDrivers.forEach((driver) => {
        const option = Array.from(select.options).find(
            (option) => option.value === driver
        );
        if (option.index < select.length - 1) {
            select.insertBefore(option, select.options[option.index + 2]);
        }
    });
    document.getElementById("save").disabled = false;
    somethingChanged();
}

async function saveDrivers() {
    const select = document.getElementById("activeDrivers");
    const drivers = Array.from(select.options).map((option) => option.value);
    try {
        await fetch("/save-drivers", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                drivers: drivers,
            }),
        });
        document.getElementById("save").disabled = true;
    } catch (error) {
        console.error(error);
    }
}
