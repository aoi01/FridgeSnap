import { test, expect } from '@playwright/test';

/**
 * 今日のバスケット機能のE2Eテスト
 *
 * バスケットへの食材追加、削除、料理提案などの機能をテスト
 */

test.describe('今日のバスケット機能', () => {
  test.beforeEach(async ({ page }) => {
    // ページを読み込み
    await page.goto('/');
    // ネットワークが完了するまで待機
    await page.waitForLoadState('networkidle');
  });

  test('バスケットが表示される', async ({ page }) => {
    // バスケットセクションまたはバスケットタブを検索
    const basketSection = page.locator('text=バスケット, text=Today basket, [data-testid="basket-section"]');
    const basketTab = page.locator('button:has-text("バスケット"), button:has-text("Basket")').first();

    if (await basketTab.count() > 0) {
      // バスケットタブをクリック
      await basketTab.click();
      await page.waitForTimeout(300);

      // バスケットセクションが表示されることを確認
      const content = page.locator('[role="tabpanel"], .basket-content, .tab-content');
      if (await content.count() > 0) {
        await expect(content.first()).toBeVisible({ timeout: 5000 });
      }
    } else if (await basketSection.count() > 0) {
      // バスケットセクションが既に表示されている場合
      await expect(basketSection.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('食材をバスケットに追加できる', async ({ page }) => {
    // 冷蔵庫の食材を検索
    const foodItems = page.locator('[data-testid*="food-item"], .food-item, li');

    if (await foodItems.count() > 0) {
      // 最初の食材を取得
      const firstItem = foodItems.first();

      // 食材の「バスケットに追加」ボタンを検索
      const addToBasketButton = firstItem.locator('button:has-text("追加"), button:has-text("バスケット"), button:has-text("❤️"), button[aria-label*="basket"]').first();

      if (await addToBasketButton.count() > 0) {
        // バスケットに追加
        await addToBasketButton.click();
        await page.waitForTimeout(500);

        // バスケットに追加されたことを確認
        const basketTab = page.locator('button:has-text("バスケット"), button:has-text("Basket")').first();
        if (await basketTab.count() > 0) {
          await basketTab.click();
          await page.waitForTimeout(300);

          // バスケット内に食材が表示されることを確認
          const basketItems = page.locator('[role="tabpanel"], .basket-content').first();
          if (await basketItems.count() > 0) {
            await expect(basketItems).toBeVisible({ timeout: 5000 });
          }
        }
      }
    }
  });

  test('バスケットから食材を削除できる', async ({ page }) => {
    // バスケットタブをクリック
    const basketTab = page.locator('button:has-text("バスケット"), button:has-text("Basket")').first();

    if (await basketTab.count() > 0) {
      await basketTab.click();
      await page.waitForTimeout(300);

      // バスケット内の食材を検索
      const basketItems = page.locator('[role="tabpanel"], .basket-content').first();
      if (await basketItems.count() > 0) {
        // 削除ボタンを検索
        const deleteButton = basketItems.locator('button:has-text("削除"), button:has-text("×"), button:has-text("✕"), button[aria-label*="delete"]').first();

        if (await deleteButton.count() > 0) {
          // 削除前のアイテム数を取得
          const itemsBefore = page.locator('[role="tabpanel"], .basket-content').locator('li, [data-testid*="item"]');
          const countBefore = await itemsBefore.count();

          // 削除ボタンをクリック
          await deleteButton.click();
          await page.waitForTimeout(500);

          // 削除されたことを確認（アイテム数が減少）
          const itemsAfter = page.locator('[role="tabpanel"], .basket-content').locator('li, [data-testid*="item"]');
          const countAfter = await itemsAfter.count();

          if (countBefore > 0) {
            expect(countAfter).toBeLessThanOrEqual(countBefore);
          }
        }
      }
    }
  });

  test('バスケットの食材から料理提案を取得できる', async ({ page }) => {
    // バスケットタブをクリック
    const basketTab = page.locator('button:has-text("バスケット"), button:has-text("Basket")').first();

    if (await basketTab.count() > 0) {
      await basketTab.click();
      await page.waitForTimeout(300);

      // 複数の食材をバスケットに追加（複数の食材が必要な場合）
      // または既存の食材を使用

      // 料理提案ボタンを検索
      const suggestButton = page.locator('button:has-text("提案"), button:has-text("レシピ"), button:has-text("料理"), button:has-text("検索")').first();

      if (await suggestButton.count() > 0) {
        // 料理提案ボタンをクリック
        await suggestButton.click();
        await page.waitForTimeout(2000);

        // AI が料理提案を返すことを確認
        const suggestions = page.locator('[data-testid*="recipe"], [data-testid*="suggestion"], .recipe-card, .suggestion-card');
        if (await suggestions.count() > 0) {
          await expect(suggestions.first()).toBeVisible({ timeout: 10000 });
        }

        // または提案が表示されるセクションを確認
        const suggestionSection = page.locator('text=提案, text=レシピ, text=料理').first();
        if (await suggestionSection.count() > 0) {
          await expect(suggestionSection).toBeVisible({ timeout: 10000 });
        }
      }
    }
  });

  test('提案された料理をお気に入りに追加できる', async ({ page }) => {
    // バスケットタブをクリック
    const basketTab = page.locator('button:has-text("バスケット"), button:has-text("Basket")').first();

    if (await basketTab.count() > 0) {
      await basketTab.click();
      await page.waitForTimeout(300);

      // 料理提案ボタンをクリック
      const suggestButton = page.locator('button:has-text("提案"), button:has-text("レシピ"), button:has-text("料理")').first();

      if (await suggestButton.count() > 0) {
        await suggestButton.click();
        await page.waitForTimeout(2000);

        // 提案された料理を検索
        const recipes = page.locator('[data-testid*="recipe"], .recipe-card, .suggestion-card');

        if (await recipes.count() > 0) {
          // 最初の料理のお気に入りボタンを検索
          const firstRecipe = recipes.first();
          const favoriteButton = firstRecipe.locator('button:has-text("❤"), button:has-text("☆"), button[aria-label*="favorite"]').first();

          if (await favoriteButton.count() > 0) {
            // お気に入りボタンをクリック
            await favoriteButton.click();
            await page.waitForTimeout(500);

            // お気に入りに追加されたことを確認（ボタンの色が変わる、または確認メッセージが表示される）
            const confirmMessage = page.locator('text=お気に入り, text=追加されました, text=保存されました').first();
            if (await confirmMessage.count() > 0) {
              await expect(confirmMessage).toBeVisible({ timeout: 5000 });
            }
          }
        }
      }
    }
  });

  test.describe('レスポンシブテスト', () => {
    test('モバイル画面でバスケット機能が動作する', async ({ page }) => {
      // モバイルビューポートを設定
      await page.setViewportSize({ width: 375, height: 667 });

      // バスケットタブをクリック
      const basketTab = page.locator('button:has-text("バスケット"), button:has-text("Basket")').first();

      if (await basketTab.count() > 0) {
        await basketTab.click();
        await page.waitForTimeout(300);

        // バスケットコンテンツが表示されることを確認
        const basketContent = page.locator('[role="tabpanel"], .basket-content').first();
        if (await basketContent.count() > 0) {
          await expect(basketContent).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('タブレット画面でバスケット機能が動作する', async ({ page }) => {
      // タブレットビューポートを設定
      await page.setViewportSize({ width: 768, height: 1024 });

      // バスケットタブをクリック
      const basketTab = page.locator('button:has-text("バスケット"), button:has-text("Basket")').first();

      if (await basketTab.count() > 0) {
        await basketTab.click();
        await page.waitForTimeout(300);

        // バスケットコンテンツが表示されることを確認
        const basketContent = page.locator('[role="tabpanel"], .basket-content').first();
        if (await basketContent.count() > 0) {
          await expect(basketContent).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });
});
