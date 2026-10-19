<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

このプロジェクトは学祭の屋台用注文システムです。以下の要件に従って開発してください：

## 技術スタック

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Better-SQLite3

## デザイン要件

- レスポンシブデザイン対応
- シンプルかつモダンな UI
- 白黒/モノトーンカラーパレット
- 絵文字は使用しない

## 機能要件

- 担々麺のみ注文可能
- 1 回の注文で最大 5 個まで
- 注文番号による呼び出しシステム
- 自動更新機能（5 秒間隔）
- 決済機能は含まない

## データベース

- SQLite を使用
- 注文ステータス: pending（調理中）、ready（呼び出し中）、completed（完了）

## デプロイ

- Render でのデプロイを想定
