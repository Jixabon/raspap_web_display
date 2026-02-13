#!/usr/bin/env bash
#
# git-update — safely update current branch OR reset to a specific tag/release
#
# Usage:
#   git-update                        → update current branch (rebase)
#   git-update v1.2.3                 → stash → reset --hard + clean → pop stash
#   git-update --dry-run v1.2.3       → show what would happen (no changes)
#   git-update -n v1.2.3              → same as --dry-run
#

set -u -e -o pipefail

echo "┌───────────────────────────────┐"
echo "│   RaspAP Web Display Update   │"
echo "└───────────────────────────────┘"

DRY_RUN=false
TARGET_REF=""

# ─── Parse arguments ────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run|-n)
            DRY_RUN=true
            shift
            ;;
        *)
            if [ -z "$TARGET_REF" ]; then
                TARGET_REF="$1"
            else
                echo "Error: Too many arguments. Only one ref allowed."
                echo "Usage: git-update [--dry-run|-n] [tag-or-branch]"
                exit 1
            fi
            shift
            ;;
    esac
done

# ─── 1. Basic checks ────────────────────────────────────────────────
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Error: Not inside a git repository"
    exit 1
fi

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "(detached)")

echo "Current location : ${CURRENT_BRANCH}"
[ -n "$TARGET_REF" ] && echo "Target ref       : $TARGET_REF"
$DRY_RUN && echo "Mode             : DRY-RUN (no changes will be made)"

# ─── 2. Fetch everything ────────────────────────────────────────────
echo
echo "Fetching from all remotes (with prune)..."
if $DRY_RUN; then
    echo "[dry-run] Would run: git fetch --prune"
else
    git fetch --prune --jobs=4 2>/dev/null || git fetch --prune
fi

# ─── 3. Verify target ref exists (if specified) ─────────────────────
if [ -n "$TARGET_REF" ]; then
    if ! git rev-parse --verify --quiet "$TARGET_REF" >/dev/null; then
        echo "Error: Ref '$TARGET_REF' not found after fetch."
        echo "Recent tags:"
        git tag --sort=-v:refname | head -n 12
        exit 1
    fi
    TARGET_COMMIT=$(git rev-parse --short "$TARGET_REF")
    echo "Target commit    : $TARGET_COMMIT"
fi

# ─── 4. Check for any local modifications / untracked files ─────────
HAS_CHANGES=false
if ! git diff --quiet --exit-code || ! git diff --cached --quiet --exit-code || [ -n "$(git ls-files --others --exclude-standard)" ]; then
    HAS_CHANGES=true
    echo "→ Local changes and/or untracked files detected"
else
    echo "Working directory is clean"
fi

# ─── 5. Dry-run preview ─────────────────────────────────────────────
if $DRY_RUN; then
    echo
    if [ -n "$TARGET_REF" ]; then
        echo "[dry-run] Would:"
        echo "  • Stash (including untracked files) — because changes exist: $HAS_CHANGES"
        echo "  • Reset --hard to $TARGET_REF ($TARGET_COMMIT)"
        echo "  • git clean -fd (remove any leftover untracked files)"
        echo "  • Try to pop the stash back"
    else
        echo "[dry-run] Would:"
        echo "  • Stash if changes exist"
        echo "  • Rebase current branch onto upstream (or pull --rebase)"
        echo "  • Pop stash if stashed"
    fi
    echo
    echo "Dry run complete — no changes made."
    exit 0
fi

# ─── 6. Stash (always when target ref + any changes) ────────────────
STASHED=0
if [ -n "$TARGET_REF" ] && $HAS_CHANGES; then
    echo
    echo "Stashing current work (including untracked files)..."
    git stash push --include-untracked -m "WIP - auto-stashed before reset to $TARGET_REF $(date +%Y-%m-%d\ %H:%M)"
    STASHED=1
elif [ -z "$TARGET_REF" ] && $HAS_CHANGES; then
    echo
    echo "Stashing current work before rebase..."
    git stash push --include-untracked -m "WIP - auto-stashed before rebase $(date +%Y-%m-%d\ %H:%M)"
    STASHED=1
fi

# ─── 7. Main action ─────────────────────────────────────────────────
echo

if [ -n "$TARGET_REF" ]; then
    # ── Reset to exact tag state + clean leftovers ──────────────────
    echo "Resetting working tree and index to $TARGET_REF ($TARGET_COMMIT)..."
    git reset --hard "$TARGET_REF"

    echo "Removing any remaining untracked files / directories..."
    git clean -fd

    echo "→ Now at pristine state of $TARGET_REF"
else
    # ── Normal branch update (rebase style) ─────────────────────────
    UPSTREAM=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "")
    if [ -z "$UPSTREAM" ]; then
        echo "No upstream set → falling back to git pull --rebase"
        git pull --rebase --autostash
    else
        echo "Rebasing onto $UPSTREAM..."
        if ! git rebase --autostash "$UPSTREAM"; then
            echo "⚠ Rebase conflict occurred"
            echo "→ Resolve manually: git rebase --continue  or  git rebase --abort"
            exit 1
        fi
        echo "✓ Rebase successful"
    fi
fi

# ─── 8. Re-apply stash if we created one ────────────────────────────
if [ $STASHED -eq 1 ]; then
    echo
    echo "Re-applying your previous changes on top..."
    if git stash pop; then
        echo "✓ Stash applied successfully"
    else
        echo "⚠ Conflicts when re-applying stash"
        echo "  → You are now on a clean $TARGET_REF (or updated branch)"
        echo "  → Resolve conflicts manually, then run: git stash drop"
        echo "  → Or abandon your changes: git reset --hard && git clean -fd"
    fi
fi

# ─── 9. Final status ────────────────────────────────────────────────
echo
echo "Final status:"
git status --short --branch

if [ -n "$TARGET_REF" ]; then
    echo
    echo "Note: You are in detached HEAD state at $TARGET_REF"
    echo "To start a branch here:  git switch -c my-work-branch"
fi

# ─── 10. Restart services ───────────────────────────────────────────
echo
echo "Restarting Services..."


sudo systemctl restart raspap-web.service
sudo systemctl restart raspap-labwc.service

echo
echo "Done."