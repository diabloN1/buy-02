import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  // retries: 2,
  reporter: [
    ["html", { open: "never" }],
    ["list"],
    ["junit", { outputFile: "test-reports/playwright-results.xml" }],
  ],

  use: {
    baseURL: "https://localhost:4200",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",

    // Accept selfsigned certs
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  timeout: 60_000,
});
