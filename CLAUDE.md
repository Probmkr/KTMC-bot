# KTMC Bot — Claude Instructions

- コーディング規約・アーキテクチャは [CONVENTIONS.md](CONVENTIONS.md) を参照すること
- セットアップ・デプロイ手順・コミットメッセージ形式は [README.md](README.md) を参照すること
- PR・レビューの手順は [CONTRIBUTING.md](CONTRIBUTING.md) を参照すること

## 開発フロー

1. **計画**: ブランチを切り、Draft PR を作成して description に実装計画を書く
2. **実装**: 計画に沿ってコードを書く
3. **レビュー**: `gh pr diff` で差分を読み、`gh api` を使って行番号指定のレビューコメントを PR に投稿する
4. **マージ**: `gh pr ready` で Ready for Review に変更し、マージする
