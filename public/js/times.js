$(document).ready(function () {
    var table = $("#times").DataTable({
        columnDefs: [
            {
                targets: 4,
                orderData: [3, 4],
            },
            {
                targets: 3,
                visible: false,
            },
            {
                targets: 7,
                orderData: [6, 7],
            },
            {
                targets: 6,
                visible: false,
            },
        ],
        layout: {
            topStart: "buttons",
            topEnd: "info",
            bottomStart: null,
            bottomEnd: null,
        },
        buttons: [
            {
                extend: "print",
                key: "p",
                exportOptions: {
                    columns: ":not(:last-child):not(:first-child):visible",
                },
            },
            { extend: "csv", key: "c" },
            {
                extend: "excel",
                key: "e",
                exportOptions: {
                    columns: ":not(:last-child)",
                },
            },
            "spacer",
            {
                extend: "searchPanes",
                config: {
                    cascadePanes: true,
                },
                key: "f",
            },
        ],
        order: {
            idx: 0,
            dir: "desc",
        },
        paging: false,
        language: {
            url: "/lang/datatables.de.json",
        },
        stateSave: true,
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
