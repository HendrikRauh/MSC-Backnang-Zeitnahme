var accumulatedData = "";
var portOpened: SerialPort<AutoDetectTypes> | null = null;
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

async function parseSerialData(data: string): Promise<void> {
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
