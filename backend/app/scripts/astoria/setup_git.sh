#!/bin/bash
# Setup git SSH authentication for Render cron
# This script configures the SSH key so git can push to GitHub

set -e  # Exit on error

echo "🔐 Setting up git SSH authentication..."

# Create .ssh directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Write the deploy key from environment variable
echo "$DEPLOY_KEY" > ~/.ssh/id_ed25519
chmod 600 ~/.ssh/id_ed25519

# Add GitHub to known hosts (avoid SSH prompt)
ssh-keyscan -t ed25519 github.com >> ~/.ssh/known_hosts 2>/dev/null

# Configure git
git config --global user.name "Astoria Conquest Bot"
git config --global user.email "astoria-bot@camilomartinez.co"

# Navigate to project root and configure remote
cd /opt/render/project/src

# Check if we're in a git repository
if [ -d .git ]; then
    # Set remote URL to use SSH
    git remote set-url origin git@github.com:camilojourney/camilomartinez-portfolio.git || \
    git remote add origin git@github.com:camilojourney/camilomartinez-portfolio.git
else
    echo "⚠️  Not a git repository - skipping remote configuration"
fi

echo "✅ Git SSH authentication configured"
