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

                cy.get("#inactiveDrivers")
                    .find("option")
                    .its("length")
                    .should(
                        "be.lessThan",
                        Cypress.$("#inactiveDrivers option").length
                    );
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

                cy.get("#inactiveDrivers")
                    .find("option")
                    .its("length")
                    .should(
                        "be.above",
                        Cypress.$("#inactiveDrivers option").length
                    );
            });

        cy.get("#activeDrivers")
            .find("option")
            .then(($options) => {
                const totalOptions = $options.length;

                cy.get("#activeDrivers").select(1);
                cy.contains("HOCH").click();

                cy.get("#activeDrivers")
                    .find("option:first")
                    .invoke("text")
                    .should("eq", Cypress.$($options[1]).text());
            });

        cy.get("#activeDrivers")
            .find("option")
            .then(($options) => {
                const totalOptions = $options.length;

                cy.get("#activeDrivers").select(0);
                cy.contains("RUNTER").click();

                cy.get("#activeDrivers")
                    .find("option:nth-child(2)")
                    .invoke("text")
                    .should("eq", Cypress.$($options[0]).text());
            });
        cy.contains("RESET").click();
        cy.get("#activeDrivers").find("option").should("have.length", 0);
    });

    it("deletes all times");
});
