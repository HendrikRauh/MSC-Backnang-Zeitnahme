import express from "express";
import { WebSocketServer } from "ws";

import helmet from "helmet";
import session from "express-session";
import path from "path";
import http from "http";
import dotenv from "dotenv";
import { networkInterfaces } from "os";
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
} from "./db.js";

const CONFIG = dotenv.config().parsed;

/**
 * Gets all the IP addresses of the server.
 * @returns {Array} An array of all server IP addresses.
 */
export function getAllServerIps() {
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

/**
 * Send a message to all connected clients.
 * @param {String} message
 */
export async function websocketSend(message) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

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
    websocketSend("reload");
});

server.listen(CONFIG.PORT, () => {
    console.log(`Server is running on port ${CONFIG.PORT}`.green);
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
    startPrismaStudio();
    return { dbPort: dbPort };
}
