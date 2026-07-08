import { AuthFlow } from '../../src/mobile/flows/auth.flow';
import { accountByKey, type AccountKey } from '../../src/config/env';
import LoginPage from '../../src/mobile/pages/login.page';

/**
 * Provision one device/emulator with a specific account. Run per device:
 *   ANDROID_DEVICE=127.0.0.1:5565 SETUP_ROLE=cpo \
 *     npx wdio run ./wdio.conf.ts --spec ./test/setup/device-setup.e2e.ts
 *
 * SETUP_ROLE ∈ client1 | client2 | client3 | cpo
 */
const key = (process.env.SETUP_ROLE ?? 'client1') as AccountKey;

describe(`Device setup · ${key}`, () => {
  it(`logs ${key} into ${process.env.ANDROID_DEVICE}`, async () => {
    const account = accountByKey(key);
    await AuthFlow.loginAccount(account);
    await expect(await LoginPage.isOnLoginForm()).toBe(false);
  });
});
