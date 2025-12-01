# Vercelデプロイ手順

このドキュメントでは、Magazine Thumbnail GeneratorをVercelに永久デプロイする手順を説明します。

## 前提条件

- GitHubアカウント
- Vercelアカウント（無料）

## デプロイ手順

### 1. Vercelアカウントの作成

1. [Vercel](https://vercel.com)にアクセス
2. 「Sign Up」をクリック
3. GitHubアカウントでログイン

### 2. GitHubリポジトリの準備

このリポジトリはすでにGitHubにプッシュされています：
- リポジトリURL: https://github.com/Trudibussi/Magazine_Thumbnail_Generator

### 3. Vercelでプロジェクトをインポート

1. Vercelダッシュボードにログイン
2. 「Add New...」→「Project」をクリック
3. 「Import Git Repository」セクションで、GitHubリポジトリを検索
4. `Magazine_Thumbnail_Generator` を選択
5. 「Import」をクリック

### 4. プロジェクト設定

Vercelが自動的に以下を検出します：
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

設定を確認して「Deploy」をクリックします。

### 5. デプロイ完了

数分後、デプロイが完了します。Vercelが自動的に以下を提供します：
- **本番URL**: `https://your-project-name.vercel.app`
- **プレビューURL**: プルリクエストごとに自動生成
- **自動SSL証明書**: HTTPS対応

### 6. カスタムドメインの設定（オプション）

1. Vercelダッシュボードでプロジェクトを開く
2. 「Settings」→「Domains」をクリック
3. カスタムドメインを追加
4. DNSレコードを設定（Vercelが指示を表示）

## 自動デプロイ

GitHubリポジトリにプッシュするたびに、Vercelが自動的に再デプロイします：
- **mainブランチ**: 本番環境に自動デプロイ
- **その他のブランチ**: プレビュー環境に自動デプロイ

## 環境変数の設定（必要に応じて）

このプロジェクトはクライアントサイドでAPIキーを管理するため、環境変数の設定は不要です。

## トラブルシューティング

### ビルドエラーが発生した場合

1. ローカルで `npm run build` を実行して確認
2. `package.json` の依存関係を確認
3. Node.jsバージョンを確認（推奨: 18.x以上）

### デプロイ後に動作しない場合

1. ブラウザのコンソールでエラーを確認
2. Vercelのログを確認
3. APIキーが正しく設定されているか確認

## サポート

問題が発生した場合は、以下を確認してください：
- [Vercelドキュメント](https://vercel.com/docs)
- [Viteドキュメント](https://vitejs.dev/)
- GitHubリポジトリのIssues

## ライセンス

MIT License
