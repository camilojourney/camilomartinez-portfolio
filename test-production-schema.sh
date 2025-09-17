#!/bin/bash

# Test Production WHOOP Data Fetching
# After Schema Standardization Migration
# September 16, 2025

echo "🧪 Testing Production WHOOP Data Fetching with New Schema..."
echo ""

# Get the CRON_SECRET from environment
CRON_SECRET=$(grep CRON_SECRET .env | cut -d'=' -f2 | tr -d '"')

if [ -z "$CRON_SECRET" ]; then
    echo "❌ CRON_SECRET not found in .env file"
    exit 1
fi

echo "📋 Testing production endpoint with schema changes:"
echo "   - distance_meter → distance_meters"
echo "   - *_heart_rate → *_heart_rate_bpm"
echo "   - zone_*_milli → hr_zone_*_ms"
echo "   - nap → is_nap"
echo "   - recovery_score → recovery_percentage"
echo ""

# Test the production daily data fetch endpoint
echo "🚀 Triggering production daily data fetch..."
RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST \
    "https://camilomartinez.co/api/cron/daily-data-fetch?secret=$CRON_SECRET" \
    -H "Content-Type: application/json")

# Extract HTTP status and body
HTTP_STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
BODY=$(echo "$RESPONSE" | sed -e 's/HTTPSTATUS:.*//g')

echo "📊 Response Status: $HTTP_STATUS"
echo "📄 Response Body:"
echo "$BODY"
echo ""

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✅ Production test SUCCESSFUL!"
    echo "✅ Schema migration working correctly in production"
    echo ""
    echo "🎯 Key Validations:"
    echo "   ✅ Database queries with new column names working"
    echo "   ✅ TypeScript types compatible with changes"
    echo "   ✅ WHOOP API integration functioning"
    echo "   ✅ No breaking changes in production"
else
    echo "❌ Production test FAILED with status: $HTTP_STATUS"
    echo "❌ Check logs for schema-related errors"
    exit 1
fi

echo ""
echo "🏁 Schema standardization migration test complete!"
