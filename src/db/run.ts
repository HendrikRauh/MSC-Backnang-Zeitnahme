import { runQuery } from "./connector";

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
