var accumulatedData = "";
var portOpened = null;
import { SerialPort } from "serialport";
import { createTimestamp } from "./db.js";

export async function handleSerialPort() {
    if (!portOpened) {
        console.log("Attempting to open serial port...");
        portOpened = await findAndOpenSerialPort("Prolific");
        if (portOpened) {
            console.log(`Connected to port: ${portOpened.path}`);
        } else {
            console.error("Failed to open serial port.");
        }
    } else {
        console.log("Checking if the port is still open...");
        const ports = await SerialPort.list();
        let found = false;
        for (const port of ports) {
            if (port.manufacturer === "Prolific") {
                found = true;
                break;
            }
        }
        if (!found) {
            console.log("Serial port is no longer available.");
            portOpened = null;
        }
    }
}

/**
 * Parse incoming serial data and create a new timestamp in the database.
 * @param {string} data The incoming serial data.
 * @returns {Promise<void>} A promise that resolves when the data has been parsed.
 * @throws {Error} If an error occurs while parsing the data.
 */
export async function parseSerialData(data) {
    console.log(`Received serial data: ${data}`);
    accumulatedData += data;

    const timeRegexNormalTime = /(\d{1,2}:\d{2}:\d{2}\.\d{3})/;

    const timeRegexBeforeOne = /(\d{1,2}:\d{2}\.\d{3})/;

    let match = accumulatedData.match(timeRegexNormalTime);

    if (!match) {
        match = accumulatedData.match(timeRegexBeforeOne);
        if (match) {
            accumulatedData = "0:" + match[1];
            match = accumulatedData.match(timeRegexNormalTime);
        }
    }

    if (match) {
        var time = match[1];

        const [hours, minutes, seconds, milliseconds] = time.split(/[:.]/);

        const date = new Date();
        date.setHours(
            parseInt(hours, 10),
            parseInt(minutes, 10),
            parseInt(seconds, 10),
            parseInt(milliseconds, 10)
        );

        accumulatedData = "";
        await createTimestamp(date);
    } else {
        console.error(`No time found in data, accumulating more data...`);
        console.error(`Accumulated data: ${accumulatedData}`);
    }
}

// Function to find and open a serial port by manufacturer
async function findAndOpenSerialPort(manufacturer) {
    const ports = await SerialPort.list();
    for (const port of ports) {
        if (port.manufacturer === manufacturer) {
            return await openSerialPort(port.path);
        }
    }
    console.error("No matching serial port found.");
    return null;
}

async function openSerialPort(path) {
    try {
        const port = await new SerialPort({
            path: path,
            baudRate: 9600,
        });

        port.on("error", (err) => {
            console.error("Error connecting to port:", err);
            portOpened = null;
            tellClients("disconnect");
            console.error("Port closed");
        });

        port.on("open", () => {
            console.log("Serial port opened successfully.");
            port.on("data", (data) => {
                parseSerialData(data.toString());
            });
        });

        port.on("close", () => {
            console.error("Port closed");
            portOpened = null;
            tellClients("disconnect");
        });

        return port;
    } catch (e) {
        console.error("Error connecting to the clock:", e);
        return null;
    }
}
