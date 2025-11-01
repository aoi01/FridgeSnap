/**
 * アプリケーション全体で使用する定数を一元管理するモジュール
 *
 * このファイルは以下の定数をエクスポートします：
 * - FOOD_CATEGORIES: 食材のカテゴリ一覧
 * - STORAGE_KEYS: localStorageのキー
 * - UI_CONFIG: UIに関する設定値
 * - API_CONFIG: API関連の設定値
 */

/**
 * 食材カテゴリの定数定義
 * as const により、型レベルで文字列リテラル型として扱われる
 */
export const FOOD_CATEGORIES = [
  '野菜',
  '肉類',
  '魚類',
  '乳製品',
  '調味料',
  'パン',
  '麺類',
  '冷凍食品',
  'その他',
] as const;

/**
 * FoodCategory型: FOOD_CATEGORIESの要素の型
 * typeof FOOD_CATEGORIES[number] により、配列の要素型を取得
 */
export type FoodCategory = typeof FOOD_CATEGORIES[number];

/**
 * localStorageで使用するキーの定数
 * オブジェクトを使用することで、キーの一覧性と変更容易性を向上
 */
export const STORAGE_KEYS = {
  /** 冷蔵庫の食材リスト */
  FRIDGE_ITEMS: 'fridgeItems',
  /** 今日の献立に入れた食材リスト */
  TODAY_BASKET: 'todayBasket',
  /** 購入履歴（家計簿用） */
  PURCHASE_HISTORY: 'purchaseHistory',
  /** 月額生活費の設定値 */
  MONTHLY_LIVING_EXPENSES: 'monthlyLivingExpenses',
} as const;

/**
 * UI関連の設定値
 * マジックナンバーを排除し、意味のある名前で定数化
 */
export const UI_CONFIG = {
  /** 期限切れ間近とみなす日数の閾値（この日数以内なら警告表示） */
  EXPIRING_DAYS_THRESHOLD: 3,
  /** 購入履歴で表示する最大件数 */
  PURCHASE_HISTORY_LIMIT: 15,
  /** 家計簿グラフで表示する月数 */
  BUDGET_MONTHS_DISPLAY: 6,
  /** モーダル表示時のデフォルトのアニメーション時間（ミリ秒） */
  MODAL_ANIMATION_DURATION: 300,
} as const;

/**
 * API関連の設定値
 */
export const API_CONFIG = {
  /** Gemini API の設定 */
  GEMINI: {
    /** 使用するモデル名 */
    MODEL: 'gemini-2.5-flash-lite',
    /** 生成時の温度パラメータ（0.0-1.0、低いほど決定的な出力） */
    TEMPERATURE: 0.1,
    /** 生成する最大トークン数 */
    MAX_TOKENS: 3000,
    /** APIのベースURL */
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models',
  },
  /** レート制限の設定 */
  RATE_LIMIT: {
    /** 時間窓内で許可される最大リクエスト数 */
    MAX_REQUESTS: 10,
    /** レート制限の時間窓（ミリ秒） */
    TIME_WINDOW: 60000, // 1分
  },
} as const;

/**
 * 有効期限ステータスの設定
 * 日数の範囲とそれに対応する表示情報を定義
 */
export const EXPIRY_STATUS_CONFIG = {
  /** 期限切れ（負の日数） */
  expired: {
    minDays: -Infinity,
    maxDays: -1,
    label: '期限切れ',
    urgency: 'high' as const,
    colorClass: 'bg-red-500',
    textColorClass: 'text-red-600',
  },
  /** 本日期限切れ */
  today: {
    minDays: 0,
    maxDays: 0,
    label: '今日まで',
    urgency: 'high' as const,
    colorClass: 'bg-red-400',
    textColorClass: 'text-red-500',
  },
  /** 明日期限切れ */
  tomorrow: {
    minDays: 1,
    maxDays: 1,
    label: '明日まで',
    urgency: 'medium' as const,
    colorClass: 'bg-orange-400',
    textColorClass: 'text-orange-500',
  },
  /** 数日以内に期限切れ */
  soon: {
    minDays: 2,
    maxDays: 3,
    label: '数日以内',
    urgency: 'medium' as const,
    colorClass: 'bg-yellow-400',
    textColorClass: 'text-yellow-600',
  },
  /** 安全な期間 */
  safe: {
    minDays: 4,
    maxDays: Infinity,
    label: '安全',
    urgency: 'low' as const,
    colorClass: 'bg-green-400',
    textColorClass: 'text-green-600',
  },
} as const;

/**
 * 有効期限ステータスの型
 */
export type ExpiryStatusType = keyof typeof EXPIRY_STATUS_CONFIG;

/**
 * カテゴリごとのデフォルト賞味期限日数
 * AIが賞味期限を推定できなかった場合のフォールバック値として使用
 */
export const DEFAULT_EXPIRY_DAYS_BY_CATEGORY: Record<FoodCategory, number> = {
  '野菜': 5,
  '肉類': 3,
  '魚類': 2,
  '乳製品': 7,
  '調味料': 365,
  'パン': 5,
  '麺類': 7,
  '冷凍食品': 60,
  'その他': 7,
} as const;
