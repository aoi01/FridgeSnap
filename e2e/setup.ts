// 🎭 E2E テストセットアップ
// Playwrightベースのセットアップ例

export const E2E_CONFIG = {
  baseURL: 'http://localhost:5173',
  timeout: 30000,
  retries: 2,
  screenshot: 'only-on-failure',
  video: 'retain-on-failure'
}

export const TEST_DATA = {
  validReceiptFile: 'test-receipt.jpg',
  invalidFile: 'document.pdf',
  testFoodItems: [
    {
      name: 'にんじん',
      category: '野菜',
      price: '150'
    },
    {
      name: '牛肉',
      category: '肉類',
      price: '800'
    }
  ]
}

// セレクター定数
export const SELECTORS = {
  // ナビゲーション
  fridgeTab: '[data-testid="fridge-tab"]',
  basketTab: '[data-testid="basket-tab"]',
  recipesTab: '[data-testid="recipes-tab"]',
  budgetTab: '[data-testid="budget-tab"]',
  
  // レシートスキャナー
  scannerButton: '[data-testid="scanner-button"]',
  fileInput: 'input[type="file"]',
  cameraButton: '[data-testid="camera-button"]',
  
  // 食材管理
  foodItemCard: '[data-testid="food-item-card"]',
  addToBasketButton: '[data-testid="add-to-basket"]',
  editItemButton: '[data-testid="edit-item"]',
  deleteItemButton: '[data-testid="delete-item"]',
  
  // 今日のバスケット
  basketItem: '[data-testid="basket-item"]',
  clearBasketButton: '[data-testid="clear-basket"]',
  totalPrice: '[data-testid="total-price"]',
  
  // モーダル
  modal: '[data-testid="modal"]',
  modalClose: '[data-testid="modal-close"]',
  saveButton: '[data-testid="save-button"]',
  cancelButton: '[data-testid="cancel-button"]'
}