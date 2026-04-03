import { test, expect } from '@playwright/test'

test.describe('HomeScreen', () => {
  test('loads and shows Oyna button', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Halka')).toBeVisible()
    await expect(page.getByRole('button', { name: /oyna/i })).toBeVisible()
  })

  test('level map button navigates to map', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /level haritası/i }).click()
    await expect(page.getByText('Level Haritası')).toBeVisible()
  })

  test('daily challenge button visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: /günlük/i })).toBeVisible()
  })
})

test.describe('LevelMap', () => {
  test('shows level 1 unlocked', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /level haritası/i }).click()
    await expect(page.getByText('1')).toBeVisible()
  })

  test('back button returns to home', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /level haritası/i }).click()
    await page.getByRole('button', { name: /geri/i }).click()
    await expect(page.getByText('Halka')).toBeVisible()
  })
})

test.describe('GameScreen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Clear saved progress so level 1 is available
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('level 1 loads with tubes visible', async ({ page }) => {
    await page.getByRole('button', { name: /oyna/i }).click()
    // Tubes are rendered as role=button
    const tubes = page.getByRole('button', { name: /tüp/i })
    await expect(tubes.first()).toBeVisible()
  })

  test('undo button disabled on fresh level', async ({ page }) => {
    await page.getByRole('button', { name: /oyna/i }).click()
    const undoBtn = page.getByRole('button', { name: /geri al/i })
    await expect(undoBtn).toBeDisabled()
  })

  test('hint button toggles hint state', async ({ page }) => {
    await page.getByRole('button', { name: /oyna/i }).click()
    const hintBtn = page.getByRole('button', { name: /i̇pucu/i })
    await hintBtn.click()
    // After hint, at least one tube should have pulse class (hint indicator)
    const hintTube = page.locator('[class*="pulse"]').first()
    await expect(hintTube).toBeVisible({ timeout: 2000 })
  })

  test('reset button returns to initial state', async ({ page }) => {
    await page.getByRole('button', { name: /oyna/i }).click()
    // Click a tube, then reset
    const tubes = page.getByRole('button', { name: /tüp/i })
    await tubes.first().click()
    await page.getByRole('button', { name: /yeniden/i }).click()
    // Undo should still be disabled after reset
    await expect(page.getByRole('button', { name: /geri al/i })).toBeDisabled()
  })

  test('back button from game goes to level map', async ({ page }) => {
    await page.getByRole('button', { name: /oyna/i }).click()
    await page.getByRole('button', { name: /geri/i }).click()
    await expect(page.getByText('Level Haritası')).toBeVisible()
  })
})

test.describe('Daily Challenge', () => {
  test('daily screen loads', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /günlük/i }).click()
    await expect(page.getByText('Günlük Bulmaca')).toBeVisible()
  })

  test('daily back button returns home', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /günlük/i }).click()
    await page.getByRole('button', { name: /geri/i }).click()
    await expect(page.getByText('Halka')).toBeVisible()
  })
})

test.describe('Accessibility', () => {
  test('tubes have aria-labels', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.getByRole('button', { name: /oyna/i }).click()
    const labeled = page.getByRole('button', { name: /tüp \d+/i })
    await expect(labeled.first()).toBeVisible()
  })
})
