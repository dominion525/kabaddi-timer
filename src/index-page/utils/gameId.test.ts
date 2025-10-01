import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { base36Encode, generateShortId, validateGameId } from './gameId';

describe('gameId utilities', () => {
  describe('base36Encode', () => {
    it('0をエンコードすると"0"を返す', () => {
      expect(base36Encode(0)).toBe('0');
    });

    it('小さい数値を正しくエンコード', () => {
      expect(base36Encode(1)).toBe('1');
      expect(base36Encode(9)).toBe('9');
      expect(base36Encode(10)).toBe('a');
      expect(base36Encode(35)).toBe('z');
    });

    it('大きい数値を正しくエンコード', () => {
      expect(base36Encode(36)).toBe('10');
      expect(base36Encode(1000)).toBe('rs');
      expect(base36Encode(46656)).toBe('1000'); // 36^3
    });

    it('非常に大きい数値を処理できる', () => {
      const large = 0xffffffffffff; // 48bit max
      const encoded = base36Encode(large);
      expect(encoded).toBeTruthy();
      expect(encoded.length).toBeGreaterThan(0);
      expect(/^[0-9a-z]+$/.test(encoded)).toBe(true);
    });
  });

  describe('generateShortId', () => {
    beforeEach(() => {
      // crypto.randomUUIDをモック
      vi.stubGlobal('crypto', {
        randomUUID: vi.fn()
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('5-6文字のIDを生成', () => {
      const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
      vi.mocked(crypto.randomUUID).mockReturnValue(mockUUID);

      const id = generateShortId();
      expect(id.length).toBeGreaterThanOrEqual(5);
      expect(id.length).toBeLessThanOrEqual(6);
    });

    it('Base36文字のみを使用', () => {
      const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
      vi.mocked(crypto.randomUUID).mockReturnValue(mockUUID);

      const id = generateShortId();
      expect(/^[0-9a-z]+$/.test(id)).toBe(true);
    });

    it('複数回呼び出すと異なるIDを生成（モックなし）', () => {
      vi.unstubAllGlobals();

      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateShortId());
      }

      // 100回生成してすべて異なることを確認
      expect(ids.size).toBe(100);
    });

    it('最小5文字を保証（短いケース）', () => {
      // 非常に小さいUUIDで短いBase36を生成
      const mockUUID = '00000000-0000-0000-0000-000000000001';
      vi.mocked(crypto.randomUUID).mockReturnValue(mockUUID);

      const id = generateShortId();
      expect(id.length).toBeGreaterThanOrEqual(5);
    });

    it('最大6文字に制限（長いケース）', () => {
      // 非常に大きいUUIDで長いBase36を生成
      const mockUUID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
      vi.mocked(crypto.randomUUID).mockReturnValue(mockUUID);

      const id = generateShortId();
      expect(id.length).toBeLessThanOrEqual(6);
    });
  });

  describe('validateGameId', () => {
    describe('有効なケース', () => {
      it('英数字のみのIDを許可', () => {
        const result = validateGameId('abc123');
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('ハイフンを含むIDを許可', () => {
        const result = validateGameId('abc-123-xyz');
        expect(result.valid).toBe(true);
      });

      it('大文字を許可', () => {
        const result = validateGameId('ABC123');
        expect(result.valid).toBe(true);
      });

      it('混在した大文字小文字を許可', () => {
        const result = validateGameId('AbC-123-XyZ');
        expect(result.valid).toBe(true);
      });

      it('最大50文字を許可', () => {
        const longId = 'a'.repeat(50);
        const result = validateGameId(longId);
        expect(result.valid).toBe(true);
      });
    });

    describe('無効なケース', () => {
      it('空文字列を拒否', () => {
        const result = validateGameId('');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('タイマーIDを入力してください');
      });

      it('特殊文字を拒否（スラッシュ）', () => {
        const result = validateGameId('abc/123');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('タイマーIDは英数字とハイフンのみ使用できます');
      });

      it('特殊文字を拒否（ドット）', () => {
        const result = validateGameId('abc.123');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('タイマーIDは英数字とハイフンのみ使用できます');
      });

      it('特殊文字を拒否（アンダースコア）', () => {
        const result = validateGameId('abc_123');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('タイマーIDは英数字とハイフンのみ使用できます');
      });

      it('特殊文字を拒否（スペース）', () => {
        const result = validateGameId('abc 123');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('タイマーIDは英数字とハイフンのみ使用できます');
      });

      it('51文字以上を拒否', () => {
        const tooLongId = 'a'.repeat(51);
        const result = validateGameId(tooLongId);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('タイマーIDが長すぎます（最大50文字）');
      });

      it('パストラバーサル対策（..を拒否）', () => {
        const result = validateGameId('../etc/passwd');
        expect(result.valid).toBe(false);
        // スラッシュが含まれるため、正規表現チェックで先に弾かれる
        expect(result.error).toBe('タイマーIDは英数字とハイフンのみ使用できます');
      });

      it('パストラバーサル対策（//を拒否）', () => {
        const result = validateGameId('abc//xyz');
        expect(result.valid).toBe(false);
        // スラッシュが含まれるため、正規表現チェックで先に弾かれる
        expect(result.error).toBe('タイマーIDは英数字とハイフンのみ使用できます');
      });

      it('日本語を拒否', () => {
        const result = validateGameId('タイマー123');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('タイマーIDは英数字とハイフンのみ使用できます');
      });

      it('絵文字を拒否', () => {
        const result = validateGameId('abc-😀-123');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('タイマーIDは英数字とハイフンのみ使用できます');
      });
    });
  });
});
