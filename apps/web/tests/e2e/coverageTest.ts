/* eslint-disable react-hooks/rules-of-hooks */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { expect as baseExpect, test as base, type BrowserContext } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nycOutputDir = path.join(__dirname, '..', '.nyc_output');
const coverageBindingName = 'collectIstanbulCoverage';

type CoverageWindow = Window & {
  __coverage__?: unknown;
  [coverageBindingName: string]: unknown;
};

const instrumentedContexts = new WeakSet<BrowserContext>();

const ensureOutputDir = async () => {
  await fs.promises.mkdir(nycOutputDir, { recursive: true });
};

const writeCoverageFile = (coverageJSON: string) => {
  const filename = `playwright_coverage_${crypto.randomBytes(16).toString('hex')}.json`;
  const filePath = path.join(nycOutputDir, filename);
  fs.writeFileSync(filePath, coverageJSON);
};

const flushCoverage = async (context: BrowserContext) => {
  try {
    await ensureOutputDir();
    const pages = context.pages();
    await Promise.all(
      pages.map(async (page) => {
        if (page.isClosed()) return;
        try {
          await page.evaluate((bindingName) => {
            const coverageWindow = window as unknown as CoverageWindow;
            const coverage = coverageWindow.__coverage__;
            if (!coverage) return;
            const binding = coverageWindow[bindingName];
            if (typeof binding === 'function') {
              (binding as (payload: string) => void)(JSON.stringify(coverage));
            }
          }, coverageBindingName);
        } catch {
          // Ignore pages that can no longer be evaluated (already torn down).
        }
      })
    );
  } catch {
    // Best-effort; skip bubbling coverage flush errors into the test run.
  }
};

const instrumentContext = async (context: BrowserContext) => {
  if (instrumentedContexts.has(context)) {
    return;
  }
  instrumentedContexts.add(context);
  await ensureOutputDir();

  await context.exposeBinding(
    coverageBindingName,
    (_source, coverageJSON: string | undefined) => {
      if (!coverageJSON) return;
      writeCoverageFile(coverageJSON);
    },
    { handle: false }
  );

  await context.addInitScript((bindingName) => {
    const flush = () => {
      const coverageWindow = window as unknown as CoverageWindow;
      const coverage = coverageWindow.__coverage__;
      if (!coverage) return;
      const binding = coverageWindow[bindingName];
      if (typeof binding === 'function') {
        (binding as (payload: string) => void)(JSON.stringify(coverage));
      }
    };
    window.addEventListener('beforeunload', flush);
    window.addEventListener('pagehide', flush);
  }, coverageBindingName);

  const originalClose = context.close.bind(context);
  context.close = async (...args) => {
    await flushCoverage(context);
    return originalClose(...args);
  };
};

export const test = base.extend({
  browser: async ({ browser }, use) => {
    const originalNewContext = browser.newContext.bind(browser);
    browser.newContext = async (...args) => {
      const context = await originalNewContext(...args);
      await instrumentContext(context);
      return context;
    };
    await use(browser);
  },
  context: async ({ browser }, use) => {
    const context = await browser.newContext();
    await instrumentContext(context);
    await use(context);
    if (base.info().status !== 'interrupted') {
      await flushCoverage(context);
      await context.close();
    }
  },
});

export const expect = baseExpect;
