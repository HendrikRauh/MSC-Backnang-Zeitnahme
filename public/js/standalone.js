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
