#!/bin/bash
# Scan for secrets before every git push

PATTERNS=(
  'AIzaSy[A-Za-z0-9_-]{33}'   # Google API keys
  'AKIA[0-9A-Z]{16}'           # AWS Access Key ID
  'sk-[A-Za-z0-9]{32,}'        # OpenAI / generic secret keys
  'ghp_[A-Za-z0-9]{36}'        # GitHub personal access tokens
  'glpat-[A-Za-z0-9_-]{20}'    # GitLab personal access tokens
  'xox[baprs]-[A-Za-z0-9-]+'  # Slack tokens
)

FOUND=0

for pattern in "${PATTERNS[@]}"; do
  matches=$(git diff origin/main...HEAD --unified=0 2>/dev/null | grep "^+" | grep -oE "$pattern" || true)
  if [ -n "$matches" ]; then
    echo "🚨 SECRET DETECTED matching pattern: $pattern"
    echo "$matches"
    FOUND=1
  fi
done

# Also scan the full staged index for the above patterns (catches new files)
for pattern in "${PATTERNS[@]}"; do
  matches=$(git diff --cached --unified=0 2>/dev/null | grep "^+" | grep -oE "$pattern" || true)
  if [ -n "$matches" ]; then
    echo "🚨 SECRET DETECTED in staged files matching: $pattern"
    echo "$matches"
    FOUND=1
  fi
done

if [ "$FOUND" -eq 1 ]; then
  echo ""
  echo "❌ Push blocked: secrets found in commits."
  echo "   Remove the secrets, add the file to .gitignore, and try again."
  exit 1
fi

echo "✅ No secrets detected — push allowed."
exit 0
