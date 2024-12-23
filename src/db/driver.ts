import { runQuery } from "./connector";

export {
    fetchActiveDrivers,
    fetchInactiveDrivers,
    fetchLastVehicleByDriverId,
    setDriversActiveState,
};

async function fetchActiveDrivers() {
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

async function fetchInactiveDrivers() {
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

async function setDriversActiveState(drivers: string | any[]) {
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

async function fetchLastVehicleByDriverId(driverId: number) {
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
