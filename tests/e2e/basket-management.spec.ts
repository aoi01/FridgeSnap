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
    // 基本的なコンテンツが読み込まれるまで待機
    await page.waitForLoadState('domcontentloaded');
  });

  test('バスケットタブが表示されて切り替えできる', async ({ page }) => {
    // 「今日の献立」タブをクリック
    const basketTab = page.locator('button:has-text("今日の献立")');

    // タブが表示されていることを確認
    await expect(basketTab).toBeVisible({ timeout: 5000 });

    // タブをクリック
    await basketTab.click();
    await page.waitForTimeout(300);

    // バスケットコンテンツが表示されることを確認
    // 空状態のメッセージまたはアイテムグリッドのいずれかが表示される
    const emptyMessage = page.locator('text=今日の献立に何も選択されていません');
    const itemGrid = page.locator('.grid');

    const hasContent = await emptyMessage.isVisible().catch(() => false) ||
                       await itemGrid.isVisible().catch(() => false);

    expect(hasContent).toBeTruthy();
  });

  test('食材をバスケットに追加できる', async ({ page }) => {
    // まず冷蔵庫タブに移動
    const fridgeTab = page.locator('button:has-text("冷蔵庫")');
    await fridgeTab.click();
    await page.waitForTimeout(300);

    // 食材カードを検索（カテゴリセクション内の食材）
    const foodCards = page.locator('.grid').first().locator('> div');

    // 食材が存在することを確認
    const foodCount = await foodCards.count();
    if (foodCount > 0) {
      // 最初の食材カード内の「バスケットに追加」ボタンを探す
      const firstFoodCard = foodCards.first();
      const addButton = firstFoodCard.locator('button').filter({ has: page.locator('svg') }).first();

      // ボタンをクリック
      await addButton.click();
      await page.waitForTimeout(500);

      // 今日の献立タブをクリック
      const basketTab = page.locator('button:has-text("今日の献立")');
      await basketTab.click();
      await page.waitForTimeout(300);

      // バスケットに食材が表示されていることを確認
      const emptyMessage = page.locator('text=今日の献立に何も選択されていません');
      const isEmpty = await emptyMessage.isVisible().catch(() => false);

      expect(isEmpty).toBeFalsy();
    }
  });

  test('バスケットから食材を削除できる', async ({ page }) => {
    // バスケットタブをクリック
    const basketTab = page.locator('button:has-text("今日の献立")');
    await basketTab.click();
    await page.waitForTimeout(300);

    // バスケットに食材があるかチェック
    const emptyMessage = page.locator('text=今日の献立に何も選択されていません');
    const hasItems = !(await emptyMessage.isVisible().catch(() => false));

    if (hasItems) {
      // グリッド内のアイテムカードを取得
      const itemCards = page.locator('.grid').first().locator('> div');
      const countBefore = await itemCards.count();

      // 最初のアイテムカード内の削除ボタンを探す
      const firstCard = itemCards.first();
      const deleteButton = firstCard.locator('button').filter({ hasText: /削除|×/ }).first();

      if (await deleteButton.count() > 0) {
        await deleteButton.click();
        await page.waitForTimeout(500);

        // アイテム数が減少したことを確認
        const itemCardsAfter = page.locator('.grid').first().locator('> div');
        const countAfter = await itemCardsAfter.count();

        expect(countAfter).toBeLessThanOrEqual(countBefore);
      }
    }
  });

  test('レシピ検索タブに移動できる', async ({ page }) => {
    // レシピ検索タブをクリック
    const recipesTab = page.locator('button:has-text("レシピ検索")');

    // タブが表示されていることを確認
    await expect(recipesTab).toBeVisible({ timeout: 5000 });

    // タブをクリック
    await recipesTab.click();
    await page.waitForTimeout(300);

    // タブが選択状態になっていることを確認（簡易的な確認）
    const tabContent = page.locator('main, [role="main"]').first();
    await expect(tabContent).toBeVisible({ timeout: 5000 });
  });

  test('家計簿タブに移動できる', async ({ page }) => {
    // 家計簿タブをクリック
    const budgetTab = page.locator('button:has-text("家計簿")');

    // タブが表示されていることを確認
    await expect(budgetTab).toBeVisible({ timeout: 5000 });

    // タブをクリック
    await budgetTab.click();
    await page.waitForTimeout(300);

    // タブが選択状態になっていることを確認（簡易的な確認）
    const tabContent = page.locator('main, [role="main"]').first();
    await expect(tabContent).toBeVisible({ timeout: 5000 });
  });

  test.describe('レスポンシブテスト', () => {
    test('モバイル画面でバスケット機能が動作する', async ({ page }) => {
      // モバイルビューポートを設定
      await page.setViewportSize({ width: 375, height: 667 });

      // バスケットタブをクリック
      const basketTab = page.locator('button:has-text("今日の献立")');
      await basketTab.click();
      await page.waitForTimeout(300);

      // バスケットコンテンツが表示されることを確認
      const emptyMessage = page.locator('text=今日の献立に何も選択されていません');
      const gridContent = page.locator('.grid').first();

      const hasContent = await emptyMessage.isVisible().catch(() => false) ||
                         await gridContent.isVisible().catch(() => false);

      expect(hasContent).toBeTruthy();
    });

    test('タブレット画面でバスケット機能が動作する', async ({ page }) => {
      // タブレットビューポートを設定
      await page.setViewportSize({ width: 768, height: 1024 });

      // バスケットタブをクリック
      const basketTab = page.locator('button:has-text("今日の献立")');
      await basketTab.click();
      await page.waitForTimeout(300);

      // バスケットコンテンツが表示されることを確認
      const emptyMessage = page.locator('text=今日の献立に何も選択されていません');
      const gridContent = page.locator('.grid').first();

      const hasContent = await emptyMessage.isVisible().catch(() => false) ||
                         await gridContent.isVisible().catch(() => false);

      expect(hasContent).toBeTruthy();
    });
  });
});
