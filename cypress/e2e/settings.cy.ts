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

        //TODO: select drivers from inactive and click activate. amount of selected should move to active
        cy.contains("RESET").click();
        cy.get("#activeDrivers").find("option").should("have.length", 0);
    });

    it("deletes all times");
});
