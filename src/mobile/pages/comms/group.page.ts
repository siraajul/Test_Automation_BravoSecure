import { BasePage } from '../base.page';
import { byDescContains, byText, byTextOrDesc } from '../../../helpers/selectors';

/**
 * Group Info screen (reached by tapping a group thread's header). Exposes the
 * member roster and the admin controls.
 *
 * Confirmed live (Test Team, 3 members):
 *  - Title bar "GROUP INFO", group name, "<n> members".
 *  - Action row: CALL · VIDEO · MUTE · ADD (each "<glyph>, LABEL" content-desc).
 *  - "MEMBERS · n", "TAP TO RENAME", an "Add member" row, one row per member
 *    ("<You>, YOU" marks the admin/self), and "Exit Group".
 */
class GroupPage extends BasePage {
  protected get rootLocator(): string {
    return byTextOrDesc('GROUP INFO');
  }

  get title(): ChainablePromiseElement {
    return $(byText('GROUP INFO'));
  }

  /* ---- group call entry points ---- */

  get groupCallButton(): ChainablePromiseElement {
    return $(byDescContains(', CALL'));
  }
  get groupVideoButton(): ChainablePromiseElement {
    return $(byDescContains(', VIDEO'));
  }

  /* ---- admin controls ---- */

  get addMemberButton(): ChainablePromiseElement {
    return $(byDescContains('Add member'));
  }

  memberRow(name: string): ChainablePromiseElement {
    return $(byDescContains(name));
  }

  /** The self/admin row is tagged "YOU". */
  get selfRow(): ChainablePromiseElement {
    return $(byDescContains('YOU'));
  }

  get exitGroupButton(): ChainablePromiseElement {
    return $(byDescContains('Exit Group'));
  }

  async memberCount(): Promise<number> {
    const el = $('//*[contains(@text, "members")]');
    const txt = await el.getText().catch(() => '0 members');
    return Number.parseInt(txt, 10) || 0;
  }

  async open(groupTitle: string): Promise<void> {
    // From an open group thread, tap the header (carries the group title).
    await $(byDescContains(groupTitle)).click();
    await this.waitUntilActive(12000);
  }
}

export default new GroupPage();
