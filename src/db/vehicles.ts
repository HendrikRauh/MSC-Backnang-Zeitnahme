import { runQuery } from "./connector";

export async function fetchVehicles() {
    return await runQuery(async (prisma) => {
        return prisma.vehicle.findMany();
    });
}
