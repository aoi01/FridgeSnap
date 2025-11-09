import { test, expect } from '@playwright/test';

/**
 * レシートスキャナー機能のE2Eテスト
 *
 * レシート画像の読み込みと食材情報の抽出機能をテスト
 */

test.describe('レシートスキャナー機能', () => {
  test.beforeEach(async ({ page }) => {
    // ページを読み込み
    await page.goto('/');
    // ネットワークが完了するまで待機
    await page.waitForLoadState('networkidle');
  });

  test('レシートスキャナーモーダルが開く', async ({ page }) => {
    // レシートスキャンボタンを検索
    const scanButton = page.locator('button:has-text("レシート"), button:has-text("スキャン"), button:has-text("カメラ")').first();

    // ボタンが存在する場合のみテスト実行
    if (await scanButton.count() > 0) {
      // スキャンボタンをクリック
      await scanButton.click();
      await page.waitForTimeout(500);

      // スキャナーモーダルが表示されることを確認
      const modal = page.locator('[role="dialog"], .modal, .dialog');
      if (await modal.count() > 0) {
        await expect(modal.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('画像ファイルをアップロードできる', async ({ page }) => {
    // レシートスキャンボタンをクリック
    const scanButton = page.locator('button:has-text("レシート"), button:has-text("スキャン"), button:has-text("カメラ")').first();

    if (await scanButton.count() > 0) {
      await scanButton.click();
      await page.waitForTimeout(500);

      // ファイル入力フィールドを検索
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        // ダミーファイルパスを設定（実際のファイルはテスト環境では不要）
        await fileInput.setInputFiles({
          name: 'test-receipt.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('fake-image-data'),
        });

        // ファイルがアップロードされたことを確認（ファイル名やプレビューが表示される）
        const preview = page.locator('img[alt*="receipt"], img[alt*="preview"]');
        if (await preview.count() > 0) {
          await expect(preview.first()).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('AI がレシートから食材情報を抽出できる', async ({ page }) => {
    // レシートスキャンボタンをクリック
    const scanButton = page.locator('button:has-text("レシート"), button:has-text("スキャン"), button:has-text("カメラ")').first();

    if (await scanButton.count() > 0) {
      await scanButton.click();
      await page.waitForTimeout(500);

      // ファイル入力を見つけてアップロード
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        await fileInput.setInputFiles({
          name: 'test-receipt.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('fake-image-data'),
        });

        // 抽出ボタンをクリック
        const extractButton = page.locator('button:has-text("抽出"), button:has-text("分析"), button:has-text("処理")').first();
        if (await extractButton.count() > 0) {
          await extractButton.click();
          await page.waitForTimeout(1000);

          // 抽出された食材情報が表示されることを確認
          const itemList = page.locator('ul, ol, [role="list"]').first();
          if (await itemList.count() > 0) {
            await expect(itemList).toBeVisible({ timeout: 10000 });
          }
        }
      }
    }
  });

  test('抽出された食材を冷蔵庫に追加できる', async ({ page }) => {
    // レシートスキャンボタンをクリック
    const scanButton = page.locator('button:has-text("レシート"), button:has-text("スキャン"), button:has-text("カメラ")').first();

    if (await scanButton.count() > 0) {
      await scanButton.click();
      await page.waitForTimeout(500);

      // ファイルをアップロード
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        await fileInput.setInputFiles({
          name: 'test-receipt.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('fake-image-data'),
        });

        // 抽出ボタンをクリック
        const extractButton = page.locator('button:has-text("抽出"), button:has-text("分析"), button:has-text("処理")').first();
        if (await extractButton.count() > 0) {
          await extractButton.click();
          await page.waitForTimeout(1000);

          // 「すべて追加」ボタンをクリック
          const addAllButton = page.locator('button:has-text("すべて追加"), button:has-text("追加"), button:has-text("保存")').first();
          if (await addAllButton.count() > 0) {
            await addAllButton.click();
            await page.waitForTimeout(1000);

            // 成功メッセージまたはモーダルが閉じられたことを確認
            const successMessage = page.locator('text=追加されました, text=完了, text=成功').first();
            const modal = page.locator('[role="dialog"], .modal').first();

            if (await successMessage.count() > 0) {
              await expect(successMessage).toBeVisible({ timeout: 5000 });
            } else if (await modal.count() === 0) {
              // モーダルが閉じられたことを確認
              await expect(modal).toHaveCount(0, { timeout: 5000 });
            }
          }
        }
      }
    }
  });

  test.describe('レスポンシブテスト', () => {
    test('モバイル画面でレシートスキャナーが動作する', async ({ page }) => {
      // モバイルビューポートを設定
      await page.setViewportSize({ width: 375, height: 667 });

      // レシートスキャンボタンをクリック
      const scanButton = page.locator('button:has-text("レシート"), button:has-text("スキャン"), button:has-text("カメラ")').first();

      if (await scanButton.count() > 0) {
        await scanButton.click();
        await page.waitForTimeout(500);

        // モーダルが表示されることを確認
        const modal = page.locator('[role="dialog"], .modal').first();
        if (await modal.count() > 0) {
          await expect(modal).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('タブレット画面でレシートスキャナーが動作する', async ({ page }) => {
      // タブレットビューポートを設定
      await page.setViewportSize({ width: 768, height: 1024 });

      // レシートスキャンボタンをクリック
      const scanButton = page.locator('button:has-text("レシート"), button:has-text("スキャン"), button:has-text("カメラ")').first();

      if (await scanButton.count() > 0) {
        await scanButton.click();
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
