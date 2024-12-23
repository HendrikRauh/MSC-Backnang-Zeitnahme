import { formatTimestamp } from "../utility";
import { runQuery } from "./connector";

export {
    createTimestamp,
    deactivateTimestamp,
    fetchLatestTimestamps,
    fetchTimestamps,
    generateTimestamp,
};

async function generateTimestamp() {
    const time = new Date();
    await createTimestamp(time);
}

async function fetchLatestTimestamps(amount: number) {
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

async function fetchTimestamps() {
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

async function deactivateTimestamp(timestamp: Date) {
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

async function createTimestamp(date: Date) {
    await runQuery(async (prisma) => {
        return prisma.timeStamp.create({
            data: {
                timestamp: date,
                friendly: formatTimestamp(date),
            },
        });
    });
}
