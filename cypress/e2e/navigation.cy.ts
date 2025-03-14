describe("Home button", () => {
    beforeEach(() => {
        cy.visit("settings");
    });

    it("works", () => {
        cy.get(".home-button").click();
        cy.url().should("eq", Cypress.config().baseUrl + "/");
    });

    it("disappears after time", () => {
        cy.get(".home-button").should("be.visible");
        cy.wait(5000);
        cy.get(".home-button").should("not.be.visible");
    });

    it("reappears after movement", () => {
        cy.wait(5000);
        cy.get(".home-button").should("not.be.visible");

        cy.get("body").trigger("mousemove", {
            bubbles: true,
            force: true,
        });

        cy.get(".home-button").should("be.visible");
    });
});
describe("homepage links (manual)", () => {
    beforeEach(() => {
        cy.request("POST", "/set-operation-mode", { operationMode: "manual" });
        cy.visit("/");
    });

    it("only show correct", () => {
        cy.contains("Standalone").should("not.exist");
    });

    it("display", () => {
        cy.contains("Anzeige").click();
        cy.url().should("eq", Cypress.config().baseUrl + "/displayManual");
    });

    it("operation", () => {
        cy.contains("Steuerung").click();
        cy.url().should("eq", Cypress.config().baseUrl + "/operation");
        cy.contains("Speichern").should("exist");
    });

    it("settings", () => {
        cy.contains("Einstellungen").click();
        cy.url().should("eq", Cypress.config().baseUrl + "/settings");
        cy.contains("Modus").should("exist");
    });

    it("times", () => {
        cy.contains("Zeiten").click();
        cy.url().should("eq", Cypress.config().baseUrl + "/times");
        cy.contains("Fahrzeit").should("exist");
    });

    it("database", () => {
        cy.contains("Datenbank").click();
        cy.url().should("eq", Cypress.config().baseUrl + "/database");
        cy.get("#database").should("exist");
    });
});

describe("homepage links (standalone)", () => {
    beforeEach(() => {
        cy.request("POST", "/set-operation-mode", {
            operationMode: "standalone",
        });
        cy.visit("/");
    });

    it("only show correct", () => {
        cy.contains("Steuerung").should("not.exist");
    });

    it("settings", () => {
        cy.contains("Einstellungen").click();
        cy.url().should("eq", Cypress.config().baseUrl + "/settings");
    });

    it("display", () => {
        cy.contains("Standalone").click();
        cy.url().should("eq", Cypress.config().baseUrl + "/displayStandalone");
    });
});
