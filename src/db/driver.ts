import { runQuery } from "./connector";

export {
    fetchActiveDrivers,
    fetchAllTrainingGroups,
    fetchInactiveDrivers,
    fetchLastVehicleByDriverId,
    insertDriver,
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
    return await runQuery(async (prisma) => {
        return prisma.driver.findFirst({
            where: {
                id: driverId,
            },
            include: {
                vehicle: true,
            },
        });
    });
}

async function fetchAllTrainingGroups() {
    return await runQuery(async (prisma) => {
        const drivers = await prisma.driver.findMany({
            distinct: ["trainingGroup"],
            orderBy: {
                trainingGroup: "asc",
            },
        });
        return drivers.map((driver) => driver.trainingGroup);
    });
}

async function driverExists(firstName: string, lastName: string) {
    const driver = await runQuery(async (prisma) => {
        return prisma.driver.findFirst({
            where: {
                firstName,
                lastName,
            },
        });
    });
    return driver !== null;
}

async function insertDriver(
    firstName: string,
    lastName: string,
    drivingClass: string,
    birthYear: number | null,
    trainingGroup: string
) {
    const exists = await driverExists(firstName, lastName);
    if (exists) {
        console.warn(`${firstName} ${lastName} already exists`);
        return;
    }
    return await runQuery(async (prisma) => {
        return prisma.driver.create({
            data: {
                firstName,
                lastName,
                drivingClass,
                birthYear,
                trainingGroup,
            },
        });
    });
}
