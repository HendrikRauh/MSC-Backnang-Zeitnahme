import fs from "fs";
import { insertDriver } from "./driver";

type Driver = {
    firstName: string;
    lastName: string;
    drivingClass: string;
    birthYear: number | null;
    trainingGroup: string;
};

async function importDriverCSV(file: string) {
    file = `${__dirname}/../../${file}`;
    const fileContent = fs.readFileSync(file, "utf-8");
    const drivers: Driver[] = [];
    const lines = fileContent.split("\n");
    for (const line of lines) {
        const [firstName, lastName, drivingClass, birthYear, trainingGroup] =
            line.split(",");
        if (firstName && lastName && drivingClass && trainingGroup) {
            drivers.push({
                firstName,
                lastName,
                drivingClass,
                birthYear: birthYear ? parseInt(birthYear) : null,
                trainingGroup: trainingGroup,
            });
        }
    }
    for (const driver of drivers) {
        console.log(
            `Inserting ${driver.firstName} ${driver.lastName}, born in ${driver.birthYear} (${driver.drivingClass}) in group ${driver.trainingGroup}`
        );
        await insertDriver(
            driver.firstName,
            driver.lastName,
            driver.drivingClass,
            driver.birthYear,
            driver.trainingGroup
        );
    }
}

importDriverCSV("import.csv");
