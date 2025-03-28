var accumulatedData = "";
var portOpened: SerialPort<AutoDetectTypes> | null = null;
var offset: number | null = null;

import { AutoDetectTypes } from "@serialport/bindings-cpp";
import { SerialPort } from "serialport";
import { createTimestamp } from "./db/timestamp";
import { websocketSend } from "./server";

export { handleSerialPort, portOpened };

async function handleSerialPort() {
    console.log("Serial port handler started.");
    if (!portOpened) {
        console.log("Attempting to open serial port...");
        portOpened = await findAndOpenSerialPort("Prolific");
        if (portOpened) {
            console.log(`Connected to port: ${portOpened.path}`);
            offset = null;
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
            offset = null;
        }
    }
}

async function parseSerialData(data: string): Promise<void> {
    let actualDate = new Date();
    accumulatedData += data;

    const timeRegex = /(?:(\d{1,2}):)??(?:(\d{1,2}):)?(\d{1,2}).(\d{3})/;

    let match = accumulatedData.match(timeRegex);
    if (!match) {
        console.error(`No time found in data, accumulating more data...`);
        console.error(`Accumulated data: ${accumulatedData}`);
        return;
    }

    let hours = match[1] ? parseInt(match[1]) : 0;
    let minutes = match[2] ? parseInt(match[2]) : 0;
    let seconds = parseInt(match[3]);
    let milliseconds = parseInt(match[4]);

    if (hours > 23 || minutes > 59 || seconds > 59 || milliseconds > 999) {
        console.warn("Invalid time values:", {
            hours,
            minutes,
            seconds,
            milliseconds,
        });
        accumulatedData = "";
        return;
    }

    let originalDate = new Date();
    originalDate.setHours(hours, minutes, seconds, milliseconds);

    if (offset == null) {
        offset = calculateOffset(originalDate, actualDate);
        console.debug("Calculated offset:", offset);
    }

    let newDate = new Date();
    newDate.setTime(originalDate.getTime() - offset);

    accumulatedData = "";
    await createTimestamp(newDate);
}

async function findAndOpenSerialPort(manufacturer: string | undefined) {
    const ports = await SerialPort.list();
    for (const port of ports) {
        if (port.manufacturer === manufacturer) {
            return await openSerialPort(port.path);
        }
    }
    console.error("No matching serial port found.");
    return null;
}

async function openSerialPort(path: string) {
    try {
        const port = await new SerialPort({
            path: path,
            baudRate: 9600,
        });

        port.on("error", (err) => {
            console.error("Error connecting to port:", err);
            portOpened = null;
            websocketSend("disconnect");
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
            websocketSend("disconnect");
        });

        return port;
    } catch (e) {
        console.error("Error connecting to the clock:", e);
        return null;
    }
}

function calculateOffset(originalDate: Date, actualDate: Date): number {
    const originalTimestamp = originalDate.getTime();
    const actualTimestamp = actualDate.getTime();

    const offset = originalTimestamp - actualTimestamp;
    return offset;
}
