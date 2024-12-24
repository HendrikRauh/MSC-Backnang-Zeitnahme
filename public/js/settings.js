addEventListener("DOMContentLoaded", async () => {
    var operationMode = document.getElementById("operationMode").value;

    document.getElementById("operationMode").addEventListener("change", () => {
        setOperationMode();
    });
});

async function setOperationMode() {
    const operationMode = document.getElementById("operationMode").value;
    try {
        await fetch("/set-operation-mode", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                operationMode: operationMode,
            }),
        });
        console.log("Operation mode set to " + operationMode);
    } catch (error) {
        console.error(error);
    }
    location.reload();
}
