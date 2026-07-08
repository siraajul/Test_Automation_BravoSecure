import { AuthFlow } from '../../../src/mobile/flows/auth.flow';
import AgentDashboardPage from '../../../src/mobile/pages/cpo/agentDashboard.page';

describe('Auth · CP Agent sign-in', () => {
  it('signs in as the agent and lands on the Agent Dashboard', async () => {
    await AuthFlow.loginAs('cpo');
    await AgentDashboardPage.open();
    await expect(await AgentDashboardPage.isActive(30000)).toBe(true);
  });

  it('shows the agent operations menu (Job Requests, Attendance, Earnings)', async () => {
    await expect(await AgentDashboardPage.jobRequests.isExisting()).toBe(true);
    await expect(await AgentDashboardPage.attendance.isExisting()).toBe(true);
    await AgentDashboardPage.scrollTo('Earnings'); // below the fold
    await expect(await AgentDashboardPage.earnings.isExisting()).toBe(true);
  });
});
