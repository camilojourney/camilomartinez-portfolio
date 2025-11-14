#!/bin/bash
# 📂 backend/app/scripts/astoria/test_render_workflow.sh
# Test script to simulate Render's workflow locally

set -e  # Exit on any error

echo "🧪 Testing Render Workflow Locally..."
echo "======================================"
echo ""

# Get the project root (3 levels up from this script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo "📁 Project root: $PROJECT_ROOT"
echo "📁 Backend dir: $BACKEND_DIR"
echo ""

# Step 1: Test Poetry installation
echo "1️⃣ Testing Poetry dependency installation..."
cd "$BACKEND_DIR"
poetry install --no-root
echo "   ✅ Poetry install successful"
echo ""

# Step 2: Test base map generation
echo "2️⃣ Testing base map generation..."
cd "$BACKEND_DIR"
poetry run python app/scripts/astoria/generate_base_map.py
echo "   ✅ Base map generated"
echo ""

# Step 3: Test progress update (GPS matching)
echo "3️⃣ Testing progress update (GPS matching)..."
cd "$BACKEND_DIR"
poetry run python app/scripts/astoria/update_progress.py
echo "   ✅ Progress updated"
echo ""

# Step 4: Test activity correlation
echo "4️⃣ Testing activity correlation..."
cd "$BACKEND_DIR"
poetry run python app/scripts/correlate_activities.py
echo "   ✅ Activities correlated"
echo ""

# Step 5: Check if files were generated
echo "5️⃣ Checking generated files..."
FILES_TO_CHECK=(
    "$PROJECT_ROOT/public/data/astoria-conquest/astoria-base-map.geojson"
    "$PROJECT_ROOT/public/data/astoria-conquest/astoria-covered-streets.geojson"
    "$PROJECT_ROOT/public/data/astoria-conquest/astoria-progress-stats.json"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ Found: $(basename "$file")"
    else
        echo "   ❌ Missing: $(basename "$file")"
        exit 1
    fi
done
echo ""

# Step 6: Check git status
echo "6️⃣ Checking git changes..."
cd "$PROJECT_ROOT"
git status --short public/data/astoria-conquest/
echo ""

echo "🎉 All tests passed!"
echo ""
echo "📝 Next steps:"
echo "   1. Review the changes with: git diff public/data/astoria-conquest/"
echo "   2. If everything looks good, commit and push"
echo "   3. Render will do the same on Monday at 1:30 PM"
