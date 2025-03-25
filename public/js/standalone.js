var lastCloseTime = null;

const socket = new WebSocket("ws://" + window.location.host);
socket.addEventListener("message", (event) => {
    if (event.data === "reload" || event.data === "disconnect") {
        console.log("Reloading page...");
        location.reload();
    }
});

window.addEventListener("beforeunload", (event) => {
    lastCloseTime = Date.now();
    socket.close();
});

socket.addEventListener("close", (event) => {
    if (Date.now() - lastCloseTime > 3000) {
        document.body.style.backgroundColor = "var(--color-orange)";
    }
    lastCloseTime = Date.now();
});

addEventListener("DOMContentLoaded", async () => {
    document.getElementById("reconnect").addEventListener("click", () => {
        fetch("/reconnect", {
            method: "POST",
        });
    });
});

function startTimer() {
    const runningElement = document.getElementById("running");
    if (!runningElement) return;

    const startTimeAttribute = runningElement.getAttribute("data-start-time");
    if (!startTimeAttribute) return;

    const startTime = new Date(startTimeAttribute);

    function updateTimer() {
        const currentTime = Date.now();

        const elapsedTime = Math.floor(currentTime - startTime);

        // accounting for delay with 200ms
        const totalMilliseconds = elapsedTime - 200;
        const hours = Math.floor(totalMilliseconds / 3600000);
        const minutes = Math.floor((totalMilliseconds % 3600000) / 60000);
        const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
        const milliseconds = Math.floor((totalMilliseconds % 1000) / 100);

        let formattedTime = `🔴 ${pad(hours)}:${pad(minutes % 60)}:${pad(
            seconds % 60
        )},${milliseconds} 🔴`;

        if (hours == 0) {
            formattedTime = `🔴 ${pad(minutes % 60)}:${pad(
                seconds % 60
            )},${milliseconds} 🔴`;
        }
        if (minutes == 0 && hours == 0) {
            formattedTime = `🔴 ${pad(seconds % 60)},${milliseconds} 🔴`;
        }

        runningElement.textContent = formattedTime;
    }

    function pad(num) {
        return num.toString().padStart(2, "0");
    }

    updateTimer();
    setInterval(updateTimer, 100);
}

document.addEventListener("DOMContentLoaded", startTimer);
