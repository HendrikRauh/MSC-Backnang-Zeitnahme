describe("General", () => {
    it("activate manual mode", () => {
        cy.visit("/settings");

        cy.get("#operationMode").select("Manuell");
        cy.get("select:visible").should("have.length", 3);
    });

    it("activate standalone mode", () => {
        cy.visit("/settings");

        cy.get("#operationMode").select("Standalone");
        cy.get("select").should("have.length", 1);
    });

    it("activate manual mode API", () => {
        cy.request("POST", "/set-operation-mode", { operationMode: "manual" });
        cy.visit("/settings");
        cy.get("select:visible").should("have.length", 3);
    });

    it("activate standalone mode API", () => {
        cy.request("POST", "/set-operation-mode", {
            operationMode: "standalone",
        });
        cy.visit("/settings");
        cy.get("select:visible").should("have.length", 1);
    });
});

describe("Manual Mode", () => {
    it("manages drivers", () => {
        cy.request("POST", "/set-operation-mode", { operationMode: "manual" });
        cy.visit("/settings");

        cy.get("#trainingGroups input[type='checkbox']").each(($el) => {
            cy.wrap($el).uncheck();
        });

        cy.get("#inactiveDrivers")
            .find("option:visible")
            .should("have.length", 0);

        cy.get("#trainingGroups input[type='checkbox']").each(($el) => {
            cy.wrap($el).check();
        });

        cy.get("#activeDrivers")
            .find("option")
            .then(($activeDrivers) => {
                const activeDriversBefore = $activeDrivers.length;

                cy.get("#inactiveDrivers").select(0);
                cy.contains("AKTIVIEREN").click();
                cy.get("#activeDrivers")
                    .find("option")
                    .should("have.length.greaterThan", activeDriversBefore);
                // TODO: test if inactive has less now
            });

        cy.get("#activeDrivers")
            .find("option")
            .then(($activeDrivers) => {
                const activeDriversBefore = $activeDrivers.length;

                cy.get("#activeDrivers").select(0);
                cy.contains("DEAKTIVIEREN").click();
                cy.get("#activeDrivers")
                    .find("option")
                    .should("have.length.lessThan", activeDriversBefore);
                // TODO: test if inactive has more now
            });

        // TODO: test up and down moving

        cy.contains("RESET").click();
        cy.get("#activeDrivers").find("option").should("have.length", 0);
    });

    it("deletes all times");
});
