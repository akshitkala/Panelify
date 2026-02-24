import { test, expect } from '@playwright/test';

test.describe('Panelify Full Workflow', () => {
    test('Land -> Connect -> Scan -> Edit -> Publish', async ({ page }) => {
        // 1. Landing Page
        await page.goto('/');
        await expect(page.locator('h1')).toContainText('Make your static sites dynamic.');

        // 2. Mock Login
        await page.route('**/api/auth/**', async route => {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { id: 'test-uid' } }) });
        });

        await page.getByRole('button', { name: /Get Started/i }).first().click();
        await page.goto('/login'); // Force navigate to bypass actual OAuth redirect

        // 3. Connect Repo
        await page.route('**/api/repos', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify([{ name: 'test-site', full_name: 'user/test-site', description: 'A Next.js site' }])
            });
        });

        await page.goto('/connect');
        await expect(page.locator('text=Connect your repo')).toBeVisible();
        await page.locator('text=test-site').click();

        // Platform detection mock
        await page.route('**/api/platform/detect', async route => {
            await route.fulfill({ status: 200, body: JSON.stringify({ platform: 'vercel' }) });
        });

        await expect(page.locator('text=Vercel')).toBeVisible();
        await page.getByRole('button', { name: /Continue/i }).click();

        // 4. Scanning
        await page.route('**/api/scan/files', async route => {
            await route.fulfill({ status: 200, body: JSON.stringify([{ path: 'Hero.tsx', content: '<h1>Hello</h1>' }]) });
        });
        await page.route('**/api/scan/analyze', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify([{ component: 'Hero.tsx', field_id: 'title', label: 'Title', type: 'text', current_value: 'Hello', confidence: 0.9 }])
            });
        });

        await expect(page.locator('text=Scanning your site')).toBeVisible();
        await expect(page.locator('text=Confirm 1 Fields')).toBeVisible({ timeout: 10000 });

        // 5. Confirmation
        await page.getByRole('button', { name: /Confirm 1 Fields/i }).click();

        // 6. Setup
        await page.route('**/api/setup/backup', async route => {
            await route.fulfill({ status: 200, body: JSON.stringify({ branch_name: 'backup' }) });
        });
        await page.route('**/api/setup/refactor', async route => {
            await route.fulfill({ status: 200, body: JSON.stringify([]) });
        });
        await page.route('**/api/setup/commit', async route => {
            await route.fulfill({ status: 200, body: JSON.stringify({ commit_sha: 'sha' }) });
        });

        await expect(page.locator('text=Setting up your panel')).toBeVisible();
        await expect(page.locator('text=Your Panel')).toBeVisible({ timeout: 10000 });

        // 7. Dashboard & Edit
        await page.locator('text=hero').click();
        await expect(page.locator('text=Editing section: hero')).toBeVisible();

        await page.locator('input').first().fill('New Title');
        await page.getByRole('button', { name: /Save Changes/i }).click();

        // 8. Publish
        await page.getByRole('button', { name: /Review & Publish/i }).click();
        await expect(page.locator('text=Review Changes')).toBeVisible();

        await page.route('**/api/content/write', async route => {
            await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
        });

        await page.getByRole('button', { name: /Publish Now/i }).click();
        await expect(page.locator('text=Publishing your changes')).toBeVisible();
        await expect(page.locator('text=Successfully Published!')).toBeVisible({ timeout: 15000 });
    });
});
