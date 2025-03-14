describe("Mode", () => {
    it("activates", () => {
        cy.visit("/settings");

        cy.get("#operationMode").select("Standalone");
        cy.get("select").should("have.length", 1);
    });

    it("activate standalone mode API", () => {
        cy.request("POST", "/set-operation-mode", {
            operationMode: "standalone",
        });
        cy.visit("/settings");
        cy.get("select:visible").should("have.length", 1);
    });

    it("has standalone start", () => {
        cy.visit("/standalone");
        cy.url().should("eq", Cypress.config().baseUrl + "/displayStandalone");
        cy.visit("/settings");
        cy.get("select:visible").should("have.length", 1);
    });
});

describe("display", () => {
    it("shows empty message");
    it("shows ready");
    it("shows running");
    it("shows disconnected");
    it("shows last time");
    it("autorefreshes");
});
