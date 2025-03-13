describe("Basic functionality", () => {
    it("has working home button", () => {
        cy.visit("settings");
        cy.get(".home-button").click();
        cy.url().should("eq", Cypress.config().baseUrl + "/");
    });

    it("opens display");

    it("opens operation");

    it("opens settings", () => {
        cy.visit("/");
        cy.contains("Einstellungen").click();
        cy.url().should("eq", Cypress.config().baseUrl + "/settings");
        cy.contains("Modus").should("exist");
    });

    it("opens times");

    it("opens database");
});
