#!/bin/bash
# Wrapper script for Render cron jobs to prevent automatic retries
# Render retries cron jobs that "exit early" - this wrapper prevents that

set -e

echo "🚀 Starting Astoria Conquest weekly update..."
echo "📅 Timestamp: $(date -u)"
echo ""

# Global lock file to prevent concurrent runs across retries
GLOBAL_LOCK="/tmp/astoria-cron-running.lock"
LOCK_MIN_AGE=300  # Keep lock for 5 minutes minimum to prevent retries

# Check if another instance ran recently
if [ -f "$GLOBAL_LOCK" ]; then
    LOCK_TIME=$(stat -c %Y "$GLOBAL_LOCK" 2>/dev/null || stat -f %m "$GLOBAL_LOCK" 2>/dev/null)
    CURRENT_TIME=$(date +%s)
    AGE=$((CURRENT_TIME - LOCK_TIME))
    
    if [ $AGE -lt $LOCK_MIN_AGE ]; then  # Less than 5 minutes old
        echo "⚠️  Another instance completed $AGE seconds ago"
        echo "⚠️  This is likely a Render auto-retry. Exiting gracefully."
        echo "✅ Skipping duplicate run to prevent conflicts"
        # Keep the lock file to prevent further retries
        exit 0
    else
        echo "ℹ️  Removing stale lock (older than $LOCK_MIN_AGE seconds)"
        rm -f "$GLOBAL_LOCK"
    fi
fi

# Check git for recent commits (additional safety check)
cd /opt/render/project/src 2>/dev/null || cd "$(dirname "$0")/../../.." 2>/dev/null || true
if [ -d .git ]; then
    # Check if there's a recent commit to astoria files (within last 5 minutes)
    RECENT_COMMIT=$(git log -1 --since="5 minutes ago" --format="%H" -- "public/data/astoria-conquest/" 2>/dev/null || true)
    if [ -n "$RECENT_COMMIT" ]; then
        COMMIT_TIME=$(git log -1 --format="%ct" "$RECENT_COMMIT" 2>/dev/null || echo "0")
        CURRENT_TIME=$(date +%s)
        AGE=$((CURRENT_TIME - COMMIT_TIME))
        if [ $AGE -lt 300 ]; then
            echo "⚠️  Recent commit detected ($AGE seconds ago)"
            echo "⚠️  This is likely from a previous run. Exiting to prevent duplicate commits."
            echo "✅ Skipping duplicate run"
            # Create lock file to prevent further retries
            echo $$ > "$GLOBAL_LOCK"
            # Schedule lock removal in background (after 5 minutes)
            (sleep $LOCK_MIN_AGE && rm -f "$GLOBAL_LOCK") &
            exit 0
        fi
    fi
fi

# Create lock file with timestamp
echo "$(date +%s):$$" > "$GLOBAL_LOCK"
# Don't remove lock on exit - keep it for minimum period to prevent retries
# We'll remove it manually after sleep

# Run the actual workflow
bash backend/app/scripts/astoria/setup_git.sh
cd backend
poetry run python app/scripts/astoria/update_progress.py
poetry run python app/scripts/correlate_activities.py
bash app/scripts/astoria/commit_and_push.sh

echo ""
echo "✅ ================================================"
echo "✅ ALL TASKS COMPLETED SUCCESSFULLY"
echo "✅ ================================================"
echo "📊 Summary:"
echo "   - Git setup: ✅"
echo "   - Astoria progress update: ✅"
echo "   - Activity correlation: ✅"
echo "   - Git commit & push: ✅"
echo ""
echo "🎉 Cron job finished at $(date -u)"
echo "⏱️  Total runtime: $SECONDS seconds"

# Sleep to ensure Render doesn't think we exited early
# Render free tier auto-retries cron jobs that exit in under ~2 minutes
# We sleep for 2+ minutes to prevent the "Application exited early" retry
echo "⏸️  Sleeping for 150 seconds to prevent Render auto-retry..."
sleep 150

# Remove lock file after sleep period
# This allows the lock to persist during the sleep, preventing retries
rm -f "$GLOBAL_LOCK" 2>/dev/null || true

echo "✅ Lock released. Exiting successfully."
exit 0
