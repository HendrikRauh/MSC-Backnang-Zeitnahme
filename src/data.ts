import { CONFIG } from "./config";
import { hasDataToReset } from "./db/connector";
import { fetchActiveDrivers, fetchInactiveDrivers } from "./db/driver";
import {
    fetchAllRunsByDriverId,
    fetchFinishedRuns,
    fetchLatestRun,
    fetchStartedRuns,
    fetchUnsavedRuns,
} from "./db/run";
import {
    fetchLatestTimestamps as fetchLastTimestamps,
    fetchTimestamps,
} from "./db/timestamp";
import { fetchVehicles } from "./db/vehicles";
import { handleSerialPort, portOpened } from "./serialport";
import { fetchAllServerIpAddresses } from "./server";
import { calculateTime } from "./utility";

export {
    fetchDataForDisplayDefault,
    fetchDataForOperation,
    fetchDataForRanking,
    fetchDataForSettings,
    fetchDataForStandalone,
    fetchDataForTimes,
};

async function fetchDataForDisplayDefault() {
    const lastRun = await fetchLatestRun();

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

    (lastRun as LastRunWithTime).time = calculateTime(
        lastRun.startTime.timestamp,
        lastRun.endTime!!.timestamp,
        lastRun.penalty ?? 0
    );

    const lastRunsOfDriver = (await fetchAllRunsByDriverId(
        lastRun.driverId
    )) as LastRunWithTime[];

    for (let i = 0; i < lastRunsOfDriver.length; i++) {
        lastRunsOfDriver[i].time = calculateTime(
            lastRunsOfDriver[i].startTime.timestamp,
            lastRunsOfDriver[i].endTime!!.timestamp,
            lastRunsOfDriver[i].penalty ?? 0
        );
    }

    return { lastRun: lastRun, allDriverRuns: lastRunsOfDriver };
}

async function fetchDataForTimes() {
    const times = await fetchFinishedRuns();

    for (let i = 0; i < times.length; i++) {
        const time = times[i];
        type Time = typeof time & { time: ReturnType<typeof calculateTime> };

        (time as Time).time = calculateTime(
            time.startTime.timestamp,
            time.endTime!!.timestamp,
            time.penalty ?? 0
        );
    }

    return { times: times };
}

async function fetchDataForStandalone() {
    let main, sub1, sub2;
    const lastTimestamps = await fetchLastTimestamps(4);
    try {
        main = calculateTime(
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
        const sub1 = calculateTime(
            lastTimestamps[2].timestamp,
            lastTimestamps[1].timestamp
        ).formattedDriveTime;
    } catch {
        return { main, sub1: "--:--:---", sub2: "" };
    }

    try {
        const sub2 = calculateTime(
            lastTimestamps[3].timestamp,
            lastTimestamps[2].timestamp
        ).formattedDriveTime;
    } catch {
        return { main, sub1, sub2: "--:--:---" };
    }
    return { main, sub1, sub2 };
}

async function fetchDataForRanking() {
    const times = await fetchFinishedRuns();

    if (times.length === 0) {
        return null;
    }

    let bestTimes = new Map();

    for (let time of times) {
        let bestTime = bestTimes.get(time.driverId);

        const currentTime = calculateTime(
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

async function fetchDataForOperation() {
    handleSerialPort();

    const timestamps = await fetchTimestamps();
    const drivers = await fetchActiveDrivers();
    const vehicles = await fetchVehicles();

    const timesStarted = await fetchStartedRuns();

    const timesEnded = await fetchUnsavedRuns();

    for (let time of timesEnded) {
        if (time.startTime && time.endTime) {
            type TimeWithFormatted = typeof time & {
                formattedDriveTime: string;
            };

            const timeData = calculateTime(
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

async function fetchDataForSettings() {
    const activeDrivers = await fetchActiveDrivers();
    const inactiveDrivers = await fetchInactiveDrivers();

    const disableResetButton = !(await hasDataToReset());

    const ipAddresses = fetchAllServerIpAddresses();

    return {
        activeDrivers: activeDrivers,
        inactiveDrivers: inactiveDrivers,
        disableResetButton: disableResetButton,
        displayMode: CONFIG.DISPLAY_MODE,
        ips: ipAddresses,
    };
}
