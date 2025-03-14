describe("Basic functionality", () => {
    beforeEach(() => {
        cy.visit("settings");
    });

    it("has working home button", () => {
        cy.get(".home-button").click();
        cy.url().should("eq", Cypress.config().baseUrl + "/");
    });

    it("homebutton disappears after time", () => {
        cy.get(".home-button").should("be.visible");
        cy.wait(5000);
        cy.get(".home-button").should("not.be.visible");
    });

    it("homebutton gets visible when action", () => {
        cy.wait(5000);
        cy.get(".home-button").should("not.be.visible");

        cy.get("body").trigger("mousemove", {
            bubbles: true,
            force: true,
        });

        cy.get(".home-button").should("be.visible");
    });
});
describe("Links in manual mode", () => {
    beforeEach(() => {
        cy.request("POST", "/set-operation-mode", { operationMode: "manual" });
        cy.visit("/");
    });

    it("opens display", () => {
        cy.contains("Anzeige").click();
        cy.url().should("eq", Cypress.config().baseUrl + "/displayManual");
    });

    it("opens operation", () => {
        cy.contains("Steuerung").click();
        cy.url().should("eq", Cypress.config().baseUrl + "/operation");
        cy.contains("Speichern").should("exist");
    });

    it("opens settings", () => {
        cy.contains("Einstellungen").click();
        cy.url().should("eq", Cypress.config().baseUrl + "/settings");
        cy.contains("Modus").should("exist");
    });

    it("opens times", () => {
        cy.contains("Zeiten").click();
        cy.url().should("eq", Cypress.config().baseUrl + "/times");
        cy.contains("Fahrzeit").should("exist");
    });

    it("opens database", () => {
        cy.contains("Datenbank").click();
        cy.url().should("eq", Cypress.config().baseUrl + "/database");
        cy.get("#database").should("exist");
    });
});

describe("Links in standalone mode", () => {
    beforeEach(() => {
        cy.request("POST", "/set-operation-mode", {
            operationMode: "standalone",
        });
        cy.visit("/");
    });

    it("has standalone start", () => {
        cy.visit("/standalone");
        cy.url().should("eq", Cypress.config().baseUrl + "/displayStandalone");
    });

    it("opens settings", () => {
        cy.contains("Einstellungen").click();
        cy.url().should("eq", Cypress.config().baseUrl + "/settings");
    });

    it("opens display", () => {
        cy.contains("Standalone").click();
        cy.url().should("eq", Cypress.config().baseUrl + "/displayStandalone");
    });

    it("hides others", () => {
        cy.contains("Steuerung").should("not.exist");
    });
});
