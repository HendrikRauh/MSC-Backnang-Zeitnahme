describe("Settings", () => {
    const openSettings = () => {
        cy.visit("/");
        cy.contains("Einstellungen").click();
    };

    const activateManualMode = () => {
        openSettings();
        cy.get("#operationMode").select("Manuell");
        cy.get("select").should("have.length", 3);
    };

    it("opens settings", () => {
        openSettings();
    });

    it("activate manual mode", () => {
        activateManualMode();
    });

    it("activate standalone mode", () => {
        openSettings();
        cy.get("#operationMode").select("Standalone");
        cy.get("select").should("have.length", 1);
    });

    it("manages drivers", () => {
        activateManualMode();

        cy.get("#trainingGroups input[type='checkbox']").each(($el) => {
            cy.wrap($el).uncheck();
        });

        cy.get("#inactiveDrivers")
            .find("option:visible")
            .should("have.length", 0);

        cy.get("#trainingGroups input[type='checkbox']").each(($el) => {
            cy.wrap($el).check();
        });

        //TODO: select drivers from inactive and click activate. amount of selected should move to active

        cy.contains("RESET").click();
        cy.get("#activeDrivers").find("option").should("have.length", 0);
    });
});
