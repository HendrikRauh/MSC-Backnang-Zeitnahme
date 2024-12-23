import { PrismaClient } from "@prisma/client";
import { exec } from "child_process";
import http from "http";
import { CONFIG } from "../config";

const prisma = new PrismaClient({
    log: ["warn", "error"],
});

/**
 * Run a query using Prisma and handle the result.
 * @param query The query to run.
 * @returns The result of the query.
 * @throws If an error occurs during the query.
 */
export async function runQuery<T>(
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

export async function getVehicles() {
    return await runQuery(async (prisma) => {
        return prisma.vehicle.findMany();
    });
}

export async function hasDataToReset(): Promise<boolean> {
    const run = await runQuery(async (prisma) => {
        prisma.run.findFirst({
            where: {
                active: true,
            },
        });
    });

    const timeStamp = await runQuery(async (prisma) => {
        prisma.timeStamp.findFirst({
            where: {
                active: true,
            },
        });
    });

    return run != null || timeStamp != null;
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
 * Resets the database, deactivating all runs and timestamps
 */
export async function disableActiveEntries() {
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
