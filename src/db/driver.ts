import { runQuery } from "./connector";

export async function fetchActiveDrivers() {
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

export async function fetchInactiveDrivers() {
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

/**
 * Saves the given drivers, setting the active driver order
 * @param drivers drivers to save
 */
export async function setDriversActiveState(drivers: string | any[]) {
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
 * Fetches the last vehicle of a driver
 * @param driverId ID of the driver
 * @returns The last vehicle of the driver
 */
export async function fetchLastVehicleByDriverId(driverId: number) {
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
