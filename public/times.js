$(document).ready(function () {
    var table = $("#times").DataTable({
        layout: {
            topStart: "buttons",
        },
        buttons: [
            { extend: "print", key: "d" },
            { extend: "pdf", key: "p" },
            { extend: "csv", key: "c" },
            { extend: "excel", key: "e" },
            {
                extend: "searchPanes",
                config: {
                    cascadePanes: true,
                },
                key: "s",
            },
        ],
        paging: false,
        select: true,
        language: {
            url: "datatables.de.json",
            emptyTable: "Keine Zeiten",
            info: "Zeige _TOTAL_ Einträge",
            infoEmpty: "Zeige 0 Einträge",
            infoFiltered: "(gefiltert von _MAX_ Einträgen)",
            infoPostFix: "",
            lengthMenu: "Zeige _MENU_ Eintäge",
            zeroRecords: "Keine Zeiten",
        },
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
