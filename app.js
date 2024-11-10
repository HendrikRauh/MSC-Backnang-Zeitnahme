//* ----------------- IGNORING SOME SECURITY VULNERABILITIES DUE TO SAFE ENVIRONMENT -----------------

// file deepcode ignore NoRateLimitingForExpensiveWebOperation
// file deepcode ignore UseCsurfForExpress
// file deepcode ignore HttpToHttps

//* ----------------- IMPORTS -----------------

const { exec } = require("child_process");
const chokidar = require("chokidar");
const _colors = require("colors");
const dotenv = require("dotenv");
const express = require("express");
const fs = require("fs");
const helmet = require("helmet");
const http = require("http");
const io = require("@pm2/io");
const { networkInterfaces } = require("os");
const path = require("path");
const qrcode = require("qrcode");
const session = require("express-session");
const { PrismaClient } = require("@prisma/client");
const { SerialPort } = require("serialport");
const WebSocket = require("ws");

//* ----------------- VARIABLES -----------------

const CONFIG = dotenv.config().parsed;
const prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"],
});
const port = CONFIG.PORT || 3000;
const dbPort = CONFIG.PRISMA_STUDIO_PORT || 5555;
var portOpened = null;
var accumulatedData = "";

//* ----------------- SERVER SETUP -----------------

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

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

app.use(express.static(path.join(__dirname, "public")));
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

server.listen(port, () => {
    startPrismaStudio();
    console.log(`Server is running on port ${port}`.green);

    handleSerialPort();
});

/**
 * Error handler
 * @param {Error} error - The error to handle
 */
errorHandler = (error) => {
    console.error("Error occurred:", error);
    throw error;
};

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
 * Generate demo timestamp for the database.
 */
async function generateTimestamp() {
    const time = new Date();

    await prisma.timeStamp.create({
        data: {
            timestamp: time,
            friendly: formatTimestamp(time),
        },
    });
}

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

        await prisma.timeStamp.create({
            data: {
                timestamp: date,
                friendly: formatTimestamp(date),
            },
        });
    } else {
        console.error(`No time found in data, accumulating more data...`);
        console.error(`Accumulated data: ${accumulatedData}`);
    }
}

/**
 * Run a query using Prisma and handle the result.
 * @param {Function} query The query to run.
 * @returns {Promise} The result of the query.
 * @throws {Error} If an error occurs during the query.
 */
async function runQuery(query) {
    console.log("Running query.");
    return query(prisma)
        .then((queryResult) => {
            return queryResult;
        })
        .catch(async (e) => {
            console.error(e);
            await prisma.$disconnect();
            process.exit(1);
        });
}

/**
 * Calculates the time between two timestamps and formats it as a string.
 * @param {string} startTime The start time as a string.
 * @param {string} endTime The end time as a string.
 * @param {number} penalty The penalty time in seconds.
 */
function getTime(startTime, endTime, penalty = 0) {
    console.log(
        `Calculating time with startTime: ${startTime}, endTime: ${endTime}, penalty: ${penalty}`
    );
    startTime = new Date(startTime).getTime();
    endTime = new Date(endTime).getTime();

    const driveTime = endTime - startTime;

    formattedDriveTime = formatDuration(driveTime);

    formattedTotalTime = formatDuration(driveTime + penalty * 1000);

    console.log(
        `Calculated time: ${driveTime}, formattedDriveTime: ${formattedDriveTime}, formattedTotalTime: ${formattedTotalTime}`
    );
    return {
        time: driveTime,
        formattedDriveTime: formattedDriveTime,
        formattedTotalTime: formattedTotalTime,
    };
}

/**
 * Formats a duration in milliseconds as a string.
 * @param {number} durationMs The duration in milliseconds.
 * @returns {string} The formatted duration as a string.
 */
function formatDuration(durationMs) {
    console.log(`Formatting duration: ${durationMs}`);
    let formattedString = "";

    const totalSeconds = Math.floor(durationMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor(durationMs % 1000);

    if (hours > 0) {
        formattedString += String(hours).padStart(2, "0") + ":";
    }

    if (minutes > 0 || hours > 0) {
        formattedString += String(minutes).padStart(2, "0") + ":";
    }

    formattedString += String(seconds).padStart(2, "0");
    formattedString += "," + String(milliseconds).padStart(3, "0");

    console.log(`Formatted duration: ${formattedString}`);
    return formattedString;
}

/**
 * Formats a timestamp as a string.
 * @param {Date} timestamp The timestamp to format.
 * @returns {string} The formatted timestamp as a string.
 */
function formatTimestamp(timestamp) {
    console.log(`Formatting timestamp: ${timestamp}`);
    return timestamp.toLocaleTimeString("de-de", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        fractionalSecondDigits: 3,
    });
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

/**
 * Start Prisma Studio if it is not already running.
 */
function startPrismaStudio() {
    const req = http.request(
        {
            hostname: "localhost",
            port: dbPort,
        },
        (res) => {
            console.log(`Prisma Studio already running`);
        }
    );

    req.on("error", (e) => {
        console.log(`Prisma Studio not running, starting...`);
        exec(`npx prisma studio -p ${dbPort} -b none`);
    });
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

async function fetchDefaultDisplayData() {
    const lastRun = await prisma.time.findFirst({
        where: {
            NOT: {
                endTime: null,
            },
            active: true,
        },
        orderBy: {
            id: "desc",
        },
        include: {
            driver: true,
            vehicle: true,
            startTime: true,
            endTime: true,
        },
    });

    if (!lastRun) {
        return null;
    }

    lastRun.time = await getTime(
        lastRun.startTime.timestamp,
        lastRun.endTime.timestamp,
        lastRun.penalty
    );

    const lastRuns = await prisma.time.findMany({
        where: {
            driverId: lastRun.driverId,
            NOT: {
                endTime: null,
            },
            active: true,
        },
        orderBy: {
            id: "desc",
        },
        include: {
            driver: true,
            vehicle: true,
            startTime: true,
            endTime: true,
        },
    });

    for (let i = 0; i < lastRuns.length; i++) {
        lastRuns[i].time = await getTime(
            lastRuns[i].startTime.timestamp,
            lastRuns[i].endTime.timestamp,
            lastRuns[i].penalty
        );
    }

    return { lastRun: lastRun, allDriverRuns: lastRuns };
}

async function fetchRankingData() {
    const times = await prisma.time.findMany({
        where: {
            active: true,
            NOT: {
                endTime: null,
            },
        },
        include: {
            startTime: true,
            endTime: true,
            vehicle: true,
            driver: true,
        },
    });

    if (times.length === 0) {
        return null; // Return null if no times are found
    }

    let bestTimes = new Map();

    for (let time of times) {
        let bestTime = bestTimes.get(time.driverId);

        const currentTime = getTime(
            time.startTime.timestamp,
            time.endTime.timestamp,
            time.penalty
        );

        if (!bestTime) {
            bestTimes.set(time.driverId, {
                time: currentTime,
                driver: time.driver,
                vehicle: time.vehicle,
                penalty: time.penalty,
                notes: time.notes,
            });
        } else {
            if (currentTime.time < bestTime.time.time) {
                bestTimes.set(time.driverId, {
                    time: currentTime,
                    driver: time.driver,
                    vehicle: time.vehicle,
                    penalty: time.penalty,
                    notes: time.notes,
                });
            }
        }
    }

    let ranking = Array.from(bestTimes.values()).sort(
        (a, b) => a.time.time - b.time.time
    );

    for (let i = 0; i < ranking.length; i++) {
        ranking[i].position = i + 1;
    }

    return { bestTimes: ranking };
}

async function fetchStandaloneData() {
    const lastTimestamps = await prisma.timeStamp.findMany({
        where: {
            active: true,
        },
        orderBy: {
            timestamp: "desc",
        },
        take: 4,
    });
    try {
        main = getTime(
            lastTimestamps[1].timestamp,
            lastTimestamps[0].timestamp
        ).formattedDriveTime;
    } catch {
        if (lastTimestamps.length == 0) {
            return;
        } else if (lastTimestamps.length == 1) {
            return { main: "--:--:---", sub1: "", sub2: "" };
        }
    }
    try {
        sub1 = getTime(
            lastTimestamps[2].timestamp,
            lastTimestamps[1].timestamp
        ).formattedDriveTime;
    } catch {
        return { main, sub1: "--:--:---", sub2: "" };
    }

    try {
        sub2 = getTime(
            lastTimestamps[3].timestamp,
            lastTimestamps[2].timestamp
        ).formattedDriveTime;
    } catch {
        return { main, sub1, sub2: "--:--:---" };
    }
    return { main, sub1, sub2 };
}

async function fetchOperationData() {
    await handleSerialPort();
    const timestamps = await runQuery(async (prisma) => {
        return prisma.timeStamp.findMany({
            where: {
                active: true,
            },
            orderBy: {
                id: "asc",
            },
        });
    });

    let drivers = await runQuery(async (prisma) => {
        return prisma.driver.findMany({
            orderBy: {
                active: "asc",
            },
            where: {
                active: { not: null },
            },
        });
    });

    const vehicles = await runQuery(async (prisma) => {
        return prisma.vehicle.findMany();
    });

    const timesStarted = await runQuery(async (prisma) => {
        return prisma.time.findMany({
            where: {
                endTime: null,
                active: true,
            },
            include: {
                startTime: true,
                driver: true,
                vehicle: true,
            },
        });
    });

    const timesEnded = await runQuery(async (prisma) => {
        return prisma.time.findMany({
            where: {
                NOT: {
                    endTime: null,
                },
                notes: null,
                active: true,
            },
            include: {
                startTime: true,
                endTime: true,
                driver: true,
                vehicle: true,
            },
        });
    });

    for (let time of timesEnded) {
        if (time.startTime && time.endTime) {
            const timeData = getTime(
                time.startTime.timestamp,
                time.endTime.timestamp
            );
            time.formattedDriveTime = timeData.formattedDriveTime;
        }
    }

    return {
        drivers: drivers,
        portOpened: portOpened,
        timestamps: timestamps,
        vehicles: vehicles,
        timesStarted: timesStarted,
        timesEnded: timesEnded,
    };
}

async function fetchPrismaStudioPort() {
    startPrismaStudio();
    return { dbPort: dbPort };
}

async function fetchTimeData() {
    const times = await prisma.time.findMany({
        where: {
            notes: null,
            active: true,
        },
        include: {
            startTime: true,
            endTime: true,
            driver: true,
            vehicle: true,
        },
    });
    const timestamps = await prisma.timeStamp.findMany({
        where: {
            active: true,
        },
    });
    return { times: times, timestamps: timestamps };
}

async function fetchSettingsData() {
    const activeDrivers = await prisma.driver.findMany({
        where: {
            active: { not: null },
        },
        orderBy: {
            active: "asc",
        },
    });

    const inactiveDrivers = await prisma.driver.findMany({
        where: {
            active: null,
        },
        orderBy: [
            {
                trainingGroup: "asc",
            },
            {
                firstName: "asc",
            },
        ],
    });

    const time = await prisma.time.findFirst({
        where: {
            active: true,
        },
    });

    const timeStamp = await prisma.timeStamp.findFirst({
        where: {
            active: true,
        },
    });

    const disableResetButton = time == null && timeStamp == null;

    return {
        activeDrivers: activeDrivers,
        inactiveDrivers: inactiveDrivers,
        disableResetButton: disableResetButton,
        displayMode: CONFIG.DISPLAY_MODE,
    };
}

async function fetchTimes() {
    const times = await prisma.time.findMany({
        where: {
            active: true,
            NOT: {
                endTime: null,
            },
        },
        include: {
            driver: true,
            vehicle: true,
            startTime: true,
            endTime: true,
        },
        orderBy: {
            id: "desc",
        },
    });

    for (let i = 0; i < times.length; i++) {
        times[i].time = await getTime(
            times[i].startTime.timestamp,
            times[i].endTime.timestamp,
            times[i].penalty
        );
    }

    return { times: times };
}

async function deleteTime(run) {
    await prisma.time.update({
        where: {
            id: run,
        },
        data: {
            active: false,
        },
    });
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
        await prisma.time.create({
            data: {
                driver: {
                    connect: {
                        id: driverId,
                    },
                },
                vehicle: {
                    connect: {
                        id: vehicleId,
                    },
                },
                startTime: {
                    connect: {
                        timestamp: timestamp,
                    },
                },
            },
        });
        await prisma.timeStamp.update({
            where: {
                timestamp: timestamp,
            },
            data: {
                active: false,
            },
        });

        await prisma.driver.update({
            where: {
                id: driverId,
            },
            data: {
                vehicle: {
                    connect: {
                        id: vehicleId,
                    },
                },
            },
        });

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
    const driverId = parseInt(req.body.driverId);

    const driver = await prisma.driver.findFirst({
        where: {
            id: driverId,
        },
        include: {
            vehicle: true,
        },
    });

    res.status(200).send(driver);
});

app.post("/save-run", async (req, res) => {
    const run = parseInt(req.body.run);
    const penalty = parseInt(req.body.penalty);
    var note = req.body.note;

    if (!note) {
        note = "👍🏼";
    }

    try {
        await prisma.time.update({
            where: {
                id: run,
            },
            data: {
                penalty: penalty,
                notes: note,
            },
        });
        res.status(200).send("Run saved");
    } catch (e) {
        console.error(e);
        res.status(500).send("Error saving run");
        return;
    }
});

app.post("/reset-data", async (req, res) => {
    try {
        await prisma.time.updateMany({
            data: {
                active: false,
            },
        });

        await prisma.timeStamp.updateMany({
            where: {
                active: true,
            },
            data: {
                active: false,
            },
        });

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
        await prisma.timeStamp.update({
            where: {
                timestamp: timestamp,
            },
            data: {
                active: false,
            },
        });
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
        await prisma.driver.updateMany({
            data: {
                active: null,
            },
        });

        for (let i = 0; i < drivers.length; i++) {
            await prisma.driver.update({
                where: {
                    id: parseInt(drivers[i]),
                },
                data: {
                    active: i,
                },
            });
        }
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
        await prisma.time.update({
            where: {
                id: run,
            },
            data: {
                endTime: {
                    connect: {
                        timestamp: timestamp,
                    },
                },
            },
        });
        await prisma.timeStamp.update({
            where: {
                timestamp: timestamp,
            },
            data: {
                active: false,
            },
        });
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
