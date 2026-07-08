import type { Page } from '@playwright/test';
import { env } from '../../config/env';
import { AdminLoginPage } from '../pages/admin.login.page';
import { AdminDashboardPage } from '../pages/admin.dashboard.page';
import { AdminBookingsPage } from '../pages/admin.bookings.page';

/**
 * High-level Admin (web) actions. Login (phone + password + OTP) is verified;
 * approveLatestBooking depends on a real Pending Ops booking (the E2E creates
 * one from the client app).
 */
export const AdminFlow = {
  async login(page: Page): Promise<AdminDashboardPage> {
    const login = new AdminLoginPage(page);
    await login.goto(env.admin.url);
    await login.login(env.admin.user, env.admin.password, env.admin.otp);
    const dashboard = new AdminDashboardPage(page);
    await page.waitForURL(/\/dashboard/);
    return dashboard;
  },

  /** Approve the oldest booking in the Pending Ops queue → publishes to CPO feed. */
  async approveLatestBooking(page: Page): Promise<void> {
    const bookings = new AdminBookingsPage(page);
    await bookings.goto(env.admin.url);
    await bookings.approveFirstPending();
  },
};
