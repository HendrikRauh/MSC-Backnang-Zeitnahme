describe("Basic functionality", () => {
    it("has working home button", () => {
        cy.visit("settings");
        cy.get(".home-button").click();
        cy.url().should("eq", Cypress.config().baseUrl + "/");
    });

    it("homebutton disappears after time");

    it("homebutton get visible when action");
});
describe("Links in manual mode", () => {
    it("opens display", () => {
        cy.request("POST", "/set-operation-mode", { operationMode: "manual" });
        cy.visit("/");
        cy.contains("Anzeige").click();
        cy.url().should("eq", Cypress.config().baseUrl + "/displayManual");
    });

    it("opens operation", () => {
        cy.visit("/");
        cy.contains("Steuerung").click();
        cy.url().should("eq", Cypress.config().baseUrl + "/operation");
        cy.contains("Speichern").should("exist");
    });

    it("opens settings", () => {
        cy.visit("/");
        cy.contains("Einstellungen").click();
        cy.url().should("eq", Cypress.config().baseUrl + "/settings");
        cy.contains("Modus").should("exist");
    });

    it("opens times", () => {
        cy.visit("/");
        cy.contains("Zeiten").click();
        cy.url().should("eq", Cypress.config().baseUrl + "/times");
        cy.contains("Fahrzeit").should("exist");
    });

    it("opens database", () => {
        cy.visit("/");
        cy.contains("Datenbank").click();
        cy.url().should("eq", Cypress.config().baseUrl + "/database");
        cy.get("#database").should("exist");
    });
});

describe("Links in standalone mode", () => {
    it("has standalone start", () => {
        cy.visit("/standalone");
        cy.url().should("eq", Cypress.config().baseUrl + "/displayStandalone");
    });
    it("opens settings", () => {
        cy.visit("/");
        cy.contains("Einstellungen").click();
        cy.url().should("eq", Cypress.config().baseUrl + "/settings");
    });

    it("opens display", () => {
        cy.visit("/");
        cy.contains("Standalone").click();
        cy.url().should("eq", Cypress.config().baseUrl + "/displayStandalone");
    });

    it("hides others", () => {
        cy.visit("/");
        cy.contains("Steuerung").should("not.exist");
    });
});
