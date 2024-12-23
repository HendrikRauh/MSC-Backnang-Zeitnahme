import { CONFIG } from "./config";
import { hasDataToReset } from "./db/connector";
import { getActiveDrivers, getInactiveDrivers } from "./db/driver";
import {
    getAllActiveTimes,
    getAllFinishedRuns,
    getDriverRuns,
    getEndedUnsavedRuns,
    getLastRun,
    getStartedRuns,
} from "./db/run";
import { getActiveTimestamps, getLastTimestamps } from "./db/timestamp";
import { getVehicles } from "./db/vehicles";
import { handleSerialPort, portOpened } from "./serialport";
import { getAllServerIps } from "./server";
import { getTime } from "./utility";

/**
 * Fetches the data for the default display.
 * @returns The data for the default display.
 */
export async function fetchDefaultDisplayData() {
    const lastRun = await getLastRun();

    if (!lastRun) {
        return null; // Return null if no last run is found
    }

    type LastRunWithTime = typeof lastRun & {
        time: {
            time: Number;
            formattedDriveTime: String;
            formattedTotalTime: String;
        };
    };

    (lastRun as LastRunWithTime).time = getTime(
        lastRun.startTime.timestamp,
        lastRun.endTime!!.timestamp,
        lastRun.penalty ?? 0
    );

    const lastRunsOfDriver = (await getDriverRuns(
        lastRun.driverId
    )) as LastRunWithTime[];

    for (let i = 0; i < lastRunsOfDriver.length; i++) {
        lastRunsOfDriver[i].time = getTime(
            lastRunsOfDriver[i].startTime.timestamp,
            lastRunsOfDriver[i].endTime!!.timestamp,
            lastRunsOfDriver[i].penalty ?? 0
        );
    }

    return { lastRun: lastRun, allDriverRuns: lastRunsOfDriver };
}

/**
 * Fetches all active times
 * @returns All active times
 */
export async function fetchTimes() {
    const times = await getAllActiveTimes();

    for (let i = 0; i < times.length; i++) {
        const time = times[i];
        type Time = typeof time & { time: ReturnType<typeof getTime> };

        (time as Time).time = getTime(
            time.startTime.timestamp,
            time.endTime!!.timestamp,
            time.penalty ?? 0
        );
    }

    return { times: times };
}

/**
 * Fetches the data for the standalone display.
 * @returns The data for the standalone display.
 */
export async function fetchStandaloneData() {
    let main, sub1, sub2;
    const lastTimestamps = await getLastTimestamps(4);
    try {
        main = getTime(
            lastTimestamps[1].timestamp,
            lastTimestamps[0].timestamp
        ).formattedDriveTime;
    } catch {
        if (lastTimestamps.length == 0) {
            return;
        } else if (lastTimestamps.length == 1) {
            return { main: "--:--:---", sub1: "", sub2: "" };
        }
    }
    try {
        const sub1 = getTime(
            lastTimestamps[2].timestamp,
            lastTimestamps[1].timestamp
        ).formattedDriveTime;
    } catch {
        return { main, sub1: "--:--:---", sub2: "" };
    }

    try {
        const sub2 = getTime(
            lastTimestamps[3].timestamp,
            lastTimestamps[2].timestamp
        ).formattedDriveTime;
    } catch {
        return { main, sub1, sub2: "--:--:---" };
    }
    return { main, sub1, sub2 };
}

/**
 * Fetches the data for the ranking display.
 * @returns The data for the ranking display.
 */
export async function fetchRankingData() {
    const times = await getAllFinishedRuns();

    if (times.length === 0) {
        return null;
    }

    let bestTimes = new Map();

    for (let time of times) {
        let bestTime = bestTimes.get(time.driverId);

        const currentTime = getTime(
            time.startTime.timestamp,
            time.endTime!!.timestamp,
            time.penalty ?? 0
        );

        if (!bestTime) {
            bestTimes.set(time.driverId, {
                time: currentTime,
                driver: time.driver,
                vehicle: time.vehicle,
                penalty: time.penalty,
                notes: time.notes,
            });
        } else {
            if (currentTime.time < bestTime.time.time) {
                bestTimes.set(time.driverId, {
                    time: currentTime,
                    driver: time.driver,
                    vehicle: time.vehicle,
                    penalty: time.penalty,
                    notes: time.notes,
                });
            }
        }
    }

    let ranking = Array.from(bestTimes.values()).sort(
        (a, b) => a.time.time - b.time.time
    );

    for (let i = 0; i < ranking.length; i++) {
        ranking[i].position = i + 1;
    }

    return { bestTimes: ranking };
}

/**
 * Fetches the data for the operation view.
 * @returns The data for the operation view.
 */
export async function fetchOperationData() {
    handleSerialPort();

    const timestamps = await getActiveTimestamps();
    const drivers = await getActiveDrivers();
    const vehicles = await getVehicles();

    const timesStarted = await getStartedRuns();

    const timesEnded = await getEndedUnsavedRuns();

    for (let time of timesEnded) {
        if (time.startTime && time.endTime) {
            type TimeWithFormatted = typeof time & {
                formattedDriveTime: string;
            };

            const timeData = getTime(
                time.startTime.timestamp,
                time.endTime.timestamp
            );
            (time as TimeWithFormatted).formattedDriveTime =
                timeData.formattedDriveTime;
        }
    }

    return {
        drivers: drivers,
        portOpened: portOpened,
        timestamps: timestamps,
        vehicles: vehicles,
        timesStarted: timesStarted,
        timesEnded: timesEnded,
    };
}

/**
 * fetches data for operation views refresh
 */
export async function fetchTimeData() {
    const startedRuns = await getStartedRuns();
    const endedRuns = await getEndedUnsavedRuns();

    const times = startedRuns.concat(endedRuns);

    const timestamps = await getActiveTimestamps();
    return { times: times, timestamps: timestamps };
}

/**
 * Fetches the data for the settings view.
 * @returns The data for the settings view.
 */
export async function fetchSettingsData() {
    const activeDrivers = await getActiveDrivers();
    const inactiveDrivers = await getInactiveDrivers();

    const disableResetButton = !(await hasDataToReset());

    const ipAddresses = getAllServerIps();

    return {
        activeDrivers: activeDrivers,
        inactiveDrivers: inactiveDrivers,
        disableResetButton: disableResetButton,
        displayMode: CONFIG.DISPLAY_MODE,
        ips: ipAddresses,
    };
}
