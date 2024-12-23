import { formatTimestamp } from "../utility";
import { runQuery } from "./connector";

/**
 * Generate timestamp for the database.
 */
export async function generateTimestamp() {
    const time = new Date();
    await createTimestamp(time);
}

export async function fetchLatestTimestamps(amount: number) {
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

export async function fetchTimestamps() {
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
