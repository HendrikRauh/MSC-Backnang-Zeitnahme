// when dom content loaded set the src of the iframe database to window.location.hostname port 5555
// file deepcode ignore UseSecureWebsockets: <please specify a reason of ignoring this>
const socket = new WebSocket(`ws://${window.location.host}`);

socket.addEventListener("open", () => {
    console.log("WebSocket Client Connected");
});

socket.addEventListener("message", (event) => {
    console.log("🚀 ~ socket.addEventListener ~ event:", event);
    if (event.data === "reload") {
        refreshData();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const dbPort = document.getElementById("dbPort").innerText;
    const databaseIframe = document.getElementById("database");
    databaseIframe.src = `http://${window.location.hostname}:${dbPort}`;

    // databaseIframe.addEventListener("load", () => {
    //     document.getElementById("loading").style.display = "none";
    // });
});

function refreshData() {
    const dbPort = document.getElementById("dbPort").innerText;
    const databaseIframe = document.getElementById("database");
    if (!document.hasFocus()) {
        databaseIframe.src = `http://${window.location.hostname}:${dbPort}`;
    } else {
        console.log(
            "Page in focus, not reloading iframe to prevent user disruption."
        );
    }
}
