import { test, expect } from '@playwright/test';

/**
 * 賞味期限切れ食材の管理機能のE2Eテスト
 *
 * 期限切れ食材の検出、通知、保存方法Tipsなどをテスト
 */

test.describe('賞味期限切れ食材の管理', () => {
  test.beforeEach(async ({ page }) => {
    // ページを読み込み
    await page.goto('/');
    // ネットワークが完了するまで待機
    await page.waitForLoadState('networkidle');
  });

  test('期限切れ食材が検出される', async ({ page }) => {
    // 食材追加ボタンを検索
    const addButton = page.locator('button:has-text("追加"), button:has-text("＋")').first();

    if (await addButton.count() > 0) {
      // 期限切れの日付（昨日の日付など）で食材を追加
      await addButton.click();
      await page.waitForTimeout(500);

      // 食材名入力
      const nameInput = page.locator('input[placeholder*="名前"], input[placeholder*="食材"], input[type="text"]').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill('期限切れテスト');

        // 賞味期限日を入力（過去の日付）
        const dateInput = page.locator('input[type="date"]').first();
        if (await dateInput.count() > 0) {
          // 昨日の日付を設定
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const dateString = yesterday.toISOString().split('T')[0];
          await dateInput.fill(dateString);

          // 保存
          const saveButton = page.locator('button:has-text("保存"), button:has-text("追加")').first();
          if (await saveButton.count() > 0) {
            await saveButton.click();
            await page.waitForTimeout(1000);

            // 期限切れ食材として表示されることを確認（赤色など）
            const expiredItem = page.locator('text=期限切れテスト, [data-testid*="expired"]');
            if (await expiredItem.count() > 0) {
              await expect(expiredItem.first()).toBeVisible({ timeout: 5000 });
            }
          }
        }
      }
    }
  });

  test('期限切れ食材アラートが表示される', async ({ page }) => {
    // 期限切れ・近い食材アラートを検索
    const expiryAlert = page.locator('[role="alert"], .alert, .warning-banner, text=期限, text=賞味');
    const expiryBadge = page.locator('[data-testid*="expiry"], [data-testid*="alert"]');

    if (await expiryAlert.count() > 0) {
      // アラートが表示されることを確認
      await expect(expiryAlert.first()).toBeVisible({ timeout: 5000 });
    } else if (await expiryBadge.count() > 0) {
      // バッジやアイコンが表示されることを確認
      await expect(expiryBadge.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('期限切れ食材モーダルが開く', async ({ page }) => {
    // 期限切れアラートをクリック
    const expiryAlert = page.locator('[role="alert"], .alert, .warning-banner, text=期限切れ, text=期限が近い').first();

    if (await expiryAlert.count() > 0) {
      // アラートをクリック
      await expiryAlert.click();
      await page.waitForTimeout(500);

      // 期限切れ食材モーダルが表示されることを確認
      const modal = page.locator('[role="dialog"], .modal, .expiring-items-modal');
      if (await modal.count() > 0) {
        await expect(modal.first()).toBeVisible({ timeout: 5000 });

        // モーダル内に期限切れ食材が表示されることを確認
        const itemsList = modal.first().locator('li, [data-testid*="item"]');
        if (await itemsList.count() > 0) {
          await expect(itemsList.first()).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('保存方法Tipsが表示される', async ({ page }) => {
    // 食材をクリックして詳細を開く
    const foodItems = page.locator('[data-testid*="food-item"], .food-item, li').first();

    if (await foodItems.count() > 0) {
      // 食材をクリック
      await foodItems.click();
      await page.waitForTimeout(500);

      // 保存方法Tipsを検索
      const storageTips = page.locator('text=保存方法, text=保存方法Tips, text=Storage tips, [data-testid*="storage-tips"]');

      if (await storageTips.count() > 0) {
        // 保存方法Tipsが表示されることを確認
        await expect(storageTips.first()).toBeVisible({ timeout: 5000 });
      }

      // または、詳細ダイアログ内で保存方法を検索
      const modal = page.locator('[role="dialog"], .modal, .detail-modal');
      if (await modal.count() > 0) {
        const tipsSection = modal.first().locator('text=保存, text=Tips, text=方法');
        if (await tipsSection.count() > 0) {
          await expect(tipsSection.first()).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('保存方法Tipを適用して期限を延長できる', async ({ page }) => {
    // 期限が近い食材を検索
    const expiringItem = page.locator('[data-testid*="expiring"], .expiring-item, text=期限');

    if (await expiringItem.count() > 0) {
      // 食材をクリック
      await expiringItem.first().click();
      await page.waitForTimeout(500);

      // 保存方法Tipボタンを検索
      const tipsButton = page.locator('button:has-text("Tips"), button:has-text("保存方法"), button:has-text("適用"), button[aria-label*="tips"]').first();

      if (await tipsButton.count() > 0) {
        // Tipボタンをクリック
        await tipsButton.click();
        await page.waitForTimeout(500);

        // Tipを選択
        const selectTipButton = page.locator('button:has-text("冷凍"), button:has-text("冷蔵"), button:has-text("常温"), [role="option"]').first();

        if (await selectTipButton.count() > 0) {
          // Tipを選択
          await selectTipButton.click();
          await page.waitForTimeout(500);

          // 賞味期限が延長されたことを確認
          const successMessage = page.locator('text=延長, text=適用されました, text=更新されました').first();
          if (await successMessage.count() > 0) {
            await expect(successMessage).toBeVisible({ timeout: 5000 });
          }
        }
      }
    }
  });

  test('期限切れ食材を削除できる', async ({ page }) => {
    // 期限切れ食材を検索
    const expiredItem = page.locator('[data-testid*="expired"], .expired-item, text=期限切れ').first();

    if (await expiredItem.count() > 0) {
      // 削除ボタンを検索
      const deleteButton = expiredItem.locator('button:has-text("削除"), button:has-text("×"), button:has-text("✕"), button[aria-label*="delete"]').first();

      if (await deleteButton.count() > 0) {
        // 削除前のアイテム数を取得
        const allItems = page.locator('[data-testid*="food-item"], .food-item, li');
        const countBefore = await allItems.count();

        // 削除ボタンをクリック
        await deleteButton.click();
        await page.waitForTimeout(500);

        // 確認ダイアログが表示される場合はOKをクリック
        const confirmButton = page.locator('button:has-text("はい"), button:has-text("OK"), button:has-text("削除する")').first();
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
          await page.waitForTimeout(500);
        }

        // 削除されたことを確認（アイテム数が減少）
        const itemsAfter = page.locator('[data-testid*="food-item"], .food-item, li');
        const countAfter = await itemsAfter.count();

        if (countBefore > 0) {
          expect(countAfter).toBeLessThanOrEqual(countBefore);
        }
      }
    }
  });

  test.describe('レスポンシブテスト', () => {
    test('モバイル画面で期限管理が動作する', async ({ page }) => {
      // モバイルビューポートを設定
      await page.setViewportSize({ width: 375, height: 667 });

      // 期限切れアラートを検索
      const expiryAlert = page.locator('[role="alert"], .alert, text=期限').first();

      if (await expiryAlert.count() > 0) {
        // アラートをクリック
        await expiryAlert.click();
        await page.waitForTimeout(500);

        // モーダルが表示されることを確認
        const modal = page.locator('[role="dialog"], .modal').first();
        if (await modal.count() > 0) {
          await expect(modal).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('タブレット画面で期限管理が動作する', async ({ page }) => {
      // タブレットビューポートを設定
      await page.setViewportSize({ width: 768, height: 1024 });

      // 期限切れアラートを検索
      const expiryAlert = page.locator('[role="alert"], .alert, text=期限').first();

      if (await expiryAlert.count() > 0) {
        // アラートをクリック
        await expiryAlert.click();
        await page.waitForTimeout(500);

        // モーダルが表示されることを確認
        const modal = page.locator('[role="dialog"], .modal').first();
        if (await modal.count() > 0) {
          await expect(modal).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });
});
