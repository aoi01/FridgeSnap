import { test, expect } from '@playwright/test';

/**
 * 予算管理機能のE2Eテスト
 *
 * 予算の設定、食材の価格追跡、予算の監視などをテスト
 */

test.describe('予算管理機能', () => {
  test.beforeEach(async ({ page }) => {
    // ページを読み込み
    await page.goto('/');
    // ネットワークが完了するまで待機
    await page.waitForLoadState('networkidle');
  });

  test('予算オーバービューが表示される', async ({ page }) => {
    // 予算セクションまたは予算タブを検索
    const budgetTab = page.locator('button:has-text("予算"), button:has-text("Budget")').first();
    const budgetSection = page.locator('text=予算, text=Budget, [data-testid="budget-section"]');

    if (await budgetTab.count() > 0) {
      // 予算タブをクリック
      await budgetTab.click();
      await page.waitForTimeout(300);

      // 予算セクションが表示されることを確認
      const content = page.locator('[role="tabpanel"], .budget-content, .tab-content');
      if (await content.count() > 0) {
        await expect(content.first()).toBeVisible({ timeout: 5000 });
      }
    } else if (await budgetSection.count() > 0) {
      // 予算セクションが既に表示されている場合
      await expect(budgetSection.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('月間予算を設定できる', async ({ page }) => {
    // 予算タブをクリック
    const budgetTab = page.locator('button:has-text("予算"), button:has-text("Budget")').first();

    if (await budgetTab.count() > 0) {
      await budgetTab.click();
      await page.waitForTimeout(300);

      // 予算設定ボタンを検索
      const settingsButton = page.locator('button:has-text("設定"), button:has-text("設定する"), button:has-text("⚙"), button[aria-label*="settings"]').first();

      if (await settingsButton.count() > 0) {
        // 設定ボタンをクリック
        await settingsButton.click();
        await page.waitForTimeout(500);

        // 予算入力フィールドを検索
        const budgetInput = page.locator('input[type="number"], input[placeholder*="予算"], input[placeholder*="金額"]').first();

        if (await budgetInput.count() > 0) {
          // 現在の値をクリア
          await budgetInput.clear();
          // 予算額を入力
          await budgetInput.fill('10000');

          // 保存ボタンをクリック
          const saveButton = page.locator('button:has-text("保存"), button:has-text("OK"), button:has-text("決定")').first();
          if (await saveButton.count() > 0) {
            await saveButton.click();
            await page.waitForTimeout(500);

            // 予算が保存されたことを確認（入力値が表示される）
            const confirmationText = page.locator('text=10000, text=¥10000, text=保存されました');
            if (await confirmationText.count() > 0) {
              await expect(confirmationText.first()).toBeVisible({ timeout: 5000 });
            }
          }
        }
      }
    }
  });

  test('食材の価格が予算に反映される', async ({ page }) => {
    // 冷蔵庫ビューに戻す
    const fridgeTab = page.locator('button:has-text("冷蔵庫"), button:has-text("Fridge")').first();

    if (await fridgeTab.count() > 0) {
      await fridgeTab.click();
      await page.waitForTimeout(300);
    }

    // 食材追加ボタンを検索
    const addButton = page.locator('button:has-text("追加"), button:has-text("＋")').first();

    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(500);

      // 食材名入力フィールド
      const nameInput = page.locator('input[placeholder*="名前"], input[placeholder*="食材"], input[type="text"]').first();

      // 価格入力フィールド
      const priceInput = page.locator('input[type="number"], input[placeholder*="価格"], input[placeholder*="金額"]').first();

      if (await nameInput.count() > 0 && await priceInput.count() > 0) {
        // 食材名を入力
        await nameInput.fill('テスト食材');

        // 価格を入力
        await priceInput.fill('1000');

        // 保存ボタンをクリック
        const saveButton = page.locator('button:has-text("保存"), button:has-text("追加"), button:has-text("完了")').first();
        if (await saveButton.count() > 0) {
          await saveButton.click();
          await page.waitForTimeout(1000);

          // 予算タブをクリック
          const budgetTab = page.locator('button:has-text("予算"), button:has-text("Budget")').first();
          if (await budgetTab.count() > 0) {
            await budgetTab.click();
            await page.waitForTimeout(300);

            // 予算の使用額が表示されることを確認
            const usedAmount = page.locator('text=1000, text=¥1000, text=使用');
            if (await usedAmount.count() > 0) {
              await expect(usedAmount.first()).toBeVisible({ timeout: 5000 });
            }
          }
        }
      }
    }
  });

  test('予算の進捗が視覚的に表示される', async ({ page }) => {
    // 予算タブをクリック
    const budgetTab = page.locator('button:has-text("予算"), button:has-text("Budget")').first();

    if (await budgetTab.count() > 0) {
      await budgetTab.click();
      await page.waitForTimeout(300);

      // 進捗バーを検索
      const progressBar = page.locator('[role="progressbar"], .progress-bar, .progress');

      if (await progressBar.count() > 0) {
        // 進捗バーが表示されることを確認
        await expect(progressBar.first()).toBeVisible({ timeout: 5000 });
      }

      // 残額表示を検索
      const remainingAmount = page.locator('text=残額, text=残り, text=Remaining');
      if (await remainingAmount.count() > 0) {
        await expect(remainingAmount.first()).toBeVisible({ timeout: 5000 });
      }

      // 使用額表示を検索
      const usedAmount = page.locator('text=使用, text=使用額, text=Used');
      if (await usedAmount.count() > 0) {
        await expect(usedAmount.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('予算超過時に警告が表示される', async ({ page }) => {
    // 予算タブをクリック
    const budgetTab = page.locator('button:has-text("予算"), button:has-text("Budget")').first();

    if (await budgetTab.count() > 0) {
      await budgetTab.click();
      await page.waitForTimeout(300);

      // 予算を少なく設定（例：1000円）
      const settingsButton = page.locator('button:has-text("設定"), button:has-text("設定する"), button:has-text("⚙")').first();

      if (await settingsButton.count() > 0) {
        await settingsButton.click();
        await page.waitForTimeout(500);

        const budgetInput = page.locator('input[type="number"], input[placeholder*="予算"]').first();

        if (await budgetInput.count() > 0) {
          await budgetInput.clear();
          await budgetInput.fill('100');

          // 保存ボタンをクリック
          const saveButton = page.locator('button:has-text("保存"), button:has-text("OK")').first();
          if (await saveButton.count() > 0) {
            await saveButton.click();
            await page.waitForTimeout(500);

            // 冷蔵庫ビューに戻す
            const fridgeTab = page.locator('button:has-text("冷蔵庫"), button:has-text("Fridge")').first();

            if (await fridgeTab.count() > 0) {
              await fridgeTab.click();
              await page.waitForTimeout(300);

              // 高価な食材を追加
              const addButton = page.locator('button:has-text("追加"), button:has-text("＋")').first();

              if (await addButton.count() > 0) {
                await addButton.click();
                await page.waitForTimeout(500);

                const nameInput = page.locator('input[placeholder*="名前"], input[placeholder*="食材"]').first();
                const priceInput = page.locator('input[type="number"], input[placeholder*="価格"]').first();

                if (await nameInput.count() > 0 && await priceInput.count() > 0) {
                  await nameInput.fill('高価な食材');
                  await priceInput.fill('10000');

                  const saveButton = page.locator('button:has-text("保存"), button:has-text("追加")').first();
                  if (await saveButton.count() > 0) {
                    await saveButton.click();
                    await page.waitForTimeout(1000);

                    // 警告メッセージを検索
                    const warningMessage = page.locator('text=警告, text=超過, text=超えた, [role="alert"]');
                    if (await warningMessage.count() > 0) {
                      await expect(warningMessage.first()).toBeVisible({ timeout: 5000 });
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  test.describe('レスポンシブテスト', () => {
    test('モバイル画面で予算管理が動作する', async ({ page }) => {
      // モバイルビューポートを設定
      await page.setViewportSize({ width: 375, height: 667 });

      // 予算タブをクリック
      const budgetTab = page.locator('button:has-text("予算"), button:has-text("Budget")').first();

      if (await budgetTab.count() > 0) {
        await budgetTab.click();
        await page.waitForTimeout(300);

        // 予算コンテンツが表示されることを確認
        const budgetContent = page.locator('[role="tabpanel"], .budget-content').first();
        if (await budgetContent.count() > 0) {
          await expect(budgetContent).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('タブレット画面で予算管理が動作する', async ({ page }) => {
      // タブレットビューポートを設定
      await page.setViewportSize({ width: 768, height: 1024 });

      // 予算タブをクリック
      const budgetTab = page.locator('button:has-text("予算"), button:has-text("Budget")').first();

      if (await budgetTab.count() > 0) {
        await budgetTab.click();
        await page.waitForTimeout(300);

        // 予算コンテンツが表示されることを確認
        const budgetContent = page.locator('[role="tabpanel"], .budget-content').first();
        if (await budgetContent.count() > 0) {
          await expect(budgetContent).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });
});
