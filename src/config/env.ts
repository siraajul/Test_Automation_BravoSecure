import dotenv from 'dotenv';
import path from 'node:path';

// Load the gitignored credentials file once, from the project root.
dotenv.config({ path: path.join(process.cwd(), 'credentials.env') });

export interface Account {
  email: string;
  password: string;
  phone?: string;
  backupPassword?: string;
}

export interface AdminAccount {
  url: string;
  user: string;
  password: string;
  /** OTP (2FA). A fixed test code in this env; supply via SMS/API in real ones. */
  otp: string;
}

const backup = process.env.BACKUP_PASSWORD ?? '';

const clients: Account[] = [
  {
    email: process.env.CLIENT1_EMAIL ?? '',
    password: process.env.CLIENT1_PASSWORD ?? '',
    phone: process.env.CLIENT1_PHONE,
    backupPassword: backup,
  },
  {
    email: process.env.CLIENT2_EMAIL ?? '',
    password: process.env.CLIENT2_PASSWORD ?? '',
    phone: process.env.CLIENT2_PHONE,
    backupPassword: backup,
  },
  {
    email: process.env.CLIENT3_EMAIL ?? '',
    password: process.env.CLIENT3_PASSWORD ?? '',
    phone: process.env.CLIENT3_PHONE,
    backupPassword: backup,
  },
];

/** Strongly-typed view of credentials.env. */
export const env = {
  /** ADB serial of the primary real device (Pixel 7a). */
  androidDevice: process.env.ANDROID_DEVICE ?? '192.168.10.192:33789',
  /** BlueStacks ADB serials (set once instances are running). */
  bluestacks: [process.env.BLUESTACKS_1 ?? '', process.env.BLUESTACKS_2 ?? ''].filter(Boolean),
  /** Device lockscreen PIN for the biometric "Use PIN" fallback. */
  devicePin: process.env.DEVICE_PIN ?? '',

  /** All client identities (mobile). clients[0] is primary. */
  clients,
  /** Primary client (back-compat with single-device specs). */
  client: clients[0],

  /** CPO (Close Protection Officer / agent) account. */
  cpo: {
    email: process.env.CPO_EMAIL ?? '',
    password: process.env.CPO_PASSWORD ?? '',
  } as Account,

  /** Admin web dashboard (Playwright). */
  admin: {
    url: process.env.ADMIN_URL ?? '',
    user: process.env.ADMIN_USER ?? '',
    password: process.env.ADMIN_PASSWORD ?? '',
    otp: process.env.ADMIN_OTP ?? '',
  } as AdminAccount,

  /** Dubai / UAE region agent (operator/supply side). */
  dubaiAgent: {
    email: process.env.DUBAI_AGENT_EMAIL ?? '',
    password: process.env.DUBAI_AGENT_PASSWORD ?? '',
  } as Account,

  /** Dubai / UAE region CPOs (Close Protection Officers). */
  dubaiCpo: [
    { email: process.env.DUBAI_CPO1_EMAIL ?? '', password: process.env.DUBAI_CPO1_PASSWORD ?? '' },
    { email: process.env.DUBAI_CPO2_EMAIL ?? '', password: process.env.DUBAI_CPO2_PASSWORD ?? '' },
  ] as Account[],

  /** Organization / corporate admin account. */
  org: {
    email: process.env.ORG_EMAIL ?? '',
    password: process.env.ORG_PASSWORD ?? '',
  } as Account,
} as const;

export type Role = 'client' | 'cpo';

export function accountFor(role: Role): Account {
  return role === 'cpo' ? env.cpo : env.clients[0];
}

/** Account keys for per-device setup: client1/client2/client3/cpo. */
export type AccountKey = 'client1' | 'client2' | 'client3' | 'cpo';

export function accountByKey(key: AccountKey): Account {
  switch (key) {
    case 'cpo':
      return env.cpo;
    case 'client2':
      return env.clients[1];
    case 'client3':
      return env.clients[2];
    case 'client1':
    default:
      return env.clients[0];
  }
}

/** Map an account key to the role used for gates (cpo has no chat restore). */
export function roleForKey(key: AccountKey): Role {
  return key === 'cpo' ? 'cpo' : 'client';
}
