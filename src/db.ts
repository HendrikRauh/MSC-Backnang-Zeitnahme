import { PrismaClient } from "@prisma/client";
import { exec } from "child_process";
import http from "http";
import { CONFIG } from "./config";
import { handleSerialPort, portOpened } from "./serialport";
import { getAllServerIps } from "./server";
import { formatTimestamp, getTime } from "./utility";

const prisma = new PrismaClient({
    log: ["warn", "error"],
});

/**
 * Run a query using Prisma and handle the result.
 * @param query The query to run.
 * @returns The result of the query.
 * @throws If an error occurs during the query.
 */
async function runQuery<T>(
    query: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
    return query(prisma)
        .then((queryResult: T) => {
            return queryResult;
        })
        .catch(async (e: T) => {
            console.error(e);
            await prisma.$disconnect();
            process.exit(1);
        });
}

/**
 * Starts Prisma Studio if it is not already running.
 */
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
 * Generate timestamp for the database.
 */
export async function generateTimestamp() {
    const time = new Date();
    await createTimestamp(time);
}

async function getLastRun() {
    return await runQuery(async (prisma) => {
        return prisma.run.findFirst({
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
    });
}

async function getDriverRuns(driverId: number) {
    return await runQuery(async (prisma) => {
        return prisma.run.findMany({
            where: {
                driverId: driverId,
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
    });
}

/**
 * Fetches the data for the default display.
 * @returns The data for the default display.
 */
export async function fetchDefaultDisplayData() {
    const lastRun = await getLastRun();

    if (!lastRun) {
        return null; // Return null if no last run is found
    }

    type LastRunWithTime = typeof lastRun & {
        time: {
            time: Number;
            formattedDriveTime: String;
            formattedTotalTime: String;
        };
    };

    (lastRun as LastRunWithTime).time = getTime(
        lastRun.startTime.timestamp,
        lastRun.endTime!!.timestamp,
        lastRun.penalty ?? 0
    );

    const lastRunsOfDriver = (await getDriverRuns(
        lastRun.driverId
    )) as LastRunWithTime[];

    for (let i = 0; i < lastRunsOfDriver.length; i++) {
        lastRunsOfDriver[i].time = getTime(
            lastRunsOfDriver[i].startTime.timestamp,
            lastRunsOfDriver[i].endTime!!.timestamp,
            lastRunsOfDriver[i].penalty ?? 0
        );
    }

    return { lastRun: lastRun, allDriverRuns: lastRunsOfDriver };
}

async function getAllFinishedRuns() {
    return await runQuery(async (prisma) => {
        return prisma.run.findMany({
            where: {
                active: true,
                NOT: {
                    endTime: null,
                },
            },
            include: {
                startTime: true,
                endTime: true,
                driver: true,
                vehicle: true,
            },
        });
    });
}

/**
 * Fetches the data for the ranking display.
 * @returns The data for the ranking display.
 */
export async function fetchRankingData() {
    const times = await getAllFinishedRuns();

    if (times.length === 0) {
        return null;
    }

    let bestTimes = new Map();

    for (let time of times) {
        let bestTime = bestTimes.get(time.driverId);

        const currentTime = getTime(
            time.startTime.timestamp,
            time.endTime!!.timestamp,
            time.penalty ?? 0
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

/**
 * Fetches the data for the standalone display.
 * @returns The data for the standalone display.
 */
export async function fetchStandaloneData() {
    let main, sub1, sub2;
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
        const sub1 = getTime(
            lastTimestamps[2].timestamp,
            lastTimestamps[1].timestamp
        ).formattedDriveTime;
    } catch {
        return { main, sub1: "--:--:---", sub2: "" };
    }

    try {
        const sub2 = getTime(
            lastTimestamps[3].timestamp,
            lastTimestamps[2].timestamp
        ).formattedDriveTime;
    } catch {
        return { main, sub1, sub2: "--:--:---" };
    }
    return { main, sub1, sub2 };
}

async function getActiveTimestamps() {
    return await runQuery(async (prisma) => {
        return prisma.timeStamp.findMany({
            where: {
                active: true,
            },
            orderBy: {
                timestamp: "asc",
            },
        });
    });
}

async function getActiveDrivers() {
    return await runQuery(async (prisma) => {
        return prisma.driver.findMany({
            where: {
                active: { not: null },
            },
            orderBy: {
                active: "asc",
            },
        });
    });
}

async function getVehicles() {
    return await runQuery(async (prisma) => {
        return prisma.vehicle.findMany();
    });
}

async function getStartedRuns() {
    return await runQuery(async (prisma) => {
        return prisma.run.findMany({
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
}

async function getEndedUnsavedRuns() {
    return await runQuery(async (prisma) => {
        return prisma.run.findMany({
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
}

/**
 * Fetches the data for the operation view.
 * @returns The data for the operation view.
 */
export async function fetchOperationData() {
    handleSerialPort();

    const timestamps = await getActiveTimestamps();
    const drivers = await getActiveDrivers();
    const vehicles = await getVehicles();

    const timesStarted = await getStartedRuns();

    const timesEnded = await getEndedUnsavedRuns();

    for (let time of timesEnded) {
        if (time.startTime && time.endTime) {
            type TimeWithFormatted = typeof time & {
                formattedDriveTime: string;
            };

            const timeData = getTime(
                time.startTime.timestamp,
                time.endTime.timestamp
            );
            (time as TimeWithFormatted).formattedDriveTime =
                timeData.formattedDriveTime;
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

/**
 * fetches data for operation views refresh
 */
export async function fetchTimeData() {
    const startedRuns = await getStartedRuns();
    const endedRuns = await getEndedUnsavedRuns();

    const times = startedRuns.concat(endedRuns);

    const timestamps = await getActiveTimestamps();
    return { times: times, timestamps: timestamps };
}

async function getInactiveDrivers() {
    return await runQuery(async (prisma) => {
        return prisma.driver.findMany({
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
    });
}

async function hasDataToReset(): Promise<boolean> {
    const run = await prisma.run.findFirst({
        where: {
            active: true,
        },
    });

    const timeStamp = await prisma.timeStamp.findFirst({
        where: {
            active: true,
        },
    });

    return run != null || timeStamp != null;
}

/**
 * Fetches the data for the settings view.
 * @returns The data for the settings view.
 */
export async function fetchSettingsData() {
    const activeDrivers = await getActiveDrivers();
    const inactiveDrivers = await getInactiveDrivers();

    const disableResetButton = !(await hasDataToReset());

    const ipAddresses = getAllServerIps();

    return {
        activeDrivers: activeDrivers,
        inactiveDrivers: inactiveDrivers,
        disableResetButton: disableResetButton,
        displayMode: CONFIG.DISPLAY_MODE,
        ips: ipAddresses,
    };
}

async function getAllActiveTimes() {
    return await runQuery(async (prisma) => {
        return prisma.run.findMany({
            where: {
                active: true,
            },
            include: {
                driver: true,
                vehicle: true,
                startTime: true,
                endTime: true,
            },
        });
    });
}

/**
 * Fetches all active times
 * @returns All active times
 */
export async function fetchTimes() {
    const times = await getAllActiveTimes();

    for (let i = 0; i < times.length; i++) {
        const time = times[i];
        type Time = typeof time & { time: ReturnType<typeof getTime> };

        (time as Time).time = getTime(
            time.startTime.timestamp,
            time.endTime!!.timestamp,
            time.penalty ?? 0
        );
    }

    return { times: times };
}

/**
 * Deletes a given run from the database
 * @param run ID of the run to be deleted
 */
export async function deleteTime(run: number) {
    await runQuery(async (prisma) => {
        return prisma.run.updateMany({
            where: {
                id: run,
            },
            data: {
                active: false,
            },
        });
    });
}

/**
 * Starts a new run
 * @param timestamp start time of the run
 * @param driverId ID of the driver
 * @param vehicleId ID of the vehicle
 */
export async function startRun(
    timestamp: Date,
    driverId: number,
    vehicleId: number
) {
    await runQuery(async (prisma) => {
        return prisma.run.create({
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
    });

    await runQuery(async (prisma) => {
        return prisma.timeStamp.update({
            where: {
                timestamp: timestamp,
            },
            data: {
                active: false,
            },
        });
    });

    await runQuery(async (prisma) => {
        return prisma.driver.update({
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
    });
}

/**
 * Fetches the last vehicle of a driver
 * @param driverId ID of the driver
 * @returns The last vehicle of the driver
 */
export async function lastVehicle(driverId: number) {
    const driver = await runQuery(async (prisma) => {
        return prisma.driver.findFirst({
            where: {
                id: driverId,
            },
            include: {
                vehicle: true,
            },
        });
    });

    return driver;
}

/**
 * Saves the run with the given penalty and note
 * @param run ID of the run
 * @param penalty penalty seconds to add to the run
 * @param note note for the run
 */
export async function saveRun(run: number, penalty: number, note: string) {
    await runQuery(async (prisma) => {
        return prisma.run.update({
            where: {
                id: run,
            },
            data: {
                penalty: penalty,
                notes: note,
            },
        });
    });
}

/**
 * Resets the database, deactivating all runs and timestamps
 */
export async function reset() {
    await runQuery(async (prisma) => {
        return prisma.run.updateMany({
            data: {
                active: false,
            },
        });
    });

    await runQuery(async (prisma) => {
        return prisma.timeStamp.updateMany({
            where: {
                active: true,
            },
            data: {
                active: false,
            },
        });
    });
}

/**
 * Deletes the given timestamp
 * @param timestamp timestamp to delete
 */
export async function deleteTimestamp(timestamp: Date) {
    console.log("Deleting timestamp: " + timestamp);
    await runQuery(async (prisma) => {
        return prisma.timeStamp.update({
            where: {
                timestamp: timestamp,
            },
            data: {
                active: false,
            },
        });
    });
}

/**
 * Saves the given drivers, setting the active driver order
 * @param drivers drivers to save
 */
export async function saveDrivers(drivers: string | any[]) {
    await runQuery(async (prisma) => {
        return prisma.driver.updateMany({
            data: {
                active: null,
            },
        });
    });

    for (let i = 0; i < drivers.length; i++) {
        await runQuery(async (prisma) => {
            return prisma.driver.update({
                where: {
                    id: parseInt(drivers[i]),
                },
                data: {
                    active: i,
                },
            });
        });
    }
}

/**
 * Ends the given run with the given timestamp
 * @param run ID of the run
 * @param timestamp end time of the run
 */
export async function endRun(run: number, timestamp: Date) {
    await runQuery(async (prisma) => {
        return prisma.run.update({
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
    });

    await runQuery(async (prisma) => {
        return prisma.timeStamp.update({
            where: {
                timestamp: timestamp,
            },
            data: {
                active: false,
            },
        });
    });
}

/**
 * Creates a new timestamp in the database
 * @param date timestamp to create
 */
export async function createTimestamp(date: Date) {
    await runQuery(async (prisma) => {
        return prisma.timeStamp.create({
            data: {
                timestamp: date,
                friendly: formatTimestamp(date),
            },
        });
    });
}
