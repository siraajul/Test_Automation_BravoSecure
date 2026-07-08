import { BasePage } from '../base.page';
import { byTextOrDesc, byTextContains, byDescContains } from '../../../helpers/selectors';

export type JobFilter = 'All' | 'Transfer' | 'Time Slot' | 'Close Protection';

/**
 * CPO "Available Jobs / Job Marketplace". Published bookings appear here as
 * JF-… cards ("0/1 filled" + Apply) once Admin approves them — verified live
 * with JF-9326D0629B20 (a client booking approved on the Ops console).
 *
 * NOTE: do NOT tap Apply in routine tests — it assigns a real CPO to the job.
 */
class JobMarketplacePage extends BasePage {
  protected get rootLocator(): string {
    return byTextContains('Job Marketplace');
  }

  async filterBy(filter: JobFilter): Promise<void> {
    await this.tapByDesc(filter);
  }

  get emptyState(): ChainablePromiseElement {
    return $(byDescContains('No jobs available'));
  }

  /** A published job card by its JF reference (e.g. "JF-9326D0629B20"). */
  jobCard(jfRef: string): ChainablePromiseElement {
    return $(byTextOrDesc(jfRef));
  }

  async hasJob(jfRef: string): Promise<boolean> {
    return this.jobCard(jfRef).isExisting();
  }

  /** ⛔ Applies/accepts the job FOR REAL (CPO assignment). E2E only. */
  get applyButton(): ChainablePromiseElement {
    return $(byTextOrDesc('Apply'));
  }
}

export default new JobMarketplacePage();
