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
    });
    // when the active pool changes
    document.getElementById("activeDrivers").addEventListener("change", () => {
        somethingChanged();
    });
    // when the inactive pool changes
    document
        .getElementById("inactiveDrivers")
        .addEventListener("change", () => {
            somethingChanged();
        });
    document.getElementById("displayMode").addEventListener("change", () => {
        setDisplayMode();
    });
});

async function setDisplayMode() {
    const displayMode = document.getElementById("displayMode").value;
    try {
        await fetch("/set-display-mode", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                displayMode: displayMode,
            }),
        });
    } catch (error) {
        console.error(error);
    }
}

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
    // Assuming activeDrivers and inactiveDrivers are select elements
    const activeSelect = document.getElementById("activeDrivers");
    const inactiveSelect = document.getElementById("inactiveDrivers");

    // Buttons IDs
    const moveUpButton = document.getElementById("moveUp");
    const moveDownButton = document.getElementById("moveDown");
    const deactivateButton = document.getElementById("deactivate");
    const deactivateAllButton = document.getElementById("deactivateAll");
    const activateButton = document.getElementById("activate");

    // Update select sizes to fit content
    activeSelect.size = activeSelect.length;
    inactiveSelect.size = inactiveSelect.length;

    // Logic for Active Drivers Select
    if (activeSelect.length === 0) {
        moveUpButton.disabled = true;
        moveDownButton.disabled = true;
        deactivateButton.disabled = true;
        deactivateAllButton.disabled = true;
        activeSelect.disabled = true;
    } else if (activeSelect.length === 1) {
        moveUpButton.disabled = true; // Disable moveUp when only one driver is left
        moveDownButton.disabled = true; // Disable moveDown when only one driver is left
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

    // Logic for Inactive Drivers Select
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

    // Additional logic for enabling/deactivating buttons based on the presence of drivers and their selection state
    if (activeSelect.length > 0) {
        deactivateButton.disabled = activeSelect.selectedOptions.length === 0; // Only disable if no drivers are selected
        deactivateAllButton.disabled = false; // Enable Deactivate All if there are any drivers
    } else {
        deactivateButton.disabled = true;
        deactivateAllButton.disabled = true;
    }

    // Ensure Activate button is correctly enabled/disabled based on inactive drivers
    if (inactiveSelect.length > 0) {
        activateButton.disabled = inactiveSelect.selectedOptions.length === 0; // Disable Activate if no drivers are selected in the inactive pool
    } else {
        activateButton.disabled = true; // Disable Activate if there are no inactive drivers
    }
}

async function activateDrivers() {
    // move all selected drivers from the inactive to the active pool
    const inactiveSelect = document.getElementById("inactiveDrivers");
    const activeSelect = document.getElementById("activeDrivers");

    const selectedInactiveDrivers = Array.from(
        inactiveSelect.selectedOptions
    ).map((option) => ({ value: option.value, text: option.text }));

    // Create a DocumentFragment to hold the new options
    const fragment = document.createDocumentFragment();

    selectedInactiveDrivers.forEach(({ value, text }) => {
        const option = document.createElement("option");
        option.value = value;
        option.text = text;
        fragment.appendChild(option);
    });

    // Determine the insertion point
    let insertPosition = activeSelect.length;
    if (activeSelect.selectedOptions.length > 0) {
        // Get the index of the last selected option in the active list
        const lastSelectedActiveIndex =
            activeSelect.selectedOptions[
                activeSelect.selectedOptions.length - 1
            ].index;
        insertPosition = lastSelectedActiveIndex + 1;
    }

    // Convert the activeSelect options collection to an array to easily find the insertion point
    const activeOptionsArray = Array.from(activeSelect.options);

    // Insert the fragment right after the last selected active driver
    if (insertPosition < activeOptionsArray.length) {
        activeSelect.insertBefore(fragment, activeOptionsArray[insertPosition]);
    } else {
        // If no active drivers are selected, append to the end
        activeSelect.appendChild(fragment);
    }

    // Set the newly added driver as the selected option
    selectedInactiveDrivers.forEach(({ value }) => {
        const option = Array.from(activeSelect.options).find(
            (option) => option.value === value
        );
        if (option) {
            option.selected = true;
        }
    });

    // Remove the selected drivers from the inactive pool
    selectedInactiveDrivers.forEach(({ value, text }) => {
        const option = Array.from(inactiveSelect.options).find(
            (option) => option.value === value && option.text === text
        );
        if (option) {
            const index = option.index;
            inactiveSelect.remove(option.index);
            if (index < inactiveSelect.length) {
                inactiveSelect.selectedIndex = index;
            } else {
                inactiveSelect.selectedIndex = index - 1;
            }
        }
    });
    document.getElementById("save").disabled = false;
    somethingChanged();
}

async function deactivateDrivers() {
    // move all selected drivers from the active to the inactive pool
    const select = document.getElementById("activeDrivers");
    const selectedDrivers = Array.from(select.selectedOptions).map(
        (option) => ({ value: option.value, text: option.text })
    );

    // move it down, the server is only called on save
    const inactiveSelect = document.getElementById("inactiveDrivers");

    selectedDrivers.forEach(({ value, text }) => {
        const option = document.createElement("option");
        option.value = value;
        option.text = text;
        inactiveSelect.add(option);
    });

    // remove the selected drivers from the active pool
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
    // move all drivers from the active to the inactive pool
    const select = document.getElementById("activeDrivers");
    const drivers = Array.from(select.options).map((option) => ({
        value: option.value,
        text: option.text,
    }));

    // move it down, the server is only called on save
    const inactiveSelect = document.getElementById("inactiveDrivers");

    drivers.forEach(({ value, text }) => {
        const option = document.createElement("option");
        option.value = value;
        option.text = text;
        inactiveSelect.add(option);
    });

    // remove all drivers from the active pool
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
    // move all selected drivers up in the active pool
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
    // move all selected drivers down in the active pool
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
    // save the order of the active drivers
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
