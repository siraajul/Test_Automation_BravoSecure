import { AuthFlow } from '../../../src/mobile/flows/auth.flow';
import AgentDashboardPage from '../../../src/mobile/pages/cpo/agentDashboard.page';
import JobMarketplacePage from '../../../src/mobile/pages/cpo/jobMarketplace.page';

describe('Smoke · Agent navigation', () => {
  before(async () => {
    await AuthFlow.loginAs('cpo');
    await AgentDashboardPage.open();
  });

  it('opens the Job Marketplace from the dashboard', async () => {
    await AgentDashboardPage.openJobRequests();
    await expect(await JobMarketplacePage.isActive(15000)).toBe(true);
  });
});
