// file deepcode ignore UseSecureWebsockets: <please specify a reason of ignoring this>
const socket = new WebSocket("ws://" + window.location.host);

socket.addEventListener("open", (event) => {
    console.log("WebSocket Client Connected");
});

socket.addEventListener("message", (event) => {
    if (event.data === "reload") {
        console.log(
            "New data, updating data without reload to keep selection etc..."
        );
        refreshData();
    } else if (event.data === "disconnect") {
        location.reload();
    }
});

// when socket gets lost remove the connected class from the h1 elements and add the disconnected class
socket.addEventListener("close", (event) => {
    console.log("WebSocket Client Disconnected");
    var h1Elements = document.querySelectorAll("h1");
    h1Elements.forEach((element) => {
        element.classList.remove("connected");
        element.classList.add("disconnected");
    });
});

async function refreshData() {
    // Save the current selection index
    var storedNew = document.getElementById("new").value;
    var storedStarted = document.getElementById("started").value;
    var storedDriver = document.getElementById("drivers").value;
    var storedVehicle = document.getElementById("vehicles").value;

    // get the new data from the server
    const newData = await fetch("/operation");

    if (!newData.ok) {
        console.error(newData.statusText);
        return;
    }

    // the new data is the whole html page, we only need the inner html of the body

    newData.text().then((text) => {
        // Create a DOMParser instance
        const parser = new DOMParser();

        // Parse the text into a document object
        const doc = parser.parseFromString(text, "text/html");

        // Extract the innerHTML of the body
        const newBodyContent = doc.body.textContent;

        // Replace the current body content with the new one
        document.body.innerText = newBodyContent;
        if (
            storedNew &&
            document.querySelector("option[value='" + storedNew + "']")
        ) {
            document.getElementById("new").value = storedNew;
        }
        if (
            storedStarted &&
            document.querySelector("option[value='" + storedStarted + "]")
        ) {
            document.getElementById("started").value = storedStarted;
        }
        if (storedDriver) {
            document.getElementById("drivers").value = storedDriver;
        }
        if (storedVehicle) {
            document.getElementById("vehicles").value = storedVehicle;
        }
        addEventListeners();
    });
}
window.addEventListener("beforeunload", (event) => {
    socket.close();
});

async function deleteTimestamps() {
    // get the selected timestamp from the "unused-timestamps" select element
    // set its value used to "true" in the db
    var select = document.getElementById("new");
    // check if there are no timestamps to delete
    if (select.length === 0) {
        tr("Kein Zeitstempel zum Löschen vorhanden");
        return;
    }
    var selectedTimestamp = select.options[select.selectedIndex].value;
    try {
        await fetch("/delete-timestamp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                timestamp: selectedTimestamp,
            }),
        });
        // remove the selected option from the select element
    } catch (error) {
        console.error(error);
    }
}

async function startRun() {
    // create a time in the time table with the selected timestamp as starttime, the selected driver as driver and the selected vehicle as vehicle
    var select = document.getElementById("new");
    // check if there are no timestamps to start
    if (select.length === 0) {
        tr("Kein Zeitstempel mit welchem ein Lauf gestartet werden kann");
        return;
    }
    const selectedTimestamp = select.options[select.selectedIndex].value;

    select = document.getElementById("drivers");
    const driver = select.options[select.selectedIndex].value;

    select = document.getElementById("vehicles");
    const vehicle = select.options[select.selectedIndex].value;

    try {
        await fetch("/start-run", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                timestamp: selectedTimestamp,
                driver: driver,
                vehicle: vehicle,
            }),
        });
    } catch (error) {
        console.error(error);
    }
}

async function endRun() {
    // add the selected started run with the selected timestamp as endtime
    // check if there are no started runs to end
    var selectStarted = document.getElementById("started");
    if (selectStarted.length === 0) {
        alert("Kein Lauf zum Beenden vorhanden");
        return;
    }
    const selectedRun =
        selectStarted.options[selectStarted.selectedIndex].value;
    var selectNew = document.getElementById("new");
    if (selectNew.length === 0) {
        alert("Kein Zeitstempel zum Beenden vorhanden");
        return;
    }
    const selectedTimestamp = selectNew.options[selectNew.selectedIndex].value;

    try {
        await fetch("/end-run", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                run: selectedRun,
                timestamp: selectedTimestamp,
            }),
        });
    } catch (error) {
        console.error(error);
    }
}

async function saveRun() {
    // get the penalty and note from the input fields and save them to the selected ended run
    const note = document.getElementById("note").value;
    const penalty = document.getElementById("penalty").value;

    var select = document.getElementById("ended");
    const selectedRun = select.options[select.selectedIndex].value;

    try {
        await fetch("/save-run", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                run: selectedRun,
                penalty: penalty,
                note: note,
            }),
        });
    } catch (error) {
        console.error(error);
    }
}

async function updateVehicleForDriver() {
    // get the selected driver and update the vehicle select element with the vehicles for the selected driver. if the driver has no vehicles, leave the select element as it was
    const select = document.getElementById("drivers");
    const driver = select.options[select.selectedIndex].value;

    const vehicle = await fetch("/get-vehicle-for-driver", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            driverId: driver,
        }),
    });

    if (!vehicle.ok) {
        console.error(vehicle.statusText);
        return;
    }
    // {"id":25,"driverId":16,"vehicleId":4}

    // select the vehicle id in the vehicle select element
    const vehicleData = await vehicle.json();
    const vehicleSelect = document.getElementById("vehicles");
    const vehicleOption = document.querySelector(
        "option[value='" + vehicleData.vehicleId + "']"
    );
    if (vehicleOption) {
        vehicleSelect.value = vehicleOption.value;
    }
}

async function deleteStarted() {
    // set the currently selected started run to old
    var select = document.getElementById("started");
    if (select.length === 0) {
        tr("Kein Lauf zum Löschen vorhanden");
        return;
    }
    const selectedRun = select.options[select.selectedIndex].value;

    try {
        await fetch("/delete-time", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                run: selectedRun,
            }),
        });
    } catch (error) {
        console.error(error);
    }
}

async function deleteEnded() {
    var select = document.getElementById("ended");
    if (select.length === 0) {
        tr("Kein Lauf zum Löschen vorhanden");
        return;
    }
    const selectedRun = select.options[select.selectedIndex].value;

    try {
        await fetch("/delete-time", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                run: selectedRun,
            }),
        });
    } catch (error) {
        console.error(error);
    }
}

addEventListener("DOMContentLoaded", () => {
    addEventListeners();
});

function addEventListeners() {
    document
        .getElementById("deleteTime")
        .addEventListener("click", deleteTimestamps);

    document
        .getElementById("deleteStarted")
        .addEventListener("click", deleteStarted);

    document
        .getElementById("deleteEnded")
        .addEventListener("click", deleteEnded);

    document.getElementById("start").addEventListener("click", startRun);

    document.getElementById("end").addEventListener("click", endRun);

    document.getElementById("save").addEventListener("click", saveRun);

    // when a new driver is selected, update the vehicle select element
    document
        .getElementById("drivers")
        .addEventListener("change", updateVehicleForDriver);
}
