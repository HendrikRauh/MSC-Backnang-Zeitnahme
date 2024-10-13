$(document).ready(function () {
    var table = $("#times").DataTable({
        buttons: ["csv", "pdf", "excel", "print"],
    });

    $("#exportCSV").on("click", function () {
        table.button(0).trigger();
    });

    $("#exportPDF").on("click", function () {
        table.button(1).trigger();
    });

    $("#exportXLSX").on("click", function () {
        table.button(2).trigger();
    });

    $("#print").on("click", function () {
        table.button(3).trigger();
    });
});

addEventListener("click", function (event) {
    if (event.target.classList.contains("delete")) {
        let run = event.target.getAttribute("data-id");
        console.log(`Deleting time with id ${run}`);
        fetch("/delete-time", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ run }),
        }).then((response) => {
            if (response.ok) {
                console.log("Time deleted");
                // remove the row from the table
                event.target.closest("tr").remove();
            } else {
                console.error(response.statusText);
            }
        });
    }
});
