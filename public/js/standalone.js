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
    if (!startTimeAttribute) {
        return;
    }

    const startTime = new Date(startTimeAttribute);

    function updateTimer() {
        const currentTime = Date.now();

        const elapsedTime = currentTime - startTime;

        const totalSeconds = Math.floor(elapsedTime / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const formattedTime = `🔴 ${pad(hours)}:${pad(minutes % 60)}:${pad(
            seconds % 60
        )} 🔴`;

        runningElement.textContent = formattedTime;
    }

    function pad(num) {
        return num.toString().padStart(2, "0");
    }

    updateTimer();
    setInterval(updateTimer, 1000);
}

document.addEventListener("DOMContentLoaded", startTimer);
