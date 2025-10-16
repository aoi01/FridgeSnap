// 🧪 ユーティリティ関数のテスト
import { describe, test, expect } from 'vitest'
import { cn } from './utils'

describe('🔧 Utils Library', () => {
  describe('cn (className utility)', () => {
    test('基本的なクラス名の結合', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    test('条件付きクラス名', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
    })

    test('undefined と null の処理', () => {
      expect(cn('base', undefined, null, 'valid')).toBe('base valid')
    })

    test('空文字列の処理', () => {
      expect(cn('base', '', 'valid')).toBe('base valid')
    })

    test('配列の処理', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3')
    })

    test('オブジェクト形式の条件', () => {
      expect(cn({
        'active': true,
        'hidden': false,
        'default': true
      })).toBe('active default')
    })

    test('複雑な組み合わせ', () => {
      const isActive = true
      const isDisabled = false
      
      expect(cn(
        'btn',
        {
          'btn-active': isActive,
          'btn-disabled': isDisabled
        },
        isActive && 'state-active',
        'btn-primary'
      )).toBe('btn btn-active state-active btn-primary')
    })
  })
})