//* ----------------- IGNORING SOME SECURITY VULNERABILITIES DUE TO SAFE ENVIRONMENT -----------------

// file deepcode ignore NoRateLimitingForExpensiveWebOperation
// file deepcode ignore UseCsurfForExpress
// file deepcode ignore HttpToHttps

//* ----------------- IMPORTS -----------------

import chokidar from "chokidar";
import _colors from "colors";
import express from "express";
import fs from "fs";
import helmet from "helmet";
import http from "http";
import io from "@pm2/io";
import { networkInterfaces } from "os";
import path from "path";
import qrcode from "qrcode";
import session from "express-session";
import { SerialPort } from "serialport";
import { WebSocketServer } from "ws";
import {
    startPrismaStudio,
    generateTimestamp,
    fetchDefaultDisplayData,
    fetchRankingData,
    fetchStandaloneData,
    fetchTimeData,
    fetchTimes,
    startRun,
    endRun,
    saveRun,
    saveDrivers,
    deleteTime,
    deleteTimestamp,
    lastVehicle,
    reset,
    createTimestamp,
    fetchOperationData,
    fetchSettingsData,
} from "./src/db.js";

import dotenv from "dotenv";
const CONFIG = dotenv.config().parsed;

//* ----------------- VARIABLES -----------------

var portOpened = null;
var accumulatedData = "";

//* ----------------- SERVER SETUP -----------------

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.set("view engine", "pug");
app.set("views", "views");
app.locals.basedir = "views";

app.use((req, res, next) => {
    console.log(`Handling ${req.path} request from IP ${req.ip}`);
    next();
});

app.use(
    session({
        secret: "THIS_IS_A_SECRET_KEY",
        resave: false,
        saveUninitialized: true,
        cookie: { secure: true },
    })
);

app.use(express.static(path.join(process.cwd(), "public")));
app.use(express.json());

app.use(
    helmet({
        contentSecurityPolicy: {
            useDefaults: false,
            directives: {
                "default-src": ["'self'", ...getAllServerIps()],
                "worker-src": ["'self'", "blob:", ...getAllServerIps()],
                "img-src": ["'self'", "data:", ...getAllServerIps()],
                "frame-src": ["'self'", "*"],
            },
        },
    })
);

//* ----------------- SPECIAL FUNCTIONS -----------------

chokidar.watch(CONFIG.DATABASE_PATH).on("change", () => {
    console.log("Database file changed, telling clients to reload.");
    tellClients("reload");
});

server.listen(CONFIG.PORT, () => {
    startPrismaStudio();
    console.log(`Server is running on port ${CONFIG.PORT}`.green);

    handleSerialPort();
});

function renderView(viewName) {
    return (req, res) => {
        res.render(viewName);
    };
}

function fetchDataAndRender(viewName, queryFn) {
    return async (req, res) => {
        try {
            const data = await queryFn();
            res.render(viewName, data);
        } catch (err) {
            console.error(err);
            res.status(500).send(`Error fetching data for ${viewName}`);
        }
    };
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

// Main function to handle serial port logic
async function handleSerialPort() {
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
//* ----------------- FUNCTIONS -----------------

/**
 * Parse incoming serial data and create a new timestamp in the database.
 * @param {string} data The incoming serial data.
 * @returns {Promise<void>} A promise that resolves when the data has been parsed.
 * @throws {Error} If an error occurs while parsing the data.
 */
async function parseSerialData(data) {
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
        TODO;
        await createTimestamp();
    } else {
        console.error(`No time found in data, accumulating more data...`);
        console.error(`Accumulated data: ${accumulatedData}`);
    }
}

/**
 * Send a message to all connected clients.
 * @param {String} message
 */
async function tellClients(message) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

/**
 * Gets all the IP addresses of the server.
 * @returns {Array} An array of all server IP addresses.
 */
function getAllServerIps() {
    var ipAddresses = [];
    try {
        const nets = networkInterfaces();
        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                if (net.family === "IPv4" && !net.internal) {
                    ipAddresses.push(net.address);
                }
            }
        }
    } catch (e) {
        console.error(e);
        ipAddresses = ["127.0.0.1"];
    }
    return ipAddresses;
}

async function fetchInfoData() {
    const ips = getAllServerIps();

    if (ips.length === 1 && ips[0] === "127.0.0.1") {
        console.log("No external IP found, returning null.");
        return { addresses: null, port: port };
    }

    const ipData = await Promise.all(
        ips.map(async (ip) => {
            const qr = await qrcode.toDataURL(`http://${ip}:${port}`);
            return {
                ip: ip,
                qr: qr,
            };
        })
    );
    return {
        addresses: ipData,
        port: port,
    };
}

async function fetchPrismaStudioPort() {
    startPrismaStudio(dbPort);
    return { dbPort: dbPort };
}

//* ----------------- SERVER GET ROUTES -----------------

app.get("/", renderView("home"));

app.get("/info", fetchDataAndRender("info", fetchInfoData));

app.get("/display", async (req, res) => {
    const displayMode = CONFIG.DISPLAY_MODE; // Fetch the current display mode from your config or another source

    try {
        let data;
        let templateName;

        switch (displayMode) {
            case "default":
                data = await fetchDefaultDisplayData();
                templateName = "display/default";
                break;
            case "ranking":
                data = await fetchRankingData();
                templateName = "display/ranking";
                break;
            case "standalone":
                data = await fetchStandaloneData();
                templateName = "display/standalone";
                break;
            default:
                return res.status(400).send("Unsupported display mode");
        }
        if (!data) {
            return res.render("display/empty");
        }
        res.render(templateName, data);
    } catch (err) {
        console.error(err);
        res.status(500).send(`Error fetching data for ${displayMode}`);
    }
});

app.get("/operation", fetchDataAndRender("operation", fetchOperationData));

app.get("/database", fetchDataAndRender("database", fetchPrismaStudioPort));

app.get("/timeData", async (req, res) => {
    res.json(await fetchTimeData());
});

app.get("/times", fetchDataAndRender("times", fetchTimes));

app.get("/settings", fetchDataAndRender("settings", fetchSettingsData));

//* ----------------- SERVER POST ROUTES -----------------

app.post("/generate-timestamp", async (req, res) => {
    await generateTimestamp();
    res.send("Demo data generated");
});

app.post("/start-run", async (req, res) => {
    const timestamp = new Date(req.body.timestamp);
    const driverId = parseInt(req.body.driver);
    const vehicleId = parseInt(req.body.vehicle);

    try {
        startRun(timestamp, driverId, vehicleId);
        res.status(200).send("Run started");
    } catch (e) {
        console.error(e);
        res.status(500).send("Error starting run");
        return;
    }
});

app.post("/delete-time", async (req, res) => {
    const run = parseInt(req.body.run);
    try {
        await deleteTime(run);
        res.status(200).send("Time deleted");
    } catch (e) {
        console.error(e);
        res.status(500).send("Error deleting run");
        return;
    }
});

app.post("/get-vehicle-for-driver", async (req, res) => {
    let vehicle = lastVehicle(parseInt(req.body.driverId));
    res.status(200).send(vehicle);
});

app.post("/save-run", async (req, res) => {
    const run = parseInt(req.body.run);
    const penalty = parseInt(req.body.penalty);
    var note = req.body.note;

    if (!note) {
        note = "👍🏼";
    }

    try {
        saveRun(run, penalty, note);
        res.status(200).send("Run saved");
    } catch (e) {
        console.error(e);
        res.status(500).send("Error saving run");
        return;
    }
});

app.post("/reset-data", async (req, res) => {
    try {
        reset();
        res.status(200).send("Data reset");
    } catch (e) {
        console.error(e);
        res.status(500).send("Error resetting data");
        return;
    }
});

app.post("/delete-timestamp", async (req, res) => {
    const timestamp = new Date(req.body.timestamp);
    try {
        deleteTimestamp(timestamp);
        res.status(200).send("Timestamp deleted");
    } catch (e) {
        console.error(e);
        res.status(500).send("Error deleting timestamp");
        return;
    }
});

app.post("/save-drivers", async (req, res) => {
    const drivers = req.body.drivers;
    try {
        saveDrivers(drivers);
        res.status(200).send("Drivers saved");
    } catch (e) {
        console.error(e);
        res.status(500).send("Error saving drivers");
        return;
    }
});

app.post("/end-run", async (req, res) => {
    const timestamp = new Date(req.body.timestamp);
    const run = parseInt(req.body.run);

    try {
        endRun(run, timestamp);
        res.status(200).send("Run ended");
    } catch (e) {
        console.error(e);
        res.status(500).send("Error ending run");
        return;
    }
});

app.post("/set-display-mode", async (req, res) => {
    const mode = req.body.displayMode;
    CONFIG.DISPLAY_MODE = mode;
    res.status(200).send("Display mode set");
    tellClients("reload");
});
