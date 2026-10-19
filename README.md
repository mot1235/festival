# 注文管理システム

学祭で使用する注文管理システムです。

## 📱 画面構成

### メイン画面 (`/`)

- 注文作成フォーム
- 注文統計（調理中・呼び出し中・総数）
- 調理中注文の管理（調理完了ボタン）
- 呼び出し中注文の管理（受け取り完了ボタン）

### ディスプレイ専用画面 (`/display`)

- 呼び出し番号を大きく表示
- 外部モニター表示に最適化

## 技術スタック

- **フロントエンド**: Next.js 15 (App Router), React 18, TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: PostgreSQL (Neon)
- **デプロイ**: Vercel

## ローカル開発セットアップ

1. 依存関係のインストール:

```bash
npm install
```

2. 環境変数の設定:

`.env.local` ファイルを作成し、以下を設定:

```
DATABASE_URL=your_neon_database_url_here
```

3. 開発サーバーの起動:

```bash
npm run dev
```

4. ブラウザで http://localhost:3000 にアクセス

## Vercel + Neon PostgreSQL デプロイ手順

### 1. Neon データベースの作成

1. [Neon Console](https://console.neon.tech) にログイン
2. 新しいプロジェクトを作成
3. 接続文字列（DATABASE_URL）をコピー

### 2. Vercel デプロイ

1. GitHub リポジトリを Vercel に接続
2. 環境変数 `DATABASE_URL` を設定
   - Vercel Dashboard > Settings > Environment Variables
   - Variable: `DATABASE_URL`
   - Value: Neon からコピーした接続文字列
3. デプロイを実行

### 3. データベース初期化

初回デプロイ後、データベーステーブルは自動的に作成されます。

## データベース

PostgreSQL データベースが使用され、以下のテーブルが自動作成されます：

- `orders`: 注文情報
- `order_sequence`: 注文番号のシーケンス管理

## 注文ステータス

- `pending`: 調理中
- `ready`: 呼び出し中（画面に番号表示）
- `completed`: 受け取り完了

## 使用方法

### 注文から受け渡しまでの流れ

1. **注文作成**: 数量を選択して「注文する」ボタンをクリック
2. **調理管理**: 調理完了時に「調理完了」ボタンをクリック
3. **呼び出し**: 呼び出し番号が表示され、顧客が商品受け取り
4. **受け渡し完了**: 商品受け渡し時に「受け取り完了」ボタンをクリック

### 画面の使い分け

- **メイン画面** (`/`): 注文受付と管理業務の両方を実行
- **ディスプレイ画面** (`/display`): 呼び出し番号の表示専用（外部モニター推奨）
