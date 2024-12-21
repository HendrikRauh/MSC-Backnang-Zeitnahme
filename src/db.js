import { PrismaClient } from "@prisma/client";
import { getTime, formatTimestamp } from "./utility.js";
import http from "http";
import { exec } from "child_process";

import dotenv from "dotenv";
const CONFIG = dotenv.config().parsed;

export function startDb() {
    const prisma = new PrismaClient({
        log: ["warn", "error"],
    });
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

export function startPrismaStudio() {
    const req = http.request(
        {
            hostname: "localhost",
            port: CONFIG.PRISMA_STUDIO_PORT,
        },
        (res) => {
            console.log(`Prisma Studio already running`);
        }
    );

    req.on("error", (e) => {
        console.log(`Prisma Studio not running, starting...`);
        exec(`npx prisma studio -p ${CONFIG.PRISMA_STUDIO_PORT} -b none`);
    });
}

/**
 * Generate demo timestamp for the database.
 */
export async function generateTimestamp() {
    const time = new Date();

    await prisma.timeStamp.create({
        data: {
            timestamp: time,
            friendly: formatTimestamp(time),
        },
    });
}

export async function fetchDefaultDisplayData() {
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

export async function fetchRankingData() {
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

        const currentTime = await getTime(
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

export async function fetchStandaloneData() {
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
        main = await getTime(
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
        sub1 = await getTime(
            lastTimestamps[2].timestamp,
            lastTimestamps[1].timestamp
        ).formattedDriveTime;
    } catch {
        return { main, sub1: "--:--:---", sub2: "" };
    }

    try {
        sub2 = await getTime(
            lastTimestamps[3].timestamp,
            lastTimestamps[2].timestamp
        ).formattedDriveTime;
    } catch {
        return { main, sub1, sub2: "--:--:---" };
    }
    return { main, sub1, sub2 };
}

export async function fetchOperationData() {
    // BUG: removed reconnect of serialport handler
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
            const timeData = await getTime(
                time.startTime.timestamp,
                time.endTime.timestamp
            );
            time.formattedDriveTime = timeData.formattedDriveTime;
        }
    }

    return {
        drivers: drivers,
        // BUG: portOpened missing
        // portOpened: portOpened,
        timestamps: timestamps,
        vehicles: vehicles,
        timesStarted: timesStarted,
        timesEnded: timesEnded,
    };
}

export async function fetchTimeData() {
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

export async function fetchSettingsData() {
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

export async function fetchTimes() {
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
        times[i].time = await await getTime(
            times[i].startTime.timestamp,
            times[i].endTime.timestamp,
            times[i].penalty
        );
    }

    return { times: times };
}

export async function deleteTime(run) {
    await prisma.time.update({
        where: {
            id: run,
        },
        data: {
            active: false,
        },
    });
}

export async function startRun(timestamp, driverId, vehicleId) {
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
}

export async function lastVehicle(driverId) {
    const driver = await prisma.driver.findFirst({
        where: {
            id: driverId,
        },
        include: {
            vehicle: true,
        },
    });

    return driver;
}

export async function saveRun(run, penalty, note) {
    await prisma.time.update({
        where: {
            id: run,
        },
        data: {
            penalty: penalty,
            notes: note,
        },
    });
}

export async function reset() {
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
}

export async function deleteTimestamp(timestamp) {
    await prisma.timeStamp.update({
        where: {
            timestamp: timestamp,
        },
        data: {
            active: false,
        },
    });
}

export async function saveDrivers(drivers) {
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
}

export async function endRun(run, timestamp) {
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
}

export async function createTimestamp(date) {
    prisma.timeStamp.create({
        data: {
            timestamp: date,
            friendly: formatTimestamp(date),
        },
    });
}