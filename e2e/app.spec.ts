import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('displays login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('ProjectFlow')).toBeVisible();
    await expect(page.getByText('Sign in to your account')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('shows demo account credentials', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/admin@demo.com/)).toBeVisible();
    await expect(page.getByText(/manager@demo.com/)).toBeVisible();
    await expect(page.getByText(/member@demo.com/)).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[id="email"]', 'wrong@email.com');
    await page.fill('input[id="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 10000 });
  });

  test('logs in with valid owner credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[id="email"]', 'admin@demo.com');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/', { timeout: 10000 });
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login', { timeout: 10000 });
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[id="email"]', 'admin@demo.com');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
  });

  test('displays dashboard stats', async ({ page }) => {
    await expect(page.getByText('Total Projects')).toBeVisible();
    await expect(page.getByText('Completed Tasks')).toBeVisible();
    await expect(page.getByText('Team Members')).toBeVisible();
  });

  test('shows New Project button', async ({ page }) => {
    await expect(page.getByText('New Project')).toBeVisible();
  });

  test('navigates to projects via sidebar', async ({ page }) => {
    await page.getByText('Projects').click();
    await expect(page).toHaveURL('/projects');
    await expect(page.getByText('Manage and track all your projects')).toBeVisible();
  });

  test('navigates to tasks via sidebar', async ({ page }) => {
    await page.getByText('Tasks').click();
    await expect(page).toHaveURL('/tasks');
  });
});

test.describe('Projects', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[id="email"]', 'admin@demo.com');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
  });

  test('lists projects', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.getByText('Projects')).toBeVisible();
  });

  test('creates a new project', async ({ page }) => {
    await page.goto('/projects/new');
    await page.fill('input[id="name"]', 'E2E Test Project');
    await page.fill('textarea[id="description"]', 'Created by Playwright');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/projects\//, { timeout: 10000 });
  });

  test('opens project detail', async ({ page }) => {
    await page.goto('/projects');
    const viewButton = page.getByText('View Project').first();
    await viewButton.click();
    await expect(page).toHaveURL(/\/projects\//, { timeout: 10000 });
  });
});

test.describe('Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[id="email"]', 'admin@demo.com');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
  });

  test('views project tasks and Gantt chart', async ({ page }) => {
    await page.goto('/projects');
    const viewButton = page.getByText('View Project').first();
    await viewButton.click();
    await page.waitForURL(/\/projects\//, { timeout: 10000 });
    await expect(page.getByText('Gantt')).toBeVisible();
  });

  test('switches to Gantt tab', async ({ page }) => {
    await page.goto('/projects');
    const viewButton = page.getByText('View Project').first();
    await viewButton.click();
    await page.waitForURL(/\/projects\//, { timeout: 10000 });
    await page.getByText('Gantt').click();
    await expect(page.getByText('Gantt Chart')).toBeVisible({ timeout: 5000 });
  });
});
