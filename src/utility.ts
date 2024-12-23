/**
 * @param startTime start time of the run
 * @param endTime end time of the run
 * @param penalty penalty seconds to add to the run
 * @returns object with time, formattedDriveTime and formattedTotalTime
 */
// In src/utility.ts

export function getTime(
    startTime: Date,
    endTime: Date,
    penalty = 0
): {
    time: number;
    formattedDriveTime: string;
    formattedTotalTime: string;
} {
    const driveTime = endTime.getTime() - startTime.getTime();

    let formattedDriveTime = formatDuration(driveTime);
    let formattedTotalTime = formatDuration(driveTime + penalty * 1000);

    return {
        time: driveTime,
        formattedDriveTime: formattedDriveTime,
        formattedTotalTime: formattedTotalTime,
    };
}

/**
 * Formats a duration in milliseconds as a string.
 * @param durationMs The duration in milliseconds.
 * @returns The formatted duration as a string.
 */
export function formatDuration(durationMs: number): string {
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

    return formattedString;
}

/**
 * Formats a timestamp as a string.
 * @param timestamp The timestamp to format.
 * @returns The formatted timestamp as a string.
 */
export function formatTimestamp(timestamp: Date) {
    return timestamp.toLocaleTimeString("de-de", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        fractionalSecondDigits: 3,
    });
}
