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

### 1. Draft PR を作成する

ブランチを切ったらすぐに Draft PR を作成し、description に実装計画を書く。

```bash
gh pr create --draft --title "feat/ping-command" --body "## 計画
- /ping コマンドを追加する
- Service 不要（ロジックなし）
"
```

計画は作業中に随時 `gh pr edit` で更新してよい。Draft PR 中はマージされない。

### 2. Ready for Review に変更する

実装が完了したら Ready for Review に変更する。

```bash
gh pr ready
```

### 3. レビュー

行番号を指定したコメントで PR にレビューを残す。

```bash
gh api repos/{owner}/{repo}/pulls/{number}/reviews \
  --method POST \
  --field event="COMMENT" \
  --field 'comments[][path]=src/commands/ping.ts' \
  --field 'comments[][line]=42' \
  --field 'comments[][body]=コメント内容'
```

`{owner}` `{repo}` `{number}` は実際の値に置き換えること。
