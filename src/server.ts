import express, { Request, Response } from "express";
import session from "express-session";
import helmet from "helmet";
import http from "http";
import { networkInterfaces } from "os";
import path from "path";
import { WebSocketServer } from "ws";
import { CONFIG } from "./config";
import {
    fetchDataForDisplayDefault,
    fetchDataForOperation,
    fetchDataForRanking,
    fetchDataForSettings,
    fetchDataForStandalone,
    fetchDataForTimes,
} from "./data";
import { disableActiveEntries, startPrismaStudio } from "./db/connector";
import { fetchLastVehicleByDriverId, setDriversActiveState } from "./db/driver";
import { deactivateRun, endRun, saveRun, startRun } from "./db/run";
import { deactivateTimestamp, generateTimestamp } from "./db/timestamp";

/**
 * Gets all the IPv4 addresses of the server.
 * @returns A promise that resolves to an array of IPv4 server IP addresses.
 */
export async function fetchAllServerIpAddresses(): Promise<string[]> {
    const nets = networkInterfaces();
    const results: string[] = [];

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]!) {
            // Skip over non-IPv4 and internal (i.e., 127.0.0.1) addresses
            if (net.family === "IPv4" && !net.internal) {
                results.push(net.address);
            }
        }
    }

    return results;
}

/**
 * Send a message to all connected websockets.
 * @param message The message to send.
 */
export async function websocketSend(message: string) {
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

app.use(async (req, res, next) => {
    const serverIps = await fetchAllServerIpAddresses();
    helmet({
        contentSecurityPolicy: {
            useDefaults: false,
            directives: {
                "default-src": ["'self'", ...serverIps],
                "worker-src": ["'self'", "blob:", ...serverIps],
                "img-src": ["'self'", "data:", ...serverIps],
                "frame-src": ["'self'", "*"],
            },
        },
    })(req, res, next);
});

app.get("/", renderView("home"));

app.get("/display", async (req, res) => {
    const displayMode = CONFIG.DISPLAY_MODE; // Fetch the current display mode from your config or another source

    try {
        let data;
        let templateName;

        switch (displayMode) {
            case "default":
                data = await fetchDataForDisplayDefault();
                templateName = "display/default";
                break;
            case "ranking":
                data = await fetchDataForRanking();
                templateName = "display/ranking";
                break;
            case "standalone":
                data = await fetchDataForStandalone();
                templateName = "display/standalone";
                break;
            default:
                res.status(400).send("Unsupported display mode");
                return;
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

app.get("/operation", fetchDataAndRender("operation", fetchDataForOperation));

app.get("/database", fetchDataAndRender("database", fetchPrismaStudioPort));

app.get("/times", fetchDataAndRender("times", fetchDataForTimes));

app.get("/settings", fetchDataAndRender("settings", fetchDataForSettings));

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
        await deactivateRun(run);
        res.status(200).send("Time deleted");
    } catch (e) {
        console.error(e);
        res.status(500).send("Error deleting run");
        return;
    }
});

app.post("/get-vehicle-for-driver", async (req, res) => {
    let vehicle = fetchLastVehicleByDriverId(parseInt(req.body.driverId));
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
        disableActiveEntries();
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
        deactivateTimestamp(timestamp);
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
        setDriversActiveState(drivers);
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
    console.log(`Server is running on port ${CONFIG.PORT}`);
});

/**
 * Renders a view with the specified name.
 * @param viewName Name of the pug file to render
 * @returns A function that renders the specified view
 */
function renderView(viewName: string) {
    return (req: Request, res: Response) => {
        res.render(viewName);
    };
}

/**
 * Fetches data using the provided query function and renders the specified view with the data.
 * @param viewName Name of the pug file to render
 * @param queryFn Function that returns a promise that resolves to the data to render
 * @returns A function that fetches the data and renders the specified view
 */
function fetchDataAndRender(viewName: string, queryFn: () => Promise<any>) {
    return async (_req: Request, res: Response) => {
        try {
            const data = await queryFn();
            res.render(viewName, data);
        } catch (err) {
            console.error(err);
            res.status(500).send(`Error fetching data for ${viewName}`);
        }
    };
}

/**
 * Fetches the port for Prisma Studio and starts it.
 * @returns A promise that resolves to an object containing the port for Prisma Studio.
 */
async function fetchPrismaStudioPort(): Promise<{ dbPort: string }> {
    startPrismaStudio();
    return { dbPort: CONFIG.PRISMA_STUDIO_PORT };
}
