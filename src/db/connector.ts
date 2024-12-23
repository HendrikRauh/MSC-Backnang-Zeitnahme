import { PrismaClient } from "@prisma/client";
import { exec } from "child_process";
import http from "http";
import { CONFIG } from "../config";

export { disableActiveEntries, hasDataToReset, runQuery, startPrismaStudio };

const prisma = new PrismaClient({
    log: ["warn", "error"],
});

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

function startPrismaStudio() {
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

async function hasDataToReset(): Promise<boolean> {
    const run = await runQuery(async (prisma) => {
        return prisma.run.findFirst({
            where: {
                active: true,
            },
        });
    });

    const timeStamp = await runQuery(async (prisma) => {
        return prisma.timeStamp.findFirst({
            where: {
                active: true,
            },
        });
    });

    return run != null || timeStamp != null;
}

async function disableActiveEntries() {
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
