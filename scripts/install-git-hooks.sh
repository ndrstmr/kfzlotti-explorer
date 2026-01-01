#!/bin/bash
# Install Git Hooks
# This script copies the hook templates to .git/hooks/ and makes them executable

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOKS_DIR="$SCRIPT_DIR/git-hooks"
GIT_HOOKS_DIR="$SCRIPT_DIR/../.git/hooks"

echo "📦 Installing Git Hooks..."

# Check if .git directory exists
if [ ! -d "$GIT_HOOKS_DIR" ]; then
  echo "⚠️  Warning: .git/hooks directory not found. Are you in a Git repository?"
  exit 1
fi

# Install pre-commit hook
if [ -f "$HOOKS_DIR/pre-commit" ]; then
  cp "$HOOKS_DIR/pre-commit" "$GIT_HOOKS_DIR/pre-commit"
  chmod +x "$GIT_HOOKS_DIR/pre-commit"
  echo "✅ Installed pre-commit hook"
else
  echo "⚠️  Warning: pre-commit hook template not found"
fi

# Install pre-push hook
if [ -f "$HOOKS_DIR/pre-push" ]; then
  cp "$HOOKS_DIR/pre-push" "$GIT_HOOKS_DIR/pre-push"
  chmod +x "$GIT_HOOKS_DIR/pre-push"
  echo "✅ Installed pre-push hook"
else
  echo "⚠️  Warning: pre-push hook template not found"
fi

echo ""
echo "🎉 Git hooks installed successfully!"
echo ""
echo "Hooks installed:"
echo "  - pre-commit: Runs ESLint before every commit"
echo "  - pre-push: Runs ESLint + Build before every push"
echo ""
echo "To skip hooks (not recommended), use:"
echo "  git commit --no-verify"
echo "  git push --no-verify"
