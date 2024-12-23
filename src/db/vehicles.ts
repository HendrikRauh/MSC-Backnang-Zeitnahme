import { runQuery } from "./connector";

export { fetchVehicles };

async function fetchVehicles() {
    return await runQuery(async (prisma) => {
        return prisma.vehicle.findMany();
    });
}
