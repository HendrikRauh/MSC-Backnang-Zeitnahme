import { runQuery } from "./connector";

export async function getVehicles() {
    return await runQuery(async (prisma) => {
        return prisma.vehicle.findMany();
    });
}
