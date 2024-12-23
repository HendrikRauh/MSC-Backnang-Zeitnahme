import { formatTimestamp } from "../utility";
import { runQuery } from "./connector";

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
