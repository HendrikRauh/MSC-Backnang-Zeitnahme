$(document).ready(function () {
    var table = $("#times").DataTable({
        layout: {
            topStart: "buttons",
        },
        buttons: [
            { extend: "print", key: "d", text: "Drucken" },
            { extend: "pdf", key: "p", text: "PDF laden" },
            { extend: "csv", key: "c", text: "CSV laden" },
            { extend: "excel", key: "e", text: "Excel laden" },
            {
                extend: "searchPanes",
                config: {
                    cascadePanes: true,
                },
                key: "f",
                text: "Filter",
            },
        ],
        paging: false,
        select: true,
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
