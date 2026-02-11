#!/usr/bin/env bash
set -euo pipefail

TARGET_BRANCH="${1:-merge-ready-main}"
SOURCE_BRANCH="${2:-$(git branch --show-current)}"

if ! git rev-parse --verify "$SOURCE_BRANCH" >/dev/null 2>&1; then
  echo "Errore: branch sorgente '$SOURCE_BRANCH' non trovato." >&2
  exit 1
fi

BASE_REF=""
if git rev-parse --verify origin/main >/dev/null 2>&1; then
  BASE_REF="origin/main"
elif git rev-parse --verify main >/dev/null 2>&1; then
  BASE_REF="main"
else
  ROOT_COMMIT="$(git rev-list --max-parents=0 HEAD | tail -n 1)"
  git branch main "$ROOT_COMMIT" >/dev/null 2>&1 || true
  BASE_REF="main"
fi

CURRENT_BRANCH="$(git branch --show-current)"

# crea/aggiorna il branch target partendo dalla base più pulita possibile
if git rev-parse --verify "$TARGET_BRANCH" >/dev/null 2>&1; then
  git branch -f "$TARGET_BRANCH" "$BASE_REF" >/dev/null
else
  git branch "$TARGET_BRANCH" "$BASE_REF" >/dev/null
fi

git switch "$TARGET_BRANCH" >/dev/null

# porta dentro i file del branch sorgente senza merge commit
# (sovrascrive l'albero di lavoro con il contenuto del branch sorgente)
git checkout "$SOURCE_BRANCH" -- .

if git diff --cached --quiet && git diff --quiet; then
  echo "Nessuna differenza da applicare: branch già allineato." >&2
else
  git add -A
  git commit -m "Create conflict-minimized branch from $BASE_REF using $SOURCE_BRANCH"
fi

git switch "$CURRENT_BRANCH" >/dev/null

echo "Branch pronto: $TARGET_BRANCH (base: $BASE_REF, sorgente: $SOURCE_BRANCH)"
echo "Se hai il remote configurato, pubblicalo con: git push -u origin $TARGET_BRANCH"
