#!/bin/bash
# Script to commit and push generated Astoria map files to git
# This runs after update_progress.py generates new map data

# Don't use set -e here - we need to handle errors manually for better control

# Lock file to prevent concurrent runs (Render sometimes retries after "Application exited early")
LOCK_FILE="/tmp/astoria-commit-push.lock"

# Function to cleanup lock on exit
cleanup_lock() {
    if [ -f "$LOCK_FILE" ]; then
        rm -f "$LOCK_FILE"
    fi
}
trap cleanup_lock EXIT

# Try to acquire lock (non-blocking)
if [ -f "$LOCK_FILE" ]; then
    # Check if lock is stale (older than 10 minutes)
    if [ -n "$(find "$LOCK_FILE" -mmin +10 2>/dev/null)" ]; then
        echo "⚠️  Removing stale lock file (older than 10 minutes)"
        rm -f "$LOCK_FILE"
    else
        LOCK_PID=$(cat "$LOCK_FILE" 2>/dev/null)
        # Check if the process is still running
        if [ -n "$LOCK_PID" ] && kill -0 "$LOCK_PID" 2>/dev/null; then
            echo "⚠️  Another instance is already running (PID: $LOCK_PID). Exiting to prevent duplicate commits."
            echo "ℹ️  This is likely Render's automatic retry after 'Application exited early'"
            exit 0  # Exit gracefully - another instance is handling it
        else
            echo "⚠️  Removing stale lock file (process not running)"
            rm -f "$LOCK_FILE"
        fi
    fi
fi

# Create lock file with our PID
echo $$ > "$LOCK_FILE"
echo "🔒 Lock acquired (PID: $$)"

echo "📦 Committing updated Astoria map files..."

# Navigate to project root (from /opt/render/project/src/backend/app/scripts/astoria to /opt/render/project/src)
cd /opt/render/project/src || {
    echo "❌ Error: Could not navigate to project root"
    exit 1
}

# Verify we're in a git repository
if [ ! -d .git ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Ensure we're on main branch (Render may checkout in detached HEAD)
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" = "HEAD" ]; then
    echo "📍 Detected detached HEAD, switching to main branch..."
    git checkout main || {
        echo "❌ Error: Could not checkout main branch"
        exit 1
    }
fi

# Configure git for automated commits
git config user.name "Astoria Conquest Bot"
git config user.email "astoria-bot@camilomartinez.co"

# Stash any uncommitted changes (like test_render_workflow.sh) before pulling
git stash --include-untracked --quiet 2>/dev/null || true

# Pull latest changes from remote FIRST (before committing) to avoid conflicts
echo "📥 Pulling latest changes from remote..."
if ! git pull --rebase origin main 2>/dev/null; then
    # If rebase fails, try regular merge
    echo "⚠️  Rebase failed, trying merge..."
    if ! git pull --no-rebase origin main 2>/dev/null; then
        echo "⚠️  Pull failed, but continuing with local changes..."
    fi
fi

# Restore stashed changes (our generated files should be here)
# If there are conflicts, we want our generated files (theirs in stash context) to win
if ! git stash pop --quiet 2>/dev/null; then
    # If stash pop had conflicts, resolve them by keeping our generated files
    echo "⚠️  Stash pop had conflicts, resolving by keeping generated files..."
    git checkout --theirs public/data/astoria-conquest/astoria-progress-stats.json 2>/dev/null || true
    git checkout --theirs public/data/astoria-conquest/astoria-covered-streets.geojson 2>/dev/null || true
    git checkout --theirs public/data/astoria-conquest/astoria-base-map.geojson 2>/dev/null || true
    # Drop the stash since we've manually resolved
    git stash drop --quiet 2>/dev/null || true
fi

# Check if there are changes to commit (compare working directory against HEAD)
# This checks if the generated files differ from what's in the last commit
# Use both staged and unstaged diff to catch all changes
HAS_CHANGES=false
if ! git diff --quiet HEAD -- public/data/astoria-conquest/ 2>/dev/null; then
    HAS_CHANGES=true
elif ! git diff --cached --quiet HEAD -- public/data/astoria-conquest/ 2>/dev/null; then
    HAS_CHANGES=true
fi

if [ "$HAS_CHANGES" = false ]; then
    echo "✅ No changes to commit - map data is up to date"
    echo "ℹ️  Generated files are identical to the latest commit"
    exit 0
fi

# Verify files exist before adding
if [ ! -f "public/data/astoria-conquest/astoria-progress-stats.json" ] || \
   [ ! -f "public/data/astoria-conquest/astoria-covered-streets.geojson" ] || \
   [ ! -f "public/data/astoria-conquest/astoria-base-map.geojson" ]; then
    echo "❌ Error: Generated files are missing"
    exit 1
fi

# Add the generated files
git add public/data/astoria-conquest/astoria-covered-streets.geojson
git add public/data/astoria-conquest/astoria-progress-stats.json
git add public/data/astoria-conquest/astoria-base-map.geojson

# Final check: ensure we actually have changes after staging
if git diff --cached --quiet HEAD -- public/data/astoria-conquest/ 2>/dev/null; then
    echo "✅ No changes to commit after staging - map data is identical to HEAD"
    git reset HEAD public/data/astoria-conquest/ 2>/dev/null || true
    exit 0
fi

# Create commit with timestamp
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
git commit -m "chore: update Astoria Conquest map data - ${TIMESTAMP}

Automatically generated by Render cron job.
- Updated covered streets
- Updated progress stats
- Refreshed base map" || {
    echo "❌ Error: Failed to create commit"
    exit 1
}


# Push to main branch
echo "📤 Pushing to GitHub..."
if git push origin main; then
    echo "✅ Successfully pushed updated map data to GitHub"
    echo "🚀 Vercel will auto-deploy with the new data"
else
    echo "❌ Error: Failed to push to GitHub"
    exit 1
fi
