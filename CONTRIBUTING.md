# Contributing

## ブランチ戦略

ブランチ名はコミットメッセージの prefix と同じ形式を使用する。

```
<prefix>/<content>
```

### 例

| ブランチ名          | 内容                 |
| ------------------- | -------------------- |
| `feat/ping-command` | ping コマンドの追加  |
| `fix/member-join-log-missing` | 入室ログが記録されないバグを修正 |
| `chore/update-deps` | 依存パッケージの更新 |

prefix の一覧は [README.md — コミットメッセージ > prefix 一覧](README.md#prefix-一覧) を参照。

---

## プルリクエストの流れ

### 1. 計画ファイルを作成して Draft PR を作る

ブランチを切り、`plan/<branch-name>.md` に実装計画を書いてコミットし、Draft PR を作成する。

```bash
git checkout -b feat/ping-command
# plan/feat-ping-command.md を作成・コミット
gh pr create --draft --title "feat: /ping コマンドを追加"
```

### 2. 実装する

計画に沿ってコードを書く。

### 3. レビュー

`gh pr diff` で差分を読み、行番号を指定したインラインコメントで PR にレビューを残す。

```bash
gh api repos/{owner}/{repo}/pulls/{number}/reviews \
  --method POST \
  --field event="COMMENT" \
  --field 'comments[][path]=src/commands/ping.ts' \
  --field 'comments[][line]=42' \
  --field 'comments[][body]=コメント内容'
```

`{owner}` `{repo}` `{number}` は実際の値に置き換えること。

### 4. マージ

LGTM が出たら計画ファイルを削除してコミットし、Ready for Review に変更してマージする。

```bash
rm plan/feat-ping-command.md
git add -A && git commit -m "chore: 計画ファイルを削除"
gh pr ready
gh pr merge --squash --delete-branch
```
