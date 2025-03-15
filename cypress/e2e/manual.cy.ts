describe("Mode", () => {
    it("activates", () => {
        cy.visit("/settings");

        cy.get("#operationMode").select("Manuell");
        cy.get("select:visible").should("have.length", 3);
    });

    it("activates (API)", () => {
        cy.request("POST", "/set-operation-mode", { operationMode: "manual" });
        cy.visit("/settings");
        cy.get("select:visible").should("have.length", 3);
    });
});

describe("drivermanagement", () => {
    beforeEach(() => {
        cy.request("POST", "/set-operation-mode", { operationMode: "manual" });
        cy.visit("/settings");
    });

    it("filters", () => {
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

        it("works", () => {
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
        it("works", () => {
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
        it("upwards works", () => {
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

        it("downwards works", () => {
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
        it("works", () => {
            cy.contains("RESET").click();
            cy.get("#activeDrivers").find("option").should("have.length", 0);
        });
    });

    describe("Saving", () => {
        it("works");
    });
});

describe("operation", () => {
    it("gets timestamps");
    it("starts");
    it("ends");
    it("saves info");
    it("deletes timestamp");
    it("deletes running");
    it("deletes finished");
    it("autorefreshes");
    it("shows disconnected");
});

describe("display", () => {
    it("shows empty message");
    it("shows last time");
    it("shows last time info");
    it("shows last times of driver");
    it("autorefreshes");
});
