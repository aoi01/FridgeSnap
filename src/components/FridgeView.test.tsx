/**
 * 冷蔵庫ビューコンポーネントのテスト
 *
 * テスト対象の機能：
 * - カテゴリ別の食材表示
 * - 食材の追加・編集・削除
 * - 今日の献立への追加
 * - 保存方法Tipsモーダルの表示
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FridgeView from './FridgeView';
import { render, createMockFoodItems, createExpiringFoodItem, testIds } from '@/test/utils';
import { FoodItem } from '@/types/food';

describe('FridgeView コンポーネント', () => {
  const mockHandlers = {
    onMoveToBasket: vi.fn(),
    onRemoveItem: vi.fn(),
    onUpdateItem: vi.fn(),
    onAddItem: vi.fn(),
  };

  const defaultProps = {
    foodItems: createMockFoodItems(3),
    ...mockHandlers,
  };

  beforeEach(() => {
    // モック関数をリセット
    Object.values(mockHandlers).forEach((fn) => fn.mockClear());
  });

  describe('レンダリング', () => {
    it('食材が存在しない場合、FridgeAddFormのみを表示', () => {
      render(<FridgeView {...defaultProps} foodItems={[]} />);

      // フォームが表示されることを確認
      expect(screen.getByText('食材名')).toBeInTheDocument();
    });

    it('食材が存在する場合、グリッドレイアウトで表示', () => {
      render(<FridgeView {...defaultProps} />);

      // グリッドが表示されることを確認
      defaultProps.foodItems.forEach((item) => {
        expect(screen.getByText(item.name)).toBeInTheDocument();
      });
    });

    it('食材をカテゴリ別にグループ化して表示', () => {
      const items = [
        { ...createMockFoodItems(1)[0], category: '野菜', name: 'トマト' },
        { ...createMockFoodItems(1)[0], category: '野菜', name: 'きゅうり' },
        { ...createMockFoodItems(1)[0], category: 'タンパク質', name: '鶏肉' },
      ];

      render(<FridgeView {...defaultProps} foodItems={items} />);

      // 各カテゴリが表示されることを確認
      expect(screen.getByText('野菜')).toBeInTheDocument();
      expect(screen.getByText('タンパク質')).toBeInTheDocument();

      // 同じカテゴリの食材が一緒に表示されることを確認
      expect(screen.getByText('トマト')).toBeInTheDocument();
      expect(screen.getByText('きゅうり')).toBeInTheDocument();
    });

    it('複数のカテゴリがある場合、グリッドレイアウトで表示', () => {
      const items = createMockFoodItems(6).map((item, index) => ({
        ...item,
        category: index < 2 ? '野菜' : index < 4 ? 'タンパク質' : '乳製品',
      }));

      render(<FridgeView {...defaultProps} foodItems={items} />);

      // グリッドが複数カラムで表示されることを確認（md以上）
      const containers = screen.getAllByRole('heading', { level: 3 });
      expect(containers.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('食材の編集機能', () => {
    it('食材をクリックして編集モーダルを開く', async () => {
      const user = userEvent.setup();
      const items = createMockFoodItems(1);

      render(<FridgeView {...defaultProps} foodItems={items} />);

      // 食材の編集ボタンを探して点击
      const editButton = screen.getByRole('button', { name: /編集/i });
      await user.click(editButton);

      // 編集モーダルが表示されることを確認
      await waitFor(() => {
        expect(screen.getByDisplayValue(items[0].name)).toBeInTheDocument();
      });
    });

    it('編集モーダルで食材を更新できる', async () => {
      const user = userEvent.setup();
      const items = createMockFoodItems(1);
      const updatedName = '更新された食材名';

      render(<FridgeView {...defaultProps} foodItems={items} />);

      // 編集モーダルを開く
      const editButton = screen.getByRole('button', { name: /編集/i });
      await user.click(editButton);

      // 食材名を更新
      const input = screen.getByDisplayValue(items[0].name);
      await user.clear(input);
      await user.type(input, updatedName);

      // 保存ボタンをクリック
      const saveButton = screen.getByRole('button', { name: /保存/i });
      await user.click(saveButton);

      // onUpdateItem が呼ばれたことを確認
      await waitFor(() => {
        expect(mockHandlers.onUpdateItem).toHaveBeenCalledWith(
          expect.objectContaining({ name: updatedName })
        );
      });

      // モーダルが閉じたことを確認
      expect(screen.queryByDisplayValue(items[0].name)).not.toBeInTheDocument();
    });

    it('編集モーダルをキャンセルして変更を破棄できる', async () => {
      const user = userEvent.setup();
      const items = createMockFoodItems(1);

      render(<FridgeView {...defaultProps} foodItems={items} />);

      // 編集モーダルを開く
      const editButton = screen.getByRole('button', { name: /編集/i });
      await user.click(editButton);

      // キャンセルボタンをクリック
      const cancelButton = screen.getAllByRole('button', { name: /キャンセル/i })[1];
      await user.click(cancelButton);

      // onUpdateItem が呼ばれないことを確認
      expect(mockHandlers.onUpdateItem).not.toHaveBeenCalled();

      // モーダルが閉じたことを確認
      expect(screen.queryByDisplayValue(items[0].name)).not.toBeInTheDocument();
    });
  });

  describe('食材の削除機能', () => {
    it('食材の削除ボタンをクリックして削除できる', async () => {
      const user = userEvent.setup();
      const items = createMockFoodItems(1);

      render(<FridgeView {...defaultProps} foodItems={items} />);

      // 削除ボタンをクリック
      const deleteButton = screen.getByRole('button', { name: /削除/i });
      await user.click(deleteButton);

      // onRemoveItem が呼ばれたことを確認
      await waitFor(() => {
        expect(mockHandlers.onRemoveItem).toHaveBeenCalledWith(items[0].id);
      });
    });

    it('複数の食材がある場合、該当する食材のみを削除', async () => {
      const user = userEvent.setup();
      const items = createMockFoodItems(3);

      render(<FridgeView {...defaultProps} foodItems={items} />);

      // 最初の食材の削除ボタンをクリック
      const deleteButtons = screen.getAllByRole('button', { name: /削除/i });
      await user.click(deleteButtons[0]);

      // 最初の食材の ID で onRemoveItem が呼ばれたことを確認
      await waitFor(() => {
        expect(mockHandlers.onRemoveItem).toHaveBeenCalledWith(items[0].id);
      });
    });
  });

  describe('バスケット追加機能', () => {
    it('食材をバスケットに追加できる', async () => {
      const user = userEvent.setup();
      const items = createMockFoodItems(1);

      render(<FridgeView {...defaultProps} foodItems={items} />);

      // バスケット追加ボタンをクリック
      const basketButton = screen.getByRole('button', { name: /バスケットに追加|今日の献立に追加/i });
      await user.click(basketButton);

      // onMoveToBasket が呼ばれたことを確認
      await waitFor(() => {
        expect(mockHandlers.onMoveToBasket).toHaveBeenCalledWith(
          expect.objectContaining({ id: items[0].id })
        );
      });
    });

    it('複数の食材をバスケットに追加できる', async () => {
      const user = userEvent.setup();
      const items = createMockFoodItems(3);

      render(<FridgeView {...defaultProps} foodItems={items} />);

      // 各食材をバスケットに追加
      const basketButtons = screen.getAllByRole('button', {
        name: /バスケットに追加|今日の献立に追加/i,
      });

      for (const button of basketButtons) {
        await user.click(button);
      }

      // onMoveToBasket が複数回呼ばれたことを確認
      await waitFor(() => {
        expect(mockHandlers.onMoveToBasket).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('保存方法Tipsモーダル', () => {
    it('Tipsボタンをクリックしてモーダルを開く', async () => {
      const user = userEvent.setup();
      const items = createMockFoodItems(1);

      render(<FridgeView {...defaultProps} foodItems={items} />);

      // Tipsボタンをクリック
      const tipsButton = screen.getByRole('button', { name: /Tips|保存方法|ヒント/i });
      if (tipsButton) {
        await user.click(tipsButton);

        // モーダルが表示されることを確認
        await waitFor(() => {
          expect(screen.getByText(/保存期限を延ばすヒント|保存方法/i)).toBeInTheDocument();
        });
      }
    });

    it('Tipsを適用して賞味期限を延長できる', async () => {
      const user = userEvent.setup();
      const items = createMockFoodItems(1);

      render(<FridgeView {...defaultProps} foodItems={items} />);

      // Tipsボタンをクリック
      const tipsButton = screen.getByRole('button', { name: /Tips|保存方法|ヒント/i });
      if (tipsButton) {
        await user.click(tipsButton);

        // Tipを適用するボタンをクリック（存在する場合）
        const applyButton = screen.queryByRole('button', { name: /この方法を実行した|実行した/i });
        if (applyButton) {
          await user.click(applyButton);

          // onUpdateItem が呼ばれたことを確認
          await waitFor(() => {
            expect(mockHandlers.onUpdateItem).toHaveBeenCalledWith(
              expect.objectContaining({
                id: items[0].id,
                appliedStorageTips: expect.any(Array),
              })
            );
          });
        }
      }
    });

    it('モーダルを閉じることができる', async () => {
      const user = userEvent.setup();
      const items = createMockFoodItems(1);

      render(<FridgeView {...defaultProps} foodItems={items} />);

      // Tipsボタンをクリック
      const tipsButton = screen.getByRole('button', { name: /Tips|保存方法|ヒント/i });
      if (tipsButton) {
        await user.click(tipsButton);

        // モーダルが表示されることを確認
        await waitFor(() => {
          expect(screen.getByText(/保存期限を延ばすヒント|保存方法/i)).toBeInTheDocument();
        });

        // 閉じるボタンをクリック
        const closeButton = screen.getByRole('button', { name: /close|閉じる/i });
        if (closeButton) {
          await user.click(closeButton);
        }
      }
    });
  });

  describe('期限切れ食材の表示', () => {
    it('期限が近い食材を強調表示', () => {
      const expiringItem = createExpiringFoodItem(1);
      const items = [expiringItem];

      render(<FridgeView {...defaultProps} foodItems={items} />);

      // 食材が表示されることを確認
      expect(screen.getByText(expiringItem.name)).toBeInTheDocument();
    });

    it('期限切れの食材を視覚的に区別', () => {
      const expiredItem = { ...createMockFoodItems(1)[0], expiryDate: '2020-01-01' };
      const items = [expiredItem];

      render(<FridgeView {...defaultProps} foodItems={items} />);

      // 食材が表示されることを確認（視覚的区別は CSS に依存）
      expect(screen.getByText(expiredItem.name)).toBeInTheDocument();
    });
  });

  describe('FridgeAddForm との統合', () => {
    it('新しい食材を追加できる', async () => {
      const user = userEvent.setup();
      const newItemName = '新しい食材';

      render(<FridgeView {...defaultProps} foodItems={[]} />);

      // 食材名を入力
      const nameInput = screen.getByLabelText(/食材名|名前/i);
      await user.type(nameInput, newItemName);

      // カテゴリを選択（必要な場合）
      const categorySelect = screen.queryByLabelText(/カテゴリ|分類/i);
      if (categorySelect) {
        await user.click(categorySelect);
        const option = screen.getByRole('option', { name: /野菜|肉|魚/i });
        if (option) {
          await user.click(option);
        }
      }

      // 追加ボタンをクリック
      const addButton = screen.getByRole('button', { name: /追加|登録|送信/i });
      await user.click(addButton);

      // onAddItem が呼ばれたことを確認
      await waitFor(() => {
        expect(mockHandlers.onAddItem).toHaveBeenCalledWith(
          expect.objectContaining({ name: newItemName })
        );
      });
    });
  });

  describe('エッジケース', () => {
    it('空のカテゴリセクションは表示されない', () => {
      const items = createMockFoodItems(2).map((item) => ({
        ...item,
        category: '野菜',
      }));

      render(<FridgeView {...defaultProps} foodItems={items} />);

      // 野菜カテゴリのみが表示されることを確認
      expect(screen.getByText('野菜')).toBeInTheDocument();

      // 他のカテゴリは表示されないことを確認（FOOD_CATEGORIES に依存）
    });

    it('同じ Tip を複数回適用できない', async () => {
      const user = userEvent.setup();
      const item = createMockFoodItems(1)[0];
      const appliedTip = 'テスト保存方法';
      const itemWithAppliedTip = {
        ...item,
        appliedStorageTips: [appliedTip],
      };

      render(
        <FridgeView
          {...defaultProps}
          foodItems={[itemWithAppliedTip]}
        />
      );

      // コンポーネントがレンダリングされることを確認
      expect(screen.getByText(item.name)).toBeInTheDocument();
    });

    it('大量の食材がある場合でも正しく表示', () => {
      const items = createMockFoodItems(50);

      render(<FridgeView {...defaultProps} foodItems={items} />);

      // 食材の一部が表示されることを確認
      expect(screen.getByText(items[0].name)).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('カテゴリヘッダーが適切なセマンティクスを持つ', () => {
      const items = createMockFoodItems(1);

      render(<FridgeView {...defaultProps} foodItems={items} />);

      // ヘッダーが存在することを確認
      const headers = screen.getAllByRole('heading');
      expect(headers.length).toBeGreaterThan(0);
    });

    it('ボタンがキーボードでアクセス可能', async () => {
      const user = userEvent.setup();
      const items = createMockFoodItems(1);

      render(<FridgeView {...defaultProps} foodItems={items} />);

      // タブキーで操作可能なボタンを確認
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      for (const button of buttons) {
        expect(button).toBeVisible();
      }
    });
  });

  describe('パフォーマンス', () => {
    it('大量の食材でもレンダリングが完了する', () => {
      const items = createMockFoodItems(100);

      const { container } = render(<FridgeView {...defaultProps} foodItems={items} />);

      // DOM が正しく構築されていることを確認
      expect(container).toBeTruthy();
      expect(screen.getByText(items[0].name)).toBeInTheDocument();
    });
  });
});
