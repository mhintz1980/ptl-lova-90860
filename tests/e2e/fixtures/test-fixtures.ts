import { test as base, Page } from '@playwright/test';
import { SchedulingPageHelper } from '../helpers/test-utils';

// Define custom fixtures
export type TestOptions = Record<string, unknown>;

// Extend the base test with custom fixtures
export const test = base.extend<TestOptions & { schedulingPage: SchedulingPageHelper }>({
  // Custom fixture for scheduling page helper
  schedulingPage: async ({ page }: { page: Page }, helperUse: (helper: SchedulingPageHelper) => Promise<void>) => {
    const helper = new SchedulingPageHelper(page);
    await helperUse(helper);
  },
});

// Export everything from the base test
export { expect } from '@playwright/test';

// Export common test data and configurations
export const TestConfig = {
  baseURL: 'http://localhost:3000',
  timeouts: {
    default: 10000,
    long: 30000,
    short: 5000
  },
  viewports: {
    desktop: { width: 1200, height: 800 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
  }
};

// Re-export for convenience
export { SchedulingPageHelper } from '../helpers/test-utils';
