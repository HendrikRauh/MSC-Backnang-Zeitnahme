import { PrismaClient } from "@prisma/client";
import { exec } from "child_process";
import http from "http";
import { CONFIG } from "./config";
import { formatTimestamp } from "./utility";

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

export async function getLastRun() {
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

export async function getDriverRuns(driverId: number) {
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

export async function getAllFinishedRuns() {
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

export async function getLastTimestamps(amount: number) {
    return await runQuery(async (prisma) => {
        return prisma.timeStamp.findMany({
            where: {
                active: true,
            },
            orderBy: {
                timestamp: "desc",
            },
            take: amount,
        });
    });
}

export async function getActiveTimestamps() {
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

export async function getActiveDrivers() {
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

export async function getVehicles() {
    return await runQuery(async (prisma) => {
        return prisma.vehicle.findMany();
    });
}

export async function getStartedRuns() {
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

export async function getEndedUnsavedRuns() {
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

export async function getInactiveDrivers() {
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

export async function hasDataToReset(): Promise<boolean> {
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

export async function getAllActiveTimes() {
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
 * Deletes a given run from the database
 * @param run ID of the run to be deleted
 */
export async function deactivateRun(run: number) {
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
export async function deactivateTimestamp(timestamp: Date) {
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
