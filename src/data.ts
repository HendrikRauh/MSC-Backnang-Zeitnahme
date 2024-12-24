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
import { deactivateTimestamp, fetchTimestamps } from "./db/timestamp";
import { fetchVehicles } from "./db/vehicles";
import { handleSerialPort, portOpened } from "./serialport";
import { fetchAllServerIpAddresses } from "./server";
import { calculateTime } from "./utility";

export {
    fetchDataForDisplayManual as fetchDataForDisplayDefault,
    fetchDataForOperation,
    fetchDataForRanking,
    fetchDataForSettings,
    fetchDataForStandalone,
    fetchDataForTimes,
};

async function fetchDataForDisplayManual() {
    const lastRun = await fetchLatestRun();

    console.log(lastRun);

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
    const timestamps = await fetchTimestamps();

    if (timestamps.length % 2 === 0) {
        var running = false;
    } else {
        var running = true;
    }

    if (timestamps.length > 1) {
        var time = calculateTime(
            timestamps[timestamps.length - 2 - (timestamps.length % 2)]
                .timestamp,
            timestamps[timestamps.length - 1 - (timestamps.length % 2)]
                .timestamp
        ).formattedDriveTime;

        if (timestamps.length > 3) {
            for (let i = 0; i < timestamps.length - 2; i++) {
                await deactivateTimestamp(timestamps[i].timestamp);
            }
        }
    } else {
        var time = "";
    }

    return {
        portOpened: portOpened,
        lastRun: time,
        running: running,
    };
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
        operationMode: CONFIG.OPERATION_MODE,
        ips: ipAddresses,
    };
}
