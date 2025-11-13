#!/bin/bash
# Test the full Astoria map update flow locally
# This simulates what Render will do

set -e  # Exit on error

echo "🧪 Testing Astoria map update flow..."
echo ""

# Navigate to project root
cd "$(dirname "$0")/../../../.."

echo "Step 1/4: Generating base map..."
cd backend && poetry run python app/scripts/astoria/generate_base_map.py
echo "✅ Base map generated"
echo ""

echo "Step 2/4: Updating progress map..."
poetry run python app/scripts/astoria/update_progress.py
echo "✅ Progress updated"
echo ""

echo "Step 3/4: Correlating activities..."
poetry run python app/scripts/correlate_activities.py
echo "✅ Activities correlated"
echo ""

echo "Step 4/4: Checking for git changes..."
cd ..
if git diff --quiet public/data/astoria-conquest/; then
    echo "⚠️  No changes detected in map files"
else
    echo "✅ Changes detected in map files:"
    git diff --stat public/data/astoria-conquest/
    echo ""
    echo "Would you like to commit and push these changes? (y/n)"
    read -r response
    if [[ "$response" == "y" ]]; then
        git add public/data/astoria-conquest/
        git commit -m "test: manual Astoria map update"
        git push origin main
        echo "✅ Pushed to GitHub - Vercel will auto-deploy"
    else
        echo "ℹ️  Skipping commit. Run 'git checkout public/data/astoria-conquest/' to discard changes"
    fi
fi

echo ""
echo "🎉 Test complete!"
