import { accountFor, env, type Account, type Role } from '../../config/env';
import { APP_PACKAGE } from '../../config/capabilities';
import { byText, byDescContains } from '../../helpers/selectors';
import WelcomePage from '../pages/welcome.page';
import LoginPage from '../pages/login.page';
import BiometricPage from '../pages/biometric.page';
import PermissionsPage from '../pages/permissions.page';
import RestoreBackupPage from '../pages/restoreBackup.page';

type SessionRole = Role | 'loggedOut' | 'unknown';

/**
 * High-level authentication orchestration. Each gate is conditional, so the
 * flow is robust whether the app cold-starts at the biometric lock, the
 * welcome screen, or is already authenticated as either role.
 */
export const AuthFlow = {
  /** Relaunch the app fresh (clears the back stack, may trigger gates). */
  async relaunch(): Promise<void> {
    await driver.terminateApp(APP_PACKAGE);
    await driver.activateApp(APP_PACKAGE);
  },

  /**
   * Ensure the app is foregrounded, then pass the biometric gate via the PIN
   * fallback. Foregrounding is essential at session start — otherwise the test
   * code can run while the app is still backgrounded (launcher in front) and
   * see nothing. The gate can take >10s to render on a cold resume.
   */
  async passBiometric(): Promise<boolean> {
    await driver.activateApp(APP_PACKAGE).catch(() => undefined);
    const appeared = await browser
      .waitUntil(() => BiometricPage.isShowing(), { timeout: 15000, interval: 700 })
      .then(() => true)
      .catch(() => false);
    if (!appeared) return false;
    return BiometricPage.unlockWithPin(env.devicePin);
  },

  /**
   * Logged out = the sign-in form is showing (the app's logged-out landing) or
   * the welcome carousel. Both mean "no active session".
   */
  async isLoggedOut(): Promise<boolean> {
    if (await LoginPage.isOnLoginForm()) return true;
    return WelcomePage.isActive(1200);
  },

  /** Get to the sign-in form, dismissing the welcome carousel if shown. */
  async reachSignInForm(): Promise<void> {
    await browser
      .waitUntil(
        async () => (await LoginPage.isOnLoginForm()) || (await WelcomePage.isActive(500)),
        { timeout: 12000, interval: 600 },
      )
      .catch(() => undefined);
    if (!(await LoginPage.isOnLoginForm())) {
      await WelcomePage.goToSignIn().catch(() => undefined);
    }
  },

  /**
   * Detect who is currently signed in via stable per-role signals, polling for
   * the screen to settle. Non-destructive: never presses back (which could exit
   * the app) — it waits for the restored screen to render instead.
   */
  async detectRole(): Promise<SessionRole> {
    const probe = async (): Promise<SessionRole> => {
      if (await this.isLoggedOut()) return 'loggedOut';
      // Agent signals (dashboard or its persistent header chrome).
      if (await $(byText('Agent Dashboard')).isExisting()) return 'cpo';
      if (await $(byDescContains('PARTNER AGENT')).isExisting()) return 'cpo';
      if (await $(byDescContains('On Duty')).isExisting()) return 'cpo';
      if (await $(byDescContains('NEXT ON OPS')).isExisting()) return 'cpo';
      // Client signals (Bravo Command home / bottom nav).
      if (await $(byDescContains('Bravo Messenger')).isExisting()) return 'client';
      if (await $(byText('SECURE')).isExisting()) return 'client';
      return 'unknown';
    };

    let role: SessionRole = 'unknown';
    await browser
      .waitUntil(
        async () => {
          role = await probe();
          return role !== 'unknown';
        },
        { timeout: 12000, interval: 700 },
      )
      .catch(() => undefined);
    return role;
  },

  /** Log out whoever is signed in (client tab flow or agent drawer flow). */
  async ensureLoggedOut(): Promise<void> {
    await this.passBiometric().catch(() => undefined);
    if (await this.isLoggedOut()) return;

    const role = await this.detectRole();
    const { default: AgentDashboardPage } = await import('../pages/cpo/agentDashboard.page');
    const { default: ProfilePage } = await import('../pages/client/profile.page');

    if (role === 'client') {
      await ProfilePage.logout();
    } else {
      // agent, or unknown deep screen — try the agent drawer first (it can
      // back-navigate to its dashboard), then fall back to the client tab flow.
      try {
        await AgentDashboardPage.logout();
      } catch {
        await ProfilePage.logout();
      }
    }
    await browser
      .waitUntil(() => this.isLoggedOut(), { timeout: 20000, interval: 700 })
      .catch(() => undefined);
  },

  /**
   * Ensure we are signed in as `role`. Handles biometric, switches accounts if
   * a different role is active, then runs welcome -> credentials -> permissions
   * -> restore-backup.
   */
  async loginAs(role: Role): Promise<void> {
    const account = accountFor(role);
    if (!account.email || !account.password) {
      throw new Error(`Missing credentials for role "${role}" in credentials.env`);
    }

    await this.passBiometric().catch(() => undefined);

    if (!(await this.isLoggedOut())) {
      // Already authenticated. Only switch accounts when the OTHER role is
      // POSITIVELY detected — never log out on an ambiguous/transient screen,
      // which would needlessly trigger the slow client restore.
      const other: Role = role === 'client' ? 'cpo' : 'client';
      if ((await this.detectRole()) === other) {
        await this.ensureLoggedOut();
      } else {
        return; // same role or unknown → assume authenticated as target
      }
    }

    await this.reachSignInForm();
    await LoginPage.signIn(account.email, account.password);

    await browser.waitUntil(async () => !(await LoginPage.isOnLoginForm()), {
      timeout: 30000,
      timeoutMsg: 'Still on the sign-in form after submitting credentials',
    });

    await PermissionsPage.grantIfPresent().catch(() => undefined);

    if (role === 'client' && env.client.backupPassword) {
      const started = await RestoreBackupPage.restore(env.client.backupPassword).catch(
        () => false,
      );
      if (started) await this.completeRestore();
    }
  },

  /**
   * Device-setup login: sign in as a SPECIFIC account, logging out whoever is
   * currently signed in (deterministic). Restores the chat backup if the
   * account has one (clients do; the CPO does not). Used to provision each
   * device/emulator for multi-device runs.
   */
  async loginAccount(account: Account): Promise<void> {
    if (!account.email || !account.password) {
      throw new Error(`Missing credentials for account ${account.email || '(unknown)'}`);
    }
    await this.passBiometric().catch(() => undefined);
    if (!(await this.isLoggedOut())) {
      await this.ensureLoggedOut();
    }
    await this.reachSignInForm();
    await LoginPage.signIn(account.email, account.password);

    await browser.waitUntil(async () => !(await LoginPage.isOnLoginForm()), {
      timeout: 30000,
      timeoutMsg: 'Still on the sign-in form after submitting credentials',
    });

    await PermissionsPage.grantIfPresent().catch(() => undefined);

    if (account.backupPassword) {
      const started = await RestoreBackupPage.restore(account.backupPassword).catch(() => false);
      if (started) await this.completeRestore();
    }
  },

  /**
   * Wait out the multi-minute encrypted restore and tap into the app. The
   * restore can re-raise the biometric gate partway through, so this also
   * unlocks if the gate reappears.
   */
  async completeRestore(timeout = 360000): Promise<void> {
    const openBtn = $('android=new UiSelector().descriptionContains("OPEN MESSENGER")');
    await browser
      .waitUntil(
        async () => {
          if (await openBtn.isExisting()) return true;
          if (await BiometricPage.isShowing()) {
            await BiometricPage.unlockWithPin(env.devicePin).catch(() => undefined);
          }
          return false;
        },
        { timeout, interval: 3000 },
      )
      .catch(() => undefined);
    if (await openBtn.isExisting()) await openBtn.click();
  },

  async logout(): Promise<void> {
    await this.ensureLoggedOut();
  },
};
