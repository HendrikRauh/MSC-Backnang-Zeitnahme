import { runQuery } from "./connector";

export {
    deactivateRun,
    endRun,
    fetchAllRunsByDriverId,
    fetchFinishedRuns,
    fetchLatestRun,
    fetchStartedRuns,
    fetchUnsavedRuns,
    saveRun,
    startRun,
};

async function fetchStartedRuns() {
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

async function fetchUnsavedRuns() {
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

async function fetchLatestRun() {
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

async function fetchAllRunsByDriverId(driverId: number) {
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

async function deactivateRun(run: number) {
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

async function startRun(
    timestampId: number,
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
                        id: timestampId,
                    },
                },
            },
        });
    });

    await runQuery(async (prisma) => {
        return prisma.timeStamp.update({
            where: {
                id: timestampId,
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

async function saveRun(run: number, penalty: number, note: string) {
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

async function endRun(run: number, timestampId: number) {
    await runQuery(async (prisma) => {
        return prisma.run.update({
            where: {
                id: run,
            },
            data: {
                endTime: {
                    connect: {
                        id: timestampId,
                    },
                },
            },
        });
    });

    await runQuery(async (prisma) => {
        return prisma.timeStamp.update({
            where: {
                id: timestampId,
            },
            data: {
                active: false,
            },
        });
    });
}

async function fetchFinishedRuns() {
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
