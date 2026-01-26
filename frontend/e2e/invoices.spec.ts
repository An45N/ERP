import { test, expect } from '@playwright/test';

test.describe('Invoice Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Navigate to invoices
    await page.goto('/invoices');
  });

  test('should display invoices list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /invoices/i })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should open create invoice modal', async ({ page }) => {
    await page.getByRole('button', { name: /new invoice/i }).click();
    
    await expect(page.getByRole('heading', { name: /create invoice/i })).toBeVisible();
    await expect(page.getByLabel(/customer/i)).toBeVisible();
  });

  test('should create new invoice', async ({ page }) => {
    await page.getByRole('button', { name: /new invoice/i }).click();
    
    // Fill form
    await page.getByLabel(/customer/i).selectOption({ index: 1 });
    await page.getByLabel(/invoice date/i).fill('2024-01-15');
    await page.getByLabel(/due date/i).fill('2024-02-15');
    await page.getByLabel(/amount/i).fill('1000');
    
    // Submit
    await page.getByRole('button', { name: /save/i }).click();
    
    // Should show success message
    await expect(page.getByText(/invoice created successfully/i)).toBeVisible();
  });

  test('should search invoices', async ({ page }) => {
    const searchBox = page.getByPlaceholder(/search/i);
    await searchBox.fill('INV-001');
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Should filter results
    const rows = page.getByRole('row');
    await expect(rows).toContainText('INV-001');
  });

  test('should export invoice to PDF', async ({ page }) => {
    // Click first invoice's export button
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export pdf/i }).first().click();
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('should delete invoice', async ({ page }) => {
    // Click delete button
    await page.getByRole('button', { name: /delete/i }).first().click();
    
    // Confirm deletion
    page.on('dialog', dialog => dialog.accept());
    
    // Should show success message
    await expect(page.getByText(/invoice deleted/i)).toBeVisible();
  });
});
