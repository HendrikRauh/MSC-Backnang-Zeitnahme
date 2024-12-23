var lastCloseTime = null;
// file deepcode ignore UseSecureWebsockets: <please specify a reason of ignoring this>
const socket = new WebSocket("ws://" + window.location.host);
socket.addEventListener("message", (event) => {
    if (event.data === "reload") {
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
        document.body.style.backgroundColor = "orangered";
    }
    lastCloseTime = Date.now();
});
