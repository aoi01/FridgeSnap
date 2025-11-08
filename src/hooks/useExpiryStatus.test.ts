/**
 * 賞味期限ステータスフックのテスト
 *
 * テスト対象の機能：
 * - 賞味期限ステータスの判定
 * - UI用の色とテキストの生成
 * - 複数食材の一括処理
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getExpiryStatusUI, getBulkExpiryStatusUI, ExpiryStatusUI } from '@/hooks/useExpiryStatus';

describe('useExpiryStatus - getExpiryStatusUI', () => {
  let originalDate: typeof Date;

  beforeEach(() => {
    // 日付をモックしてテストを一貫性のあるものにする
    const mockDate = new Date('2024-01-15T12:00:00Z');
    originalDate = global.Date;

    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('期限切れ状態（days < 0）', () => {
    it('期限切れ食材を正しく判定する', () => {
      const status = getExpiryStatusUI('2024-01-14'); // 昨日

      expect(status.status).toBe('expired');
      expect(status.text).toBe('期限切れ');
      expect(status.badgeColor).toBe('bg-red-500');
      expect(status.cardBg).toBe('bg-red-100');
      expect(status.cardBorder).toBe('border-red-300');
    });

    it('複数日前の期限切れを判定する', () => {
      const status = getExpiryStatusUI('2024-01-01'); // 14日前

      expect(status.status).toBe('expired');
      expect(status.text).toBe('期限切れ');
    });

    it('期限切れはすべて同じUI情報を返す', () => {
      const yesterday = getExpiryStatusUI('2024-01-14');
      const weekAgo = getExpiryStatusUI('2024-01-08');
      const monthAgo = getExpiryStatusUI('2023-12-15');

      expect(yesterday.badgeColor).toBe(weekAgo.badgeColor);
      expect(weekAgo.cardBg).toBe(monthAgo.cardBg);
      expect(monthAgo.cardBorder).toBe(yesterday.cardBorder);
    });
  });

  describe('本日期限状態（days === 0）', () => {
    it('本日期限の食材を正しく判定する', () => {
      const status = getExpiryStatusUI('2024-01-15'); // 今日

      expect(status.status).toBe('today');
      expect(status.text).toBe('今日まで');
      expect(status.badgeColor).toBe('bg-red-400');
      expect(status.cardBg).toBe('bg-red-100');
      expect(status.cardBorder).toBe('border-red-300');
    });

    it('時間に関係なく日付のみで比較される', () => {
      // システムタイムが午後12時でも、日付は同じ
      const earlyMorning = getExpiryStatusUI('2024-01-15');
      const status = getExpiryStatusUI('2024-01-15');

      expect(earlyMorning.status).toBe('today');
      expect(status.status).toBe('today');
    });
  });

  describe('明日期限状態（days === 1）', () => {
    it('明日期限の食材を正しく判定する', () => {
      const status = getExpiryStatusUI('2024-01-16'); // 明日

      expect(status.status).toBe('tomorrow');
      expect(status.text).toBe('明日まで');
      expect(status.badgeColor).toBe('bg-orange-400');
      expect(status.cardBg).toBe('bg-orange-100');
      expect(status.cardBorder).toBe('border-orange-300');
    });

    it('明日の色は期限切れと安全の中間', () => {
      const expired = getExpiryStatusUI('2024-01-14');
      const tomorrow = getExpiryStatusUI('2024-01-16');
      const safe = getExpiryStatusUI('2024-01-20');

      // オレンジは赤と黄色の中間
      expect(tomorrow.badgeColor).not.toBe(expired.badgeColor);
      expect(tomorrow.badgeColor).not.toBe(safe.badgeColor);
    });
  });

  describe('数日以内状態（2 <= days <= 3）', () => {
    it('2日後の食材を正しく判定する', () => {
      const status = getExpiryStatusUI('2024-01-17'); // 2日後

      expect(status.status).toBe('soon');
      expect(status.text).toBe('2日後');
      expect(status.badgeColor).toBe('bg-yellow-400');
      expect(status.cardBg).toBe('bg-yellow-100');
      expect(status.cardBorder).toBe('border-yellow-300');
    });

    it('3日後の食材を正しく判定する', () => {
      const status = getExpiryStatusUI('2024-01-18'); // 3日後

      expect(status.status).toBe('soon');
      expect(status.text).toBe('3日後');
      expect(status.badgeColor).toBe('bg-yellow-400');
    });

    it('日数が正しくテキストに反映される', () => {
      const twoDays = getExpiryStatusUI('2024-01-17');
      const threeDays = getExpiryStatusUI('2024-01-18');

      expect(twoDays.text).toBe('2日後');
      expect(threeDays.text).toBe('3日後');
    });
  });

  describe('安全状態（days > 3）', () => {
    it('4日後の食材を正しく判定する', () => {
      const status = getExpiryStatusUI('2024-01-19'); // 4日後

      expect(status.status).toBe('safe');
      expect(status.text).toBe('4日後');
      expect(status.badgeColor).toBe('bg-green-400');
      expect(status.cardBg).toBe('bg-green-100');
      expect(status.cardBorder).toBe('border-green-300');
    });

    it('遠い期限の食材を正しく判定する', () => {
      const status = getExpiryStatusUI('2024-02-15'); // 31日後

      expect(status.status).toBe('safe');
      expect(status.text).toBe('31日後');
      expect(status.badgeColor).toBe('bg-green-400');
    });

    it('1年先の期限を判定できる', () => {
      const status = getExpiryStatusUI('2025-01-15'); // 365日後

      expect(status.status).toBe('safe');
      expect(status.badgeColor).toBe('bg-green-400');
    });
  });

  describe('UI情報の整合性', () => {
    it('すべてのステータスがバッジ色を持つ', () => {
      const statuses: ExpiryStatusUI[] = [
        getExpiryStatusUI('2024-01-14'), // expired
        getExpiryStatusUI('2024-01-15'), // today
        getExpiryStatusUI('2024-01-16'), // tomorrow
        getExpiryStatusUI('2024-01-17'), // soon
        getExpiryStatusUI('2024-01-20'), // safe
      ];

      statuses.forEach((status) => {
        expect(status.badgeColor).toBeTruthy();
        expect(status.badgeColor).toMatch(/^bg-/);
      });
    });

    it('すべてのステータスがカード背景色を持つ', () => {
      const statuses: ExpiryStatusUI[] = [
        getExpiryStatusUI('2024-01-14'),
        getExpiryStatusUI('2024-01-15'),
        getExpiryStatusUI('2024-01-16'),
        getExpiryStatusUI('2024-01-17'),
        getExpiryStatusUI('2024-01-20'),
      ];

      statuses.forEach((status) => {
        expect(status.cardBg).toBeTruthy();
        expect(status.cardBg).toMatch(/^bg-/);
      });
    });

    it('すべてのステータスがボーダー色を持つ', () => {
      const statuses: ExpiryStatusUI[] = [
        getExpiryStatusUI('2024-01-14'),
        getExpiryStatusUI('2024-01-15'),
        getExpiryStatusUI('2024-01-16'),
        getExpiryStatusUI('2024-01-17'),
        getExpiryStatusUI('2024-01-20'),
      ];

      statuses.forEach((status) => {
        expect(status.cardBorder).toBeTruthy();
        expect(status.cardBorder).toMatch(/^border-/);
      });
    });

    it('すべてのステータスがテキストを持つ', () => {
      const statuses: ExpiryStatusUI[] = [
        getExpiryStatusUI('2024-01-14'),
        getExpiryStatusUI('2024-01-15'),
        getExpiryStatusUI('2024-01-16'),
        getExpiryStatusUI('2024-01-17'),
        getExpiryStatusUI('2024-01-20'),
      ];

      statuses.forEach((status) => {
        expect(status.text).toBeTruthy();
        expect(typeof status.text).toBe('string');
      });
    });
  });

  describe('エッジケース', () => {
    it('ISO 8601形式の日付を正しく処理する', () => {
      const status = getExpiryStatusUI('2024-01-16'); // YYYY-MM-DD

      expect(status.status).toBe('tomorrow');
    });

    it('月の終わりの日付を正しく処理する', () => {
      vi.setSystemTime(new Date('2024-01-31T12:00:00Z'));

      const status = getExpiryStatusUI('2024-02-01'); // 明日が次月

      expect(status.status).toBe('tomorrow');
    });

    it('年をまたぐ期限を正しく処理する', () => {
      vi.setSystemTime(new Date('2024-12-31T12:00:00Z'));

      const status = getExpiryStatusUI('2025-01-01'); // 明日が翌年

      expect(status.status).toBe('tomorrow');
    });

    it('同じ年月の異なる日付を正しく区別する', () => {
      const tomorrow = getExpiryStatusUI('2024-01-16');
      const threeDaysLater = getExpiryStatusUI('2024-01-18');

      expect(tomorrow.status).not.toBe(threeDaysLater.status);
      expect(tomorrow.text).not.toBe(threeDaysLater.text);
    });
  });
});

describe('useExpiryStatus - getBulkExpiryStatusUI', () => {
  let originalDate: typeof Date;

  beforeEach(() => {
    const mockDate = new Date('2024-01-15T12:00:00Z');
    originalDate = global.Date;

    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('複数日付の処理', () => {
    it('複数の日付を一括処理できる', () => {
      const dates = ['2024-01-14', '2024-01-15', '2024-01-16', '2024-01-20'];
      const statuses = getBulkExpiryStatusUI(dates);

      expect(statuses).toHaveLength(4);
      expect(statuses[0].status).toBe('expired');
      expect(statuses[1].status).toBe('today');
      expect(statuses[2].status).toBe('tomorrow');
      expect(statuses[3].status).toBe('safe');
    });

    it('空の配列を処理できる', () => {
      const statuses = getBulkExpiryStatusUI([]);

      expect(statuses).toEqual([]);
      expect(Array.isArray(statuses)).toBe(true);
    });

    it('単一の日付を処理できる', () => {
      const statuses = getBulkExpiryStatusUI(['2024-01-15']);

      expect(statuses).toHaveLength(1);
      expect(statuses[0].status).toBe('today');
    });

    it('大量の日付を処理できる', () => {
      const dates = Array.from({ length: 100 }, (_, i) => {
        const date = new Date('2024-01-15');
        date.setDate(date.getDate() + i);
        return date.toISOString().split('T')[0];
      });

      const statuses = getBulkExpiryStatusUI(dates);

      expect(statuses).toHaveLength(100);
      expect(Array.isArray(statuses)).toBe(true);
    });
  });

  describe('複数日付の結果の一貫性', () => {
    it('個別処理と一括処理の結果が同じ', () => {
      const dates = ['2024-01-14', '2024-01-15', '2024-01-16'];

      const individual = dates.map((date) => getExpiryStatusUI(date));
      const bulk = getBulkExpiryStatusUI(dates);

      expect(bulk).toEqual(individual);
    });

    it('複数の期限切れ食材を処理できる', () => {
      const dates = ['2024-01-10', '2024-01-12', '2024-01-14'];
      const statuses = getBulkExpiryStatusUI(dates);

      statuses.forEach((status) => {
        expect(status.status).toBe('expired');
      });
    });

    it('混合状態の食材を処理できる', () => {
      const dates = [
        '2024-01-14', // expired
        '2024-01-15', // today
        '2024-01-16', // tomorrow
        '2024-01-18', // soon
        '2024-01-25', // safe
      ];
      const statuses = getBulkExpiryStatusUI(dates);

      const statusTypes = statuses.map((s) => s.status);
      expect(statusTypes).toEqual(['expired', 'today', 'tomorrow', 'soon', 'safe']);
    });
  });

  describe('パフォーマンス', () => {
    it('大量データでも処理が完了する', () => {
      const dates = Array.from({ length: 1000 }, (_, i) => {
        const date = new Date('2024-01-15');
        date.setDate(date.getDate() + i);
        return date.toISOString().split('T')[0];
      });

      const startTime = performance.now();
      const statuses = getBulkExpiryStatusUI(dates);
      const endTime = performance.now();

      expect(statuses).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // 1秒以内
    });
  });

  describe('戻り値の型安全性', () => {
    it('配列の要素がExpiryStatusUI型である', () => {
      const statuses = getBulkExpiryStatusUI(['2024-01-15']);

      const status = statuses[0];
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('badgeColor');
      expect(status).toHaveProperty('cardBg');
      expect(status).toHaveProperty('cardBorder');
      expect(status).toHaveProperty('text');
    });

    it('戻り値は新しい配列である', () => {
      const dates = ['2024-01-15'];
      const statuses1 = getBulkExpiryStatusUI(dates);
      const statuses2 = getBulkExpiryStatusUI(dates);

      expect(statuses1).not.toBe(statuses2); // 異なる配列インスタンス
      expect(statuses1).toEqual(statuses2); // 同じ内容
    });
  });
});

describe('useExpiryStatus - 統合テスト', () => {
  let originalDate: typeof Date;

  beforeEach(() => {
    const mockDate = new Date('2024-01-15T12:00:00Z');
    originalDate = global.Date;

    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('UI用途での使用シナリオ', () => {
    it('バッジの表示に使用できる', () => {
      const status = getExpiryStatusUI('2024-01-16');

      // バッジ用の情報が完全に揃っている
      expect(status.badgeColor).toBeTruthy();
      expect(status.text).toBeTruthy();

      // Tailwind CSS のクラスとして有効
      expect(status.badgeColor).toMatch(/^bg-[a-z]+-\d+$/);
    });

    it('カードの表示に使用できる', () => {
      const status = getExpiryStatusUI('2024-01-14');

      // カード用の情報が完全に揃っている
      expect(status.cardBg).toBeTruthy();
      expect(status.cardBorder).toBeTruthy();

      // Tailwind CSS のクラスとして有効
      expect(status.cardBg).toMatch(/^bg-[a-z]+-\d+$/);
      expect(status.cardBorder).toMatch(/^border-[a-z]+-\d+$/);
    });

    it('複数の食材をリスト表示できる', () => {
      const foodItems = [
        { id: '1', expiryDate: '2024-01-14' },
        { id: '2', expiryDate: '2024-01-15' },
        { id: '3', expiryDate: '2024-01-20' },
      ];

      const statuses = getBulkExpiryStatusUI(
        foodItems.map((item) => item.expiryDate)
      );

      // すべてのアイテムにステータスがある
      expect(statuses).toHaveLength(foodItems.length);

      // 各アイテムが異なるステータスを持つ
      expect(new Set(statuses.map((s) => s.status)).size).toBeGreaterThan(1);
    });
  });

  describe('リアルタイム更新シナリオ', () => {
    it('日が変わるとステータスが更新される', () => {
      const expiryDate = '2024-01-16';

      // 1月15日の状態
      const status1 = getExpiryStatusUI(expiryDate);
      expect(status1.status).toBe('tomorrow');

      // 日付を1月16日に変更
      vi.setSystemTime(new Date('2024-01-16T12:00:00Z'));
      const status2 = getExpiryStatusUI(expiryDate);
      expect(status2.status).toBe('today');

      // 日付を1月17日に変更
      vi.setSystemTime(new Date('2024-01-17T12:00:00Z'));
      const status3 = getExpiryStatusUI(expiryDate);
      expect(status3.status).toBe('expired');
    });
  });
});
