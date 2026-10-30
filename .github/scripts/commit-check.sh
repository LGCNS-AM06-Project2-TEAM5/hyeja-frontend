#!/usr/bin/env bash
# AI 도구 공동 작성자·생성 표시 자동 정리 (commit-check 워크플로에서 실행)
# - 작업 브랜치: 표시를 지우고 AI 작성자는 사람으로 바꿔 다시 올린 뒤 commit-check 성공 상태를 남김
# - PR 설명: 생성 표시 줄을 지움
# - main·develop·기본 브랜치: 고치지 않고 표시가 있으면 실패
set -euo pipefail

AI='(claude|anthropic|openai|chatgpt|gpt-?[0-9]|codex|copilot|cursor|gemini|jules|aider|windsurf|codeium|devin|\[bot\])'
PAT_MSG="^[[:space:]]*(co-authored-by|generated[- ]by|generated with|made[- ]with|assisted[- ]by|written[- ]by)[: ].*$AI|generated with .*$AI"
export AI PAT_MSG
DEFAULT="${DEFAULT_BRANCH:-develop}"
failed=0

is_protected() { case "$1" in main|develop|"$DEFAULT") return 0 ;; *) return 1 ;; esac; }

has_ai() { # $1 = rev-list 범위
  local c
  for c in $(git rev-list $1); do
    git log -1 --format=%B "$c" | grep -qiE "$PAT_MSG" && return 0
    git log -1 --format='%an %ae %cn %ce' "$c" | grep -qiE "$AI" && return 0
  done
  return 1
}

clean_pr_body() { # $1 = PR 번호
  local body cleaned
  body=$(gh pr view "$1" -R "$REPO" --json body -q .body)
  cleaned=$(printf '%s\n' "$body" | grep -viE "(co-authored-by|generated[- ]by|generated with|made[- ]with|assisted[- ]by|written[- ]by).*$AI" || true)
  if [ "$(printf '%s' "$body")" != "$(printf '%s' "$cleaned")" ]; then
    gh pr edit "$1" -R "$REPO" --body "$cleaned" >/dev/null
    echo "::notice::PR #$1 설명에서 AI 생성 표시를 지웠습니다."
  fi
}

check_branch() { # $1 = 브랜치, $2 = 고칠 수 있는지(true/false)
  local branch="$1" editable="$2" base range target new fix_name fix_email
  git fetch -q origin "+refs/heads/$branch:refs/remotes/origin/$branch" || return 0
  base=$(git merge-base "origin/$DEFAULT" "origin/$branch" 2>/dev/null || true)
  if [ -n "$base" ] && [ "$base" != "$(git rev-parse "origin/$branch")" ]; then
    range="$base..origin/$branch"
  elif [ -n "$base" ]; then
    return 0
  else
    range="origin/$branch"
  fi
  has_ai "$range" || { echo "확인 완료: $branch"; return 0; }

  if [ "$editable" != true ]; then
    echo "::error::$branch 에 AI 도구 표시가 있는 커밋이 있습니다. 작업 브랜치에서 PR로 올려 주세요(자동으로 정리됩니다)."
    failed=1; return 0
  fi

  fix_name="${FIX_NAME:-}"; fix_email="${FIX_EMAIL:-}"
  if [ -z "$fix_name" ]; then
    read -r fix_name fix_email < <(git log --format='%an %ae' $range | grep -viE "$AI" | head -1 || true)
  fi
  [ -z "$fix_name" ] && fix_name="$GITHUB_ACTOR" && fix_email="${GITHUB_ACTOR_ID}+${GITHUB_ACTOR}@users.noreply.github.com"
  export FIX_NAME="$fix_name" FIX_EMAIL="$fix_email"

  git checkout -q -B "$branch" "origin/$branch"
  target="$branch"; [ -n "$base" ] && target="$base..$branch"
  FILTER_BRANCH_SQUELCH_WARNING=1 git filter-branch -f \
    --msg-filter '{ grep -viE "$PAT_MSG" || true; } | git stripspace' \
    --env-filter '
      if printf "%s %s" "$GIT_AUTHOR_NAME" "$GIT_AUTHOR_EMAIL" | grep -qiE "$AI"; then
        export GIT_AUTHOR_NAME="$FIX_NAME" GIT_AUTHOR_EMAIL="$FIX_EMAIL"; fi
      if printf "%s %s" "$GIT_COMMITTER_NAME" "$GIT_COMMITTER_EMAIL" | grep -qiE "$AI"; then
        export GIT_COMMITTER_NAME="$FIX_NAME" GIT_COMMITTER_EMAIL="$FIX_EMAIL"; fi' \
    -- $target >/dev/null
  git push -q --force origin "$branch"
  new=$(git rev-parse HEAD)
  gh api "repos/$REPO/statuses/$new" -f state=success -f context=commit-check \
    -f description="AI 도구 표시를 자동으로 정리했습니다" >/dev/null
  git update-ref -d "refs/original/refs/heads/$branch" 2>/dev/null || true
  echo "::notice::$branch 의 AI 도구 표시를 자동으로 정리해 다시 올렸습니다. 로컬에서는 git pull --rebase 로 받아 주세요."
  unset FIX_NAME FIX_EMAIL
}

case "$EVENT" in
  push)
    if is_protected "$REF_NAME"; then
      if [ -n "${BEFORE:-}" ] && git cat-file -e "$BEFORE^{commit}" 2>/dev/null; then r="$BEFORE..$SHA"; else r="$SHA -1"; fi
      if has_ai "$r"; then echo "::error::$REF_NAME 에 AI 도구 표시가 있는 커밋이 들어왔습니다."; failed=1; else echo "확인 완료: $REF_NAME"; fi
    else
      check_branch "$REF_NAME" true
    fi ;;
  pull_request)
    if [ "$PR_SAME_REPO" = true ]; then
      clean_pr_body "$PR_NUMBER"
      FIX_NAME="$PR_USER" FIX_EMAIL="${PR_USER_ID}+${PR_USER}@users.noreply.github.com" check_branch "$PR_BRANCH" true
    else
      check_branch "$PR_BRANCH" false
    fi ;;
  *)  # schedule, workflow_dispatch: 모든 작업 브랜치와 열린 PR 순찰
    for b in $(git ls-remote --heads origin | sed 's#.*refs/heads/##'); do
      is_protected "$b" || check_branch "$b" true
    done
    for n in $(gh pr list -R "$REPO" --state open --json number -q '.[].number'); do clean_pr_body "$n"; done ;;
esac

exit $failed
