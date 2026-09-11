describe('Live Dashboard E2E Browser Tests', () => {
  it('loads the dashboard and successfully submits the pod simulation form', () => {
    cy.visit('/dashboard');

    // Verify main header
    cy.get('h1').should('contain', 'ci-cd-kube');

    // Verify interactive pod simulation form
    cy.get('#podNameInput').should('exist').type('test-pod-alpha');
    cy.get('#submitPodBtn').should('exist').click();

    // Verify success banner is displayed
    cy.get('#e2eSuccessMessage')
      .should('be.visible')
      .and('contain', 'Simulated pod test-pod-alpha submitted successfully');
  });
});
