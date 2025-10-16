// 🔒 API セキュリティユーティリティ
// APIキーの検証、レート制限、エラーハンドリングを統合

import { toast } from 'sonner';

// 🔧 APIキー検証インターフェース
interface ApiKeyValidation {
  gemini: boolean;
  rakuten: boolean;
  errors: string[];
}

// 🚨 レート制限クラス
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 10,
    private timeWindow: number = 60000 // 1分
  ) {}

  canMakeRequest(apiName: string): boolean {
    const now = Date.now();
    const apiRequests = this.requests.get(apiName) || [];
    
    // 時間窓外のリクエストを削除
    const recentRequests = apiRequests.filter(time => now - time < this.timeWindow);
    
    if (recentRequests.length >= this.maxRequests) {
      toast.error(`${apiName} API: レート制限に達しました。しばらくお待ちください。`);
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(apiName, recentRequests);
    return true;
  }

  getRemainingRequests(apiName: string): number {
    const requests = this.requests.get(apiName) || [];
    const now = Date.now();
    const recentRequests = requests.filter(time => now - time < this.timeWindow);
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
}

// 🔍 APIキー検証クラス
export class ApiKeyValidator {
  static validate(): ApiKeyValidation {
    const result: ApiKeyValidation = {
      gemini: false,
      rakuten: false,
      errors: []
    };

    // Gemini APIキー検証
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!geminiKey) {
      result.errors.push('VITE_GEMINI_API_KEY が設定されていません');
    } else if (!geminiKey.startsWith('AIza')) {
      result.errors.push('Gemini APIキーの形式が正しくありません');
    } else if (geminiKey === 'your_actual_gemini_api_key_here') {
      result.errors.push('Gemini APIキーがデフォルト値のままです');
    } else {
      result.gemini = true;
    }

    // 楽天APIキー検証
    const rakutenKey = import.meta.env.VITE_RAKUTEN_API_KEY;
    if (!rakutenKey) {
      result.errors.push('VITE_RAKUTEN_API_KEY が設定されていません');
    } else if (rakutenKey === 'your_actual_rakuten_app_id_here') {
      result.errors.push('楽天APIキーがデフォルト値のままです');
    } else {
      result.rakuten = true;
    }

    return result;
  }

  static showValidationErrors(validation: ApiKeyValidation): void {
    if (validation.errors.length > 0) {
      const errorMessage = validation.errors.join('\n');
      toast.error('APIキー設定エラー', {
        description: `${errorMessage}\n\n.envファイルを確認してください。`,
        duration: 10000
      });
      
      // 開発環境でのみ詳細ログを出力
      if (import.meta.env.DEV) {
        console.error('🔒 APIキー検証エラー:', validation.errors);
        console.log('📝 設定方法: https://github.com/your-repo/README.md#setup');
      }
    }
  }
}

// 🛡️ セキュアAPIリクエストクラス
export class SecureApiClient {
  private rateLimiter = new RateLimiter();
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  async makeSecureRequest(
    apiName: string,
    url: string,
    options: RequestInit,
    retryCount = 0
  ): Promise<Response> {
    // レート制限チェック
    if (!this.rateLimiter.canMakeRequest(apiName)) {
      throw new Error(`Rate limit exceeded for ${apiName} API`);
    }

    try {
      // APIキー検証
      const validation = ApiKeyValidator.validate();
      if (
        (apiName === 'gemini' && !validation.gemini) ||
        (apiName === 'rakuten' && !validation.rakuten)
      ) {
        ApiKeyValidator.showValidationErrors(validation);
        throw new Error(`Invalid API key for ${apiName}`);
      }

      const response = await fetch(url, {
        ...options,
        // セキュリティヘッダー追加
        headers: {
          ...options.headers,
          'X-Requested-With': 'XMLHttpRequest',
          'Cache-Control': 'no-cache',
        }
      });

      // レスポンス検証
      if (!response.ok) {
        await this.handleApiError(response, apiName);
      }

      return response;

    } catch (error) {
      return await this.handleRetry(error, apiName, url, options, retryCount);
    }
  }

  private async handleApiError(response: Response, apiName: string): Promise<void> {
    const errorText = await response.text();
    
    switch (response.status) {
      case 401:
        toast.error(`${apiName} API: 認証エラー`, {
          description: 'APIキーを確認してください。'
        });
        throw new Error(`Authentication failed for ${apiName} API`);
        
      case 403:
        toast.error(`${apiName} API: アクセス拒否`, {
          description: 'API権限を確認してください。'
        });
        throw new Error(`Access forbidden for ${apiName} API`);
        
      case 429:
        toast.warning(`${apiName} API: レート制限`, {
          description: 'しばらく時間をおいて再試行してください。'
        });
        throw new Error(`Rate limited by ${apiName} API`);
        
      case 500:
      case 502:
      case 503:
        toast.error(`${apiName} API: サーバーエラー`, {
          description: 'API側で問題が発生しています。'
        });
        throw new Error(`Server error from ${apiName} API: ${response.status}`);
        
      default:
        console.error(`${apiName} API Error:`, errorText);
        throw new Error(`API request failed: ${response.status}`);
    }
  }

  private async handleRetry(
    error: any,
    apiName: string,
    url: string,
    options: RequestInit,
    retryCount: number
  ): Promise<Response> {
    if (retryCount >= this.maxRetries) {
      toast.error(`${apiName} API: 最大再試行回数に達しました`);
      throw error;
    }

    // 指数バックオフ
    const delay = this.retryDelay * Math.pow(2, retryCount);
    await new Promise(resolve => setTimeout(resolve, delay));

    console.log(`🔄 ${apiName} API retry ${retryCount + 1}/${this.maxRetries}`);
    return this.makeSecureRequest(apiName, url, options, retryCount + 1);
  }
}

// 🎯 使用量監視クラス
export class ApiUsageMonitor {
  private static instance: ApiUsageMonitor;
  private usage: Map<string, { count: number, cost: number }> = new Map();
  private readonly warningThreshold = 80; // 80%で警告
  private readonly dailyLimit = 1000; // 1日の制限

  static getInstance(): ApiUsageMonitor {
    if (!ApiUsageMonitor.instance) {
      ApiUsageMonitor.instance = new ApiUsageMonitor();
    }
    return ApiUsageMonitor.instance;
  }

  recordUsage(apiName: string, cost = 1): void {
    const today = new Date().toDateString();
    const key = `${apiName}_${today}`;
    const current = this.usage.get(key) || { count: 0, cost: 0 };
    
    const updated = {
      count: current.count + 1,
      cost: current.cost + cost
    };
    
    this.usage.set(key, updated);

    // 使用量警告
    const usagePercentage = (updated.count / this.dailyLimit) * 100;
    if (usagePercentage >= this.warningThreshold) {
      toast.warning(`${apiName} API 使用量警告`, {
        description: `本日の使用量: ${updated.count}/${this.dailyLimit} (${usagePercentage.toFixed(1)}%)`
      });
    }

    // 開発環境での詳細ログ
    if (import.meta.env.DEV) {
      console.log(`📊 ${apiName} API Usage:`, {
        today: updated.count,
        percentage: usagePercentage.toFixed(1) + '%'
      });
    }
  }

  getUsageStats(apiName: string): { count: number, percentage: number } {
    const today = new Date().toDateString();
    const key = `${apiName}_${today}`;
    const usage = this.usage.get(key) || { count: 0, cost: 0 };
    
    return {
      count: usage.count,
      percentage: (usage.count / this.dailyLimit) * 100
    };
  }
}

// 🔧 設定検証とセットアップヘルパー
export class SecuritySetup {
  static checkEnvironment(): boolean {
    const validation = ApiKeyValidator.validate();
    
    if (validation.errors.length > 0) {
      console.group('🔒 セキュリティセットアップが必要です');
      console.error('APIキーの設定に問題があります:');
      validation.errors.forEach(error => console.error(`- ${error}`));
      console.log('\n📝 設定手順:');
      console.log('1. .env.example を .env にコピー');
      console.log('2. 各APIキーを取得して設定');
      console.log('3. アプリを再起動');
      console.groupEnd();
      return false;
    }

    console.log('✅ APIキー設定: 正常');
    return true;
  }

  static generateSecurityReport(): void {
    const validation = ApiKeyValidator.validate();
    const usageMonitor = ApiUsageMonitor.getInstance();
    
    console.group('🔒 Kitchen Sensei Go - セキュリティレポート');
    
    console.log('APIキー状態:');
    console.log(`- Gemini API: ${validation.gemini ? '✅ 正常' : '❌ エラー'}`);
    console.log(`- 楽天API: ${validation.rakuten ? '✅ 正常' : '❌ エラー'}`);
    
    console.log('\n使用量統計:');
    const geminiStats = usageMonitor.getUsageStats('gemini');
    const rakutenStats = usageMonitor.getUsageStats('rakuten');
    console.log(`- Gemini API: ${geminiStats.count}回 (${geminiStats.percentage.toFixed(1)}%)`);
    console.log(`- 楽天API: ${rakutenStats.count}回 (${rakutenStats.percentage.toFixed(1)}%)`);
    
    if (validation.errors.length > 0) {
      console.log('\n⚠️  解決が必要な問題:');
      validation.errors.forEach(error => console.log(`- ${error}`));
    }
    
    console.groupEnd();
  }
}

// 🌟 エクスポート用のファクトリー関数
export const createSecureApiClient = () => new SecureApiClient();
export const createApiUsageMonitor = () => ApiUsageMonitor.getInstance();

// デバッグモード時の自動セットアップチェック
if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_MODE === 'true') {
  SecuritySetup.checkEnvironment();
}