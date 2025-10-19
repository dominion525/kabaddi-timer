/**
 * グローバル型定義
 * 外部ライブラリやwindowオブジェクトの拡張型定義
 */

interface Window {
  /**
   * Lucide Icons ライブラリ
   * CDN経由で読み込まれるアイコンライブラリ
   */
  lucide?: {
    createIcons: () => void;
  };

  /**
   * QRious ライブラリ
   * QRコード生成ライブラリ
   */
  QRious?: new (options: {
    element?: HTMLElement;
    value?: string;
    size?: number;
    level?: 'L' | 'M' | 'Q' | 'H';
    background?: string;
    foreground?: string;
  }) => unknown;

  /**
   * アプリケーションリビジョン
   * ビルド時に注入されるGitコミットハッシュ
   */
  APP_REVISION?: string;

  /**
   * インデックスページ用グローバル関数
   * HTML onclick属性から呼び出されるため、windowオブジェクトに公開
   */
  createNewTimer?: () => void;
  goToTimer?: (gameId: string) => void;
  openCreditsModal?: () => void;
  closeCreditsModal?: () => void;
}
