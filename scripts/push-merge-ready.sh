#!/usr/bin/env bash
set -euo pipefail

BRANCH_NAME="${1:-merge-ready-main}"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Errore: non sei dentro una repository Git." >&2
  echo "Apri il TERMINALE nella cartella del progetto e rilancia questo script." >&2
  exit 1
fi

if ! git rev-parse --verify "$BRANCH_NAME" >/dev/null 2>&1; then
  echo "Errore: branch '$BRANCH_NAME' non trovato." >&2
  echo "Prima crea il branch, poi rilancia." >&2
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "Errore: il remote 'origin' non è configurato." >&2
  echo "Nel TERMINALE del progetto esegui prima:" >&2
  echo "  git remote add origin https://github.com/<utente>/<repo>.git" >&2
  exit 1
fi

echo "Sto pubblicando '$BRANCH_NAME' su origin..."
git push -u origin "$BRANCH_NAME"

echo
echo "Fatto. Ora apri GitHub > Pull requests > New pull request"
echo "base: main | compare: $BRANCH_NAME"
