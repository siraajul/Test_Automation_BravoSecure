import { AuthFlow } from '../../../src/mobile/flows/auth.flow';
import AgentDashboardPage from '../../../src/mobile/pages/cpo/agentDashboard.page';
import AttendancePage from '../../../src/mobile/pages/cpo/attendance.page';
import EarningsPage from '../../../src/mobile/pages/cpo/earnings.page';

describe('Agent · Operations screens', () => {
  before(async () => {
    await AuthFlow.loginAs('cpo');
    await AgentDashboardPage.open();
  });

  it('opens Attendance (shift clock-in)', async () => {
    await AgentDashboardPage.openMenuItem('Attendance');
    await expect(await AttendancePage.isActive(15000)).toBe(true);
    await expect(await AttendancePage.clockInButton.isExisting()).toBe(true);
    // NOTE: never tap CLOCK IN — it registers real duty.
  });

  it('opens Earnings (Bravo Credits wallet)', async () => {
    await AgentDashboardPage.openMenuItem('Earnings');
    await expect(await EarningsPage.isActive(15000)).toBe(true);
    await expect(await EarningsPage.walletBalance.isExisting()).toBe(true);
  });
});
