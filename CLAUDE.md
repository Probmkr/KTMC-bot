# KTMC Bot — Claude Instructions

- コーディング規約・アーキテクチャは [CONVENTIONS.md](CONVENTIONS.md) を参照すること
- セットアップ・デプロイ手順・コミットメッセージ形式は [README.md](README.md) を参照すること
- PR・レビューの手順は [CONTRIBUTING.md](CONTRIBUTING.md) を参照すること

## パッケージバージョン

- パッケージのバージョンを判断する際は、記憶や推測に頼らず `npm show <package> version` で最新バージョンを取得して使うこと
- `package.json` のバージョンと最新バージョンが一致しているか確認が必要な場合は `npm outdated` を使うこと

## 開発フロー

1. **計画**: ブランチを切り、`plan/` ディレクトリに実装計画の md ファイルを作成してコミットし、Draft PR を作成する
2. **実装**: 計画に沿ってコードを書く
3. **レビュー**: `gh pr diff` で差分を読み、`gh api` を使って行番号指定のレビューコメントを PR に投稿する
4. **マージ**: LGTM が出たら計画ファイルを削除してコミットし、`gh pr ready` で Ready for Review に変更してマージする
