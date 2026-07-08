import { AuthFlow } from '../../src/mobile/flows/auth.flow';
import AgentDashboardPage from '../../src/mobile/pages/cpo/agentDashboard.page';

function texts(src: string): string[] {
  return [...new Set(
    [...src.matchAll(/(?:text|content-desc)="([^"]{2,48})"/g)].map((m) => m[1]),
  )].filter((t) => /[A-Za-z0-9]/.test(t));
}

describe('E2E-E · CPO assigned mission on dashboard', () => {
  it('shows the assigned mission in Next on Ops', async () => {
    await AuthFlow.loginAs('cpo');
    await AgentDashboardPage.open();
    await browser.pause(1500);
    console.log('AGENT-DASHBOARD =>', texts(await driver.getPageSource()).slice(0, 30));
    await driver.saveScreenshot('./.explore/phaseE_mission.png');
  });
});
