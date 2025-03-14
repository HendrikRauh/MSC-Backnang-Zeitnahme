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

describe("Driver Management Tests", () => {
    beforeEach(() => {
        cy.request("POST", "/set-operation-mode", { operationMode: "manual" });
        cy.visit("/settings");
    });

    it("filter trainingGroups", () => {
        cy.get("#trainingGroups input[type='checkbox']").each(($el) => {
            cy.wrap($el).uncheck();
        });

        cy.get("#inactiveDrivers")
            .find("option:visible")
            .should("have.length", 0);
    });

    describe("Driver Activation", () => {
        beforeEach(() => {
            cy.get("#trainingGroups input[type='checkbox']").each(($el) => {
                cy.wrap($el).check();
            });
        });

        it("should activate drivers correctly", () => {
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
        });
    });

    describe("Driver Deactivation", () => {
        it("should deactivate drivers correctly", () => {
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
        });
    });

    describe("Driver Sorting", () => {
        it("should move driver up correctly", () => {
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
        });

        it("should move driver down correctly", () => {
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
        });
    });

    describe("Reset Functionality", () => {
        it("should reset driver management state", () => {
            cy.contains("RESET").click();
            cy.get("#activeDrivers").find("option").should("have.length", 0);
        });
    });
});
