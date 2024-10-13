const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const drivers = JSON.parse(
    fs.readFileSync(path.join(__dirname, "insertDriversFromFile.json"), "utf-8")
);

async function main() {
    // clear the database table
    await prisma.driver.deleteMany();

    for (let driver of drivers) {
        console.log(`Inserting driver with id: ${driver.id}`);
        await prisma.driver.create({
            data: {
                id: driver.id,
                firstName: driver.firstName,
                lastName: driver.lastName,
                drivingClass: driver.drivingClass,
                trainingGroup: driver.trainingGroup,
            },
        });
    }
}

main();
