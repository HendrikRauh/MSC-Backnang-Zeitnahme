// when dom content loaded set the src of the iframe database to window.location.hostname port 5555
// file deepcode ignore UseSecureWebsockets: <please specify a reason of ignoring this>
const socket = new WebSocket("ws://" + window.location.host);

socket.addEventListener("open", (event) => {
    console.log("WebSocket Client Connected");
});

socket.addEventListener("message", (event) => {
    console.log("🚀 ~ socket.addEventListener ~ event:", event)
    if (event.data === "reload") {
        refreshData();
    }
});

document.addEventListener("DOMContentLoaded", function () {
    // get the port from p#dbPort
    document.getElementById("database").src = `http://${
        window.location.hostname
    }:${document.getElementById("dbPort").innerText}`;

    // when iframe database is ready hide the h1
    document.getElementById("database").addEventListener("load", function () {
        document.getElementById("loading").style.display = "none";
    });
});

function refreshData() {
    // reload the iframe when the page is not in focus
    if (!document.hasFocus()) {
        document.getElementById("database").src = `http://${
            window.location.hostname
        }:${document.getElementById("dbPort").innerText}`;
    } else {
        console.log("Page in focus, not reloading iframe to prevent user disruption.");
    }
}
