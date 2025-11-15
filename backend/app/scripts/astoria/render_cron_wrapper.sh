#!/bin/bash
# Wrapper script for Render cron jobs to prevent automatic retries
# Render retries cron jobs that "exit early" - this wrapper prevents that

set -e

echo "🚀 Starting Astoria Conquest weekly update..."
echo "📅 Timestamp: $(date -u)"
echo ""

# Global lock file to prevent concurrent runs across retries
GLOBAL_LOCK="/tmp/astoria-cron-running.lock"

# Check if another instance is running
if [ -f "$GLOBAL_LOCK" ]; then
    LOCK_TIME=$(stat -c %Y "$GLOBAL_LOCK" 2>/dev/null || stat -f %m "$GLOBAL_LOCK" 2>/dev/null)
    CURRENT_TIME=$(date +%s)
    AGE=$((CURRENT_TIME - LOCK_TIME))
    
    if [ $AGE -lt 3600 ]; then  # Less than 1 hour old
        echo "⚠️  Another instance started $AGE seconds ago"
        echo "⚠️  This is likely a Render auto-retry. Exiting gracefully."
        echo "✅ Skipping duplicate run to prevent conflicts"
        sleep 10  # Sleep to avoid rapid retry loop
        exit 0
    else
        echo "⚠️  Removing stale lock (older than 1 hour)"
        rm -f "$GLOBAL_LOCK"
    fi
fi

# Create lock file
echo $$ > "$GLOBAL_LOCK"
trap "rm -f $GLOBAL_LOCK" EXIT

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
# Render expects cron jobs to take some time
sleep 10

exit 0
