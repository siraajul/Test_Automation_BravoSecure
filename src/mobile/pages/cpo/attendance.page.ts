import { BasePage } from '../base.page';
import { byTextOrDesc } from '../../../helpers/selectors';

/**
 * Agent Attendance (shift clock in/out + recent shifts).
 * NOTE: never tap CLOCK IN / CLOCK OUT in tests — it registers real duty.
 */
class AttendancePage extends BasePage {
  protected get rootLocator(): string {
    return byTextOrDesc('ATTENDANCE');
  }

  get clockInButton(): ChainablePromiseElement {
    return $(byTextOrDesc('CLOCK IN'));
  }
  get recentShifts(): ChainablePromiseElement {
    return $(byTextOrDesc('RECENT SHIFTS'));
  }
}

export default new AttendancePage();
