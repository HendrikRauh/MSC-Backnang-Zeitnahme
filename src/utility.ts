/**
 * Calculates the time between two timestamps and formats it as a string.
 * @param {string} startTime The start time as a string.
 * @param {string} endTime The end time as a string.
 * @param {number} penalty The penalty time in seconds.
 */
export function getTime(startTime, endTime, penalty = 0) {
    console.log(
        `Calculating time with startTime: ${startTime}, endTime: ${endTime}, penalty: ${penalty}`
    );
    startTime = new Date(startTime).getTime();
    endTime = new Date(endTime).getTime();

    const driveTime = endTime - startTime;

    let formattedDriveTime = formatDuration(driveTime);

    let formattedTotalTime = formatDuration(driveTime + penalty * 1000);

    console.log(
        `Calculated time: ${driveTime}, formattedDriveTime: ${formattedDriveTime}, formattedTotalTime: ${formattedTotalTime}`
    );
    return {
        time: driveTime,
        formattedDriveTime: formattedDriveTime,
        formattedTotalTime: formattedTotalTime,
    };
}

/**
 * Formats a duration in milliseconds as a string.
 * @param {number} durationMs The duration in milliseconds.
 * @returns {string} The formatted duration as a string.
 */
export function formatDuration(durationMs) {
    console.log(`Formatting duration: ${durationMs}`);
    let formattedString = "";

    const totalSeconds = Math.floor(durationMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor(durationMs % 1000);

    if (hours > 0) {
        formattedString += String(hours).padStart(2, "0") + ":";
    }

    if (minutes > 0 || hours > 0) {
        formattedString += String(minutes).padStart(2, "0") + ":";
    }

    formattedString += String(seconds).padStart(2, "0");
    formattedString += "," + String(milliseconds).padStart(3, "0");

    console.log(`Formatted duration: ${formattedString}`);
    return formattedString;
}

/**
 * Formats a timestamp as a string.
 * @param {Date} timestamp The timestamp to format.
 * @returns {string} The formatted timestamp as a string.
 */
export function formatTimestamp(timestamp) {
    console.log(`Formatting timestamp: ${timestamp}`);
    return timestamp.toLocaleTimeString("de-de", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        fractionalSecondDigits: 3,
    });
}
