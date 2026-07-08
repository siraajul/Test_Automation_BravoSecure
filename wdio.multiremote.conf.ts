import { config as base } from './wdio.conf';
import { androidCapabilities } from './src/config/capabilities';
import { env } from './src/config/env';

/**
 * Multiremote runner for 1:1 / group message + call across endpoints. Each
 * instance is one participant; specs drive them by name (`client.$(...)`,
 * `client2.$(...)`, `client3.$(...)`).
 *
 *   client  = Pixel 7a   (client1 · Shirajul)        ANDROID_DEVICE
 *   client2 = AVD        (client2 · ITSirajul)        CLIENT2_DEVICE (emulator-5556)
 *   client3 = AVD        (client3 · Fahim)            CLIENT3_DEVICE (emulator-5558) — group only
 *
 * NOTE: BlueStacks cannot run UiAutomator2 (helper apks blank the screen) — use
 * Android Studio AVDs. Each UiAutomator2 instance needs a unique systemPort /
 * mjpegServerPort. One Appium server (4723) hosts all sessions.
 */
const endpoint = (udid: string, systemPort: number, mjpeg: number) => ({
  capabilities: {
    ...androidCapabilities,
    'appium:udid': udid,
    'appium:systemPort': systemPort,
    'appium:mjpegServerPort': mjpeg,
  },
});

const client2Udid = process.env.CLIENT2_DEVICE ?? 'emulator-5556';
const client3Udid = process.env.CLIENT3_DEVICE ?? '';

const capabilities: Record<string, ReturnType<typeof endpoint>> = {
  client: endpoint(env.androidDevice, 8200, 7810),
  client2: endpoint(client2Udid, 8202, 7812),
};
// client3 joins only when its AVD is provided (3-device group call).
if (client3Udid) capabilities.client3 = endpoint(client3Udid, 8203, 7813);

export const config: WebdriverIO.MultiremoteConfig = {
  ...base,
  specs: ['./test/device/comms/**/*.multiremote.ts'],
  suites: undefined,
  capabilities,
};
