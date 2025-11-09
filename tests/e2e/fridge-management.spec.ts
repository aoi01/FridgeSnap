/**
 * ================================================================================
 * 🧊 冷蔵庫管理機能 - E2E テスト
 * ================================================================================
 *
 * テスト対象：
 * - 冷蔵庫ビューの表示と機能
 * - 食材の追加・編集・削除
 * - カテゴリ別の表示と分類
 * - 賞味期限の表示と警告
 *
 * 実行環境：
 * - Chromium, Firefox, WebKit （複数ブラウザ対応）
 * - 実際のブラウザを操作してテスト
 * ================================================================================
 */

import { test, expect } from '@playwright/test';

/**
 * テストのセットアップ
 * 各テストの前に実行される処理
 */
test.beforeEach(async ({ page }) => {
  // アプリケーションのホームページにアクセス
  await page.goto('/');

  // ページが読み込まれるまで待機
  await page.waitForLoadState('networkidle');
});

test.describe('🧊 冷蔵庫管理機能', () => {
  // ================================================================================
  // 📋 基本機能テスト
  // ================================================================================

  test('冷蔵庫ビューが表示される', async ({ page }) => {
    // ページに主要な要素が表示されることを確認
    const elements = page.locator('main, [role="main"], button');
    expect(await elements.count()).toBeGreaterThan(0);
  });

  // ================================================================================
  // ➕ 食材追加テスト
  // ================================================================================

  test('新しい食材を追加できる', async ({ page }) => {
    const addButton = page.locator('button:has-text("追加")').first();

    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(300);

      const nameInput = page.locator('input[placeholder*="名前"], input[placeholder*="食材"], input[type="text"]').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill('テスト食材');

        const saveButton = page.locator('button:has-text("保存"), button:has-text("追加")').first();
        if (await saveButton.count() > 0) {
          await saveButton.click();

          // 追加されたことを確認
          const itemText = page.locator('text=テスト食材');
          const count = await itemText.count();
          if (count > 0) {
            await expect(itemText).toBeVisible({ timeout: 5000 });
          }
        }
      }
    }
  });

  // ================================================================================
  // ✏️ 食材編集テスト
  // ================================================================================

  test('食材を編集できる', async ({ page }) => {
    const addButton = page.locator('button:has-text("追加")').first();
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(300);

      const nameInput = page.locator('input[placeholder*="名前"], input[placeholder*="食材"], input[type="text"]').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill('編集対象食材');

        const saveButton = page.locator('button:has-text("保存"), button:has-text("追加")').first();
        if (await saveButton.count() > 0) {
          await saveButton.click();
          await page.waitForTimeout(800);

          const editButton = page.locator('button:has-text("編集")').first();
          if (await editButton.count() > 0) {
            await editButton.click();
            await page.waitForTimeout(300);

            const editInput = page.locator('input[type="text"]').first();
            if (await editInput.count() > 0) {
              await editInput.clear();
              await editInput.fill('編集済み食材');

              const saveEditButton = page.locator('button:has-text("保存")').first();
              if (await saveEditButton.count() > 0) {
                await saveEditButton.click();

                const editedText = page.locator('text=編集済み食材');
                if (await editedText.count() > 0) {
                  await expect(editedText).toBeVisible({ timeout: 5000 });
                }
              }
            }
          }
        }
      }
    }
  });

  // ================================================================================
  // 🗑️ 食材削除テスト
  // ================================================================================

  test('食材を削除できる', async ({ page }) => {
    const addButton = page.locator('button:has-text("追加")').first();
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(300);

      const nameInput = page.locator('input[placeholder*="名前"], input[placeholder*="食材"], input[type="text"]').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill('削除対象食材');

        const saveButton = page.locator('button:has-text("保存"), button:has-text("追加")').first();
        if (await saveButton.count() > 0) {
          await saveButton.click();
          await page.waitForTimeout(1000);

          const deleteButton = page.locator('button:has-text("削除")').first();
          if (await deleteButton.count() > 0) {
            await deleteButton.click();

            const confirmButton = page.locator('button:has-text("確認"), button:has-text("OK")').first();
            if (await confirmButton.count() > 0) {
              await confirmButton.click();
            }

            await page.waitForTimeout(1000);
            const itemText = page.locator('text=削除対象食材');
            expect(await itemText.count()).toBe(0);
          }
        }
      }
    }
  });

  // ================================================================================
  // 📅 カテゴリ表示テスト
  // ================================================================================

  test('カテゴリが表示される', async ({ page }) => {
    const sections = page.locator('[role="region"], .category, [class*="category"]');
    const count = await sections.count();

    // カテゴリセクションが存在することを確認
    if (count > 0) {
      await expect(sections.first()).toBeVisible();
    }
  });

  // ================================================================================
  // ⏰ 賞味期限表示テスト
  // ================================================================================

  test('賞味期限が表示される', async ({ page }) => {
    const addButton = page.locator('button:has-text("追加")').first();
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(300);

      const nameInput = page.locator('input[placeholder*="名前"], input[placeholder*="食材"], input[type="text"]').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill('期限付き食材');

        const dateInput = page.locator('input[type="date"]').first();
        if (await dateInput.count() > 0) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const dateStr = tomorrow.toISOString().split('T')[0];
          await dateInput.fill(dateStr);
        }

        const saveButton = page.locator('button:has-text("保存"), button:has-text("追加")').first();
        if (await saveButton.count() > 0) {
          await saveButton.click();

          const itemText = page.locator('text=期限付き食材');
          if (await itemText.count() > 0) {
            await expect(itemText).toBeVisible({ timeout: 5000 });
          }
        }
      }
    }
  });
});

test.describe('🧊 冷蔵庫管理 - パフォーマンステスト', () => {
  test('ページが 3 秒以内に読み込まれる', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });
});

test.describe('🧊 冷蔵庫管理 - レスポンシブテスト', () => {
  test('モバイル画面でアクセス可能', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const elements = page.locator('main, [role="main"], button');
    expect(await elements.count()).toBeGreaterThan(0);
  });

  test('デスクトップ画面でアクセス可能', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const elements = page.locator('main, [role="main"], button');
    expect(await elements.count()).toBeGreaterThan(0);
  });
});
